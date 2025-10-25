import { type NextRequest, NextResponse } from "next/server"
import { logRequest } from "@/utils/logger"
import { REWRITE_WEBHOOK_URL } from "@/utils/constants"
import {
  applyRateLimit,
  validateAndSanitizeInput,
  parseRequestBody,
  validateTextLength,
} from "@/lib/api/shared-handlers"
import { callWebhook } from "@/lib/api/webhook-client"
import { handleGeneralError, handleWebhookError } from "@/lib/api/error-handlers"
import { normalizeWebhookResponse } from "@/lib/api/response-normalizer"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

  // Parse request body
  let requestBody: any = {}
  try {
    const bodyText = await request.text()
    console.log("API: Request body received:", bodyText, requestId)

    if (bodyText && bodyText.trim()) {
      try {
        requestBody = JSON.parse(bodyText)
        console.log("API: JSON data parsed successfully:", JSON.stringify(requestBody), requestId)
      } catch (parseError) {
        console.error("API: Error parsing JSON:", parseError, requestId)
        requestBody = { tone: "Padrão" }
      }
    } else {
      console.warn("API: Empty or invalid request body", requestId)
      requestBody = { tone: "Padrão" }
    }
  } catch (readError) {
    console.error("API: Error reading request body:", readError, requestId)
    requestBody = { tone: "Padrão" }
  }

  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, requestId)
    if (rateLimitResponse) return rateLimitResponse

    // Validate and sanitize input
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(requestBody),
    })

    const validatedInput = await validateAndSanitizeInput(newRequest, requestBody, requestId)
    if (validatedInput instanceof NextResponse) return validatedInput

    const { text, isMobile } = validatedInput
    const tone = requestBody.tone || "Padrão"

    // Validate text length
    const lengthError = validateTextLength(text, 5000, requestId, ip)
    if (lengthError) return lengthError

    console.log(`API: Processing ${isMobile ? "mobile" : "desktop"} text, length: ${text.length}`, requestId)
    console.log(`API: Tone selected: ${tone}`, requestId)

    // Call webhook using tone as style
    const response = await callWebhook({
      url: REWRITE_WEBHOOK_URL,
      text,
      requestId,
      additionalData: {
        style: tone,
        source: isMobile ? "mobile" : "desktop",
      },
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

    // Normalize response
    const normalized = normalizeWebhookResponse(
      data,
      requestId,
      ["rewrittenText", "adjustedText", "text"]
    )

    // Build evaluation for tone adjustment
    const evaluation = normalized.evaluation
    const processedData = {
      adjustedText: normalized.text,
      evaluation: {
        toneApplied: evaluation.styleApplied || tone,
        changes: evaluation.changes || ["Tom aplicado com sucesso"],
        suggestions: evaluation.suggestions || [],
      },
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
    return NextResponse.json(processedData)
  } catch (error) {
    const err = error as Error
    console.error("API: Error processing tone adjustment:", err, requestId)

    // Create specific fallback response for tone adjustment
    try {
      const fallbackResponse = {
        adjustedText: requestBody?.text || "",
        evaluation: {
          toneApplied: "Padrão",
          changes: ["Não foi possível aplicar o ajuste de tom devido a um erro no serviço"],
          suggestions: [
            "Tente novamente mais tarde ou com um texto menor",
            "Verifique se o texto contém caracteres especiais ou formatação complexa",
          ],
        },
      }

      console.log("API: Using fallback response due to error", requestId)

      logRequest(requestId, {
        status: 200,
        processingTime: Date.now() - startTime,
        textLength: (requestBody?.text || "").length,
        ip,
        fallbackUsed: true,
        generalError: err.message,
      })

      return NextResponse.json(fallbackResponse)
    } catch (fallbackError) {
      return handleGeneralError(err, requestId, ip, requestBody?.text || "", startTime, "rewrite")
    }
  }
}
