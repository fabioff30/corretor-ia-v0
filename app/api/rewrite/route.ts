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
import { getCurrentUser } from "@/utils/auth-helpers"
import { saveCorrection } from "@/utils/limit-checker"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

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

    const { text, isMobile, style, isPremium = false } = validatedInput
    const rewriteStyle = style || "formal"

    // Validate text length (skip for premium users)
    if (!isPremium) {
      const lengthError = validateTextLength(text, 5000, requestId, ip)
      if (lengthError) return lengthError
    }

    console.log(`API: Processing ${isPremium ? 'PREMIUM' : 'regular'} ${isMobile ? "mobile" : "desktop"} text, length: ${text.length}`, requestId)
    console.log(`API: Rewrite style selected: ${rewriteStyle}`, requestId)

    // Call webhook (use premium webhook for premium users)
    const webhookUrl = isPremium ? PREMIUM_REWRITE_WEBHOOK_URL : REWRITE_WEBHOOK_URL
    console.log(`API: Using ${isPremium ? 'PREMIUM' : 'regular'} rewrite webhook`, requestId)

    const response = await callWebhook({
      url: webhookUrl,
      text,
      requestId,
      additionalData: { style: rewriteStyle },
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
    })

    console.log("API: Sending processed response to client", requestId)

    // Build response with debug headers
    let correctionId: string | null = null

    if (isPremium) {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json(
          { error: "Não autorizado", message: "Usuário não autenticado" },
          { status: 401 }
        )
      }

      const saveResult = await saveCorrection({
        userId: user.id,
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

    return apiResponse
  } catch (error) {
    return handleGeneralError(error as Error, requestId, ip, requestBody?.text || "", startTime, "rewrite")
  }
}
