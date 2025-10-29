import { type NextRequest, NextResponse } from "next/server"
import { logRequest } from "@/utils/logger"
import { REWRITE_WEBHOOK_URL, PREMIUM_REWRITE_WEBHOOK_URL } from "@/utils/constants"
import { sanitizeHeaderValue } from "@/utils/http-headers"
import {
  applyRateLimit,
  validateAndSanitizeInput,
  parseRequestBody,
  validateTextLength,
} from "@/lib/api/shared-handlers"
import { callWebhook } from "@/lib/api/webhook-client"
import { handleGeneralError, handleWebhookError } from "@/lib/api/error-handlers"
import { normalizeWebhookResponse } from "@/lib/api/response-normalizer"
import { getCurrentUserWithProfile, type AuthContext } from "@/utils/auth-helpers"
import { saveCorrection } from "@/utils/limit-checker"
import { isStylePremium } from "@/utils/rewrite-styles"

export const dynamic = "force-dynamic"
// Increased to 300s to allow premium endpoints with ultrathink processing (PREMIUM_FETCH_TIMEOUT = 295s)
export const maxDuration = 300

// Health check endpoint (GET /api/rewrite)
export async function GET() {
  return NextResponse.json({ status: "OK" })
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  const cfRay = request.headers.get("cf-ray") || undefined

  // Parse request body
  const { body: requestBody, error: parseError } = await parseRequestBody(request, requestId)
  if (parseError) return parseError

  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, requestId)
    if (rateLimitResponse) return rateLimitResponse

    // Validate and sanitize input
    const validatedInput = await validateAndSanitizeInput(request, requestBody, requestId)
    if (validatedInput instanceof NextResponse) return validatedInput

    const {
      text,
      isMobile,
      style,
      isPremium: isPremiumRequest = false,
    } = validatedInput
    const rewriteStyle = (style || "formal").toLowerCase() as any

    let isPremium = false
    let premiumContext: AuthContext | null = null

    if (isPremiumRequest) {
      premiumContext = await getCurrentUserWithProfile()

      const premiumUser = premiumContext.user
      const premiumProfile = premiumContext.profile

      if (!premiumUser || !premiumProfile) {
        return NextResponse.json(
          {
            error: "Não autorizado",
            message: "Usuário não autenticado",
            details: ["Faça login para usar recursos premium"]
          },
          { status: 401 },
        )
      }

      if (premiumProfile.plan_type !== "pro" && premiumProfile.plan_type !== "admin") {
        return NextResponse.json(
          {
            error: "Acesso restrito",
            message: "É necessário um plano Premium ou Admin para usar este recurso.",
            details: ["Faça upgrade para um plano Premium ou Admin"]
          },
          { status: 403 },
        )
      }

      isPremium = true
    }

    // Validar se estilo é premium e usuário não tem acesso
    if (isStylePremium(rewriteStyle) && !isPremium) {
      console.log(`API: Tentativa de usar estilo premium ${rewriteStyle} sem assinatura`, requestId)
      return NextResponse.json(
        {
          error: "Acesso restrito",
          message: "Este estilo de reescrita é exclusivo do plano Premium.",
          details: ["Faça upgrade para um plano Premium para usar este estilo"],
        },
        { status: 403 },
      )
    }

    // Validate text length (skip for premium users)
    if (!isPremium) {
      const lengthError = validateTextLength(text, 5000, requestId, ip)
      if (lengthError) return lengthError
    }

    console.log(`API: Processing ${isPremium ? 'PREMIUM' : 'regular'} ${isMobile ? "mobile" : "desktop"} text, length: ${text.length}`, requestId)
    console.log(`API: Rewrite style selected: ${rewriteStyle}`, requestId)

    // Convert style to CAPSLOCK format for webhook API
    // Map internal style names to API format (e.g., "formal" -> "FORMAL", "blog_post" -> "BLOG POST")
    const styleToApiFormat: Record<string, string> = {
      "formal": "FORMAL",
      "humanized": "HUMANIZADO",
      "academic": "ACADÊMICO",
      "creative": "CRIATIVO",
      "childlike": "COMO_UMA_CRIANCA",
      "technical": "TÉCNICO",
      "journalistic": "JORNALÍSTICO",
      "advertising": "PUBLICITÁRIO",
      "blog_post": "BLOG_POST",
      "reels_script": "ROTEIRO_REELS",
      "youtube_script": "ROTEIRO_YOUTUBE",
      "presentation": "PALESTRA_APRESENTACAO",
    }

    const apiStyle = styleToApiFormat[rewriteStyle] || rewriteStyle.toUpperCase()

    // Call webhook (use premium webhook for premium users)
    const webhookUrl = isPremium ? PREMIUM_REWRITE_WEBHOOK_URL : REWRITE_WEBHOOK_URL
    console.log(`API: Using ${isPremium ? 'PREMIUM' : 'regular'} rewrite webhook`, requestId)
    console.log(`API: Sending style in API format: ${apiStyle}`, requestId)

    const response = await callWebhook({
      url: webhookUrl,
      text,
      requestId,
      additionalData: { style: apiStyle },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API: Server error: ${response.status} ${response.statusText}`, errorText, requestId)
      return handleWebhookError(response, requestId, ip)
    }

    // Parse and normalize response
    console.log("API: Processing JSON response", requestId)
    const data = await response.json()
    console.log("API: JSON response processed successfully", requestId)

    // Normalize response with multiple possible field names
    const normalized = normalizeWebhookResponse(
      data,
      requestId,
      ["rewrittenText", "adjustedText", "correctedText", "text"]
    )

    // Adapt evaluation for rewrite context
    let evaluation = normalized.evaluation

    // Extract style information if available
    const toneApplied = evaluation.toneApplied || evaluation.styleApplied || rewriteStyle
    const changes = evaluation.changes || []

    // Build comprehensive evaluation
    const processedEvaluation = {
      strengths: evaluation.strengths.length > 0 ? evaluation.strengths : changes.length > 0 ? changes : ["Texto reescrito com sucesso"],
      weaknesses: evaluation.weaknesses || [],
      suggestions: evaluation.suggestions.length > 0 ? evaluation.suggestions : changes,
      score: evaluation.score,
      toneApplied,
      styleApplied: evaluation.styleApplied || rewriteStyle,
      changes,
    }

    // Log success
    const processingTime = Date.now() - startTime
    logRequest(requestId, {
      status: 200,
      processingTime,
      textLength: text.length,
      ip,
      cfRay,
    })

    console.log("API: Sending processed response to client", requestId)

    // Build response with debug headers
    let correctionId: string | null = null

    if (isPremium) {
      const premiumUser = premiumContext?.user

      if (!premiumUser) {
        return NextResponse.json(
          {
            error: "Não autorizado",
            message: "Usuário não autenticado",
            details: ["Faça login para usar recursos premium"]
          },
          { status: 401 },
        )
      }

      const saveResult = await saveCorrection({
        userId: premiumUser.id,
        originalText: text,
        correctedText: normalized.text,
        operationType: "rewrite",
        toneStyle: rewriteStyle,
        evaluation: processedEvaluation,
      })

      if (saveResult.success && saveResult.id) {
        correctionId = saveResult.id
      } else if (!saveResult.success) {
        console.error("API: Failed to persist premium rewrite", saveResult.error, requestId)
      }
    }

    const apiResponse = NextResponse.json({
      rewrittenText: normalized.text,
      evaluation: processedEvaluation,
      correctionId,
    })

    apiResponse.headers.set("X-API-Version", "2.0")
    apiResponse.headers.set("X-Service", "CorretorIA-Rewrite")
    apiResponse.headers.set("X-Request-ID", requestId)
    apiResponse.headers.set("X-Processing-Time", `${processingTime}ms`)
    apiResponse.headers.set("X-Text-Length", text.length.toString())
    const sanitizedStyle = sanitizeHeaderValue(rewriteStyle) || "default"
    apiResponse.headers.set("X-Style-Applied", sanitizedStyle)
    if (cfRay) {
      apiResponse.headers.set("CF-Ray", cfRay)
    }

    return apiResponse
  } catch (error) {
    return handleGeneralError(error as Error, requestId, ip, requestBody?.text || "", startTime, "rewrite")
  }
}
