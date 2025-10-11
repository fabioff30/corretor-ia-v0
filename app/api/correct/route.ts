import { type NextRequest, NextResponse } from "next/server"
import { logRequest } from "@/utils/logger"
import { WEBHOOK_URL, FALLBACK_WEBHOOK_URL, PREMIUM_WEBHOOK_URL } from "@/utils/constants"
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

    const { text, isMobile, tone = "Padrão", isPremium = false } = validatedInput

    // Validate text length (skip for premium users)
    if (!isPremium) {
      const lengthError = validateTextLength(text, 5000, requestId, ip)
      if (lengthError) return lengthError
    }

    console.log(`API: Processing ${isPremium ? 'PREMIUM' : 'regular'} ${isMobile ? "mobile" : "desktop"} text, length: ${text.length}`, requestId)
    console.log(`API: Selected tone: ${tone}`, requestId)

    // Call webhook (use premium webhook for premium users)
    const webhookData: Record<string, any> = {
      source: isMobile ? "mobile" : "desktop",
    }

    // Add tone if not default
    if (tone !== "Padrão") {
      webhookData.tone = tone
    }

    const webhookUrl = isPremium ? PREMIUM_WEBHOOK_URL : WEBHOOK_URL
    console.log(`API: Using ${isPremium ? 'PREMIUM' : 'regular'} webhook`, requestId)

    const response = await callWebhook({
      url: webhookUrl,
      fallbackUrl: FALLBACK_WEBHOOK_URL,
      text,
      requestId,
      additionalData: webhookData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API: Server error: ${response.status} ${response.statusText}`, errorText, requestId)
      return handleWebhookError(response, requestId, ip)
    }

    // Parse and normalize response
    console.log("API: Processing JSON response", requestId)
    let data
    try {
      const responseText = await response.text()
      console.log(`API: Response text received (${responseText.length} characters)`, requestId)

      if (!responseText || responseText.trim() === "") {
        console.error("API: Empty response from webhook", requestId)
        throw new Error("Empty response from webhook")
      }

      data = JSON.parse(responseText)
    } catch (parseError) {
      console.warn("API: Webhook returned empty or malformed response, using fallback", requestId)

      logRequest(requestId, {
        status: 200,
        processingTime: Date.now() - startTime,
        textLength: text.length,
        ip,
        fallbackUsed: true,
        webhookError: parseError instanceof Error ? parseError.message : String(parseError),
      })

      return NextResponse.json(
        {
          correctedText: text,
          evaluation: {
            strengths: ["Texto processado com sucesso"],
            weaknesses: ["Análise detalhada temporariamente indisponível"],
            suggestions: ["O texto foi mantido em sua forma original. Você pode revisá-lo manualmente se necessário."],
            score: 7,
          },
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      )
    }

    // Normalize response
    const normalized = normalizeWebhookResponse(data, requestId, ["correctedText", "text"])

    // Modify evaluation for tone adjustments
    let processedEvaluation = normalized.evaluation
    if (tone !== "Padrão") {
      console.log(`API: Modifying evaluation for tone "${tone}" - keeping only tone changes`, requestId)
      const toneChanges = normalized.evaluation.toneChanges || []

      processedEvaluation = {
        strengths: [],
        weaknesses: [],
        suggestions: [],
        score: 0,
        toneChanges: toneChanges,
      }
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
    const apiResponse = NextResponse.json({
      correctedText: normalized.text,
      evaluation: processedEvaluation,
    })

    apiResponse.headers.set("X-API-Version", "2.0")
    apiResponse.headers.set("X-Service", "CorretorIA-Correction")
    apiResponse.headers.set("X-Request-ID", requestId)
    apiResponse.headers.set("X-Processing-Time", `${processingTime}ms`)
    apiResponse.headers.set("X-Text-Length", text.length.toString())
    const sanitizedTone = sanitizeHeaderValue(tone) || "default"
    apiResponse.headers.set("X-Tone-Applied", sanitizedTone)

    return apiResponse
  } catch (error) {
    return handleGeneralError(error as Error, requestId, ip, requestBody?.text || "", startTime, "correction")
  }
}
