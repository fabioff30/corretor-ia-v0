import { type NextRequest, NextResponse } from "next/server"
import { logRequest } from "@/utils/logger"
import { WEBHOOK_URL, FALLBACK_WEBHOOK_URL, PREMIUM_WEBHOOK_URL, DEEPSEEK_STREAM_WEBHOOK_URL, DEEPSEEK_LONG_TEXT_THRESHOLD, AUTH_TOKEN } from "@/utils/constants"
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
import { saveCorrection, canUserPerformOperation, incrementUserUsage } from "@/utils/limit-checker"
import { safeJsonParse, extractValidJson } from "@/utils/safe-json-fetch"

// Increased to 300s to allow premium endpoints with ultrathink processing (PREMIUM_FETCH_TIMEOUT = 295s)
export const maxDuration = 300

// Health check endpoint (GET /api/correct)
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
      tone = "Padrão",
      isPremium: isPremiumRequest = false,
    } = validatedInput
    const customTone = typeof requestBody?.customTone === "string" ? requestBody.customTone : undefined
    const useAdvancedAI = typeof requestBody?.useAdvancedAI === "boolean" ? requestBody.useAdvancedAI : false

    let isPremium = false
    let premiumContext: AuthContext | null = null

    // If useAdvancedAI is true, treat as premium request
    if (isPremiumRequest || useAdvancedAI) {
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

    // Check usage limits for authenticated free users
    // Try to get current user even if not a premium request
    let currentUserContext: AuthContext | null = premiumContext
    if (!currentUserContext) {
      try {
        currentUserContext = await getCurrentUserWithProfile()
      } catch {
        // Not authenticated, continue with regular flow
        currentUserContext = null
      }
    }

    // If user is authenticated, check their plan
    if (currentUserContext?.user) {
      const userId = currentUserContext.user.id
      const userPlan = currentUserContext.profile?.plan_type

      // Auto-detect premium status from user plan
      if (userPlan === 'pro' || userPlan === 'admin') {
        isPremium = true
        console.log(`API: Auto-detected premium user (${userPlan})`, requestId)
      }

      // Only check limits for free users
      if (userPlan === 'free' && !isPremium) {
        const limitCheck = await canUserPerformOperation(userId, 'correct')

        if (!limitCheck.allowed) {
          return NextResponse.json(
            {
              error: "Limite diário excedido",
              message: limitCheck.reason || "Você atingiu o limite diário de correções",
              details: [
                `Limite: ${limitCheck.limit} correções por dia`,
                "Faça upgrade para o plano Premium para correções ilimitadas"
              ]
            },
            { status: 429 }
          )
        }

        console.log(`API: Free user ${userId} - ${limitCheck.remaining}/${limitCheck.limit} corrections remaining`, requestId)
      }
    }

    // Validate text length (skip for premium users)
    if (!isPremium) {
      const lengthError = validateTextLength(text, 5000, requestId, ip)
      if (lengthError) return lengthError
    }

    console.log(`API: Processing ${isPremium ? 'PREMIUM' : 'regular'} ${isMobile ? "mobile" : "desktop"} text, length: ${text.length}`, requestId)
    console.log(`API: Selected tone: ${tone}`, requestId)
    if (useAdvancedAI && isPremium) {
      console.log(`API: Using Advanced AI (premium models)`, requestId)
    }

    // ========================
    // Webhook Selection Logic
    // ========================
    // For premium users: ALWAYS use premium webhook (handles DeepSeek internally with fallback)
    // For free users with very long text (>80k): Try streaming endpoint
    // For all other cases: Use regular webhook

    const textLength = text.length
    const acceptHeader = request.headers.get("Accept") || ""
    const clientAcceptsSSE = acceptHeader.includes("text/event-stream")

    // SSE streaming threshold - matches worker PARALLEL_CHUNK_SIZE
    const STREAMING_THRESHOLD = 5000 // Use streaming for texts > 5k chars

    // For texts > 5k AND client accepts SSE, use streaming with progress
    // Premium users get Gemini 3 Pro Preview with SSE
    // Free users get DeepSeek streaming
    if (textLength >= STREAMING_THRESHOLD && clientAcceptsSSE) {
      const streamUrl = isPremium ? PREMIUM_WEBHOOK_URL : DEEPSEEK_STREAM_WEBHOOK_URL
      console.log(`API: Routing to ${isPremium ? 'Premium Gemini' : 'DeepSeek'} streaming for long text (${textLength} chars)`, requestId)

      try {
        const streamResponse = await fetch(streamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "X-Request-ID": requestId,
          },
          body: JSON.stringify({
            text,
            authToken: AUTH_TOKEN,
          }),
        })

        if (streamResponse.ok && streamResponse.headers.get("Content-Type")?.includes("text/event-stream")) {
          // Return SSE stream directly to client for real-time progress
          console.log(`API: Streaming SSE response to client`, requestId)
          return new Response(streamResponse.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
              "X-Request-ID": requestId,
            },
          })
        } else if (streamResponse.ok) {
          // Worker returned JSON instead of SSE - process normally
          console.log(`API: Worker returned JSON instead of SSE, processing normally`, requestId)
          // Continue to regular processing below
        } else {
          console.error(`API: Streaming failed (${streamResponse.status}), falling back to regular webhook`, requestId)
        }
      } catch (streamError) {
        console.error("API: Streaming error, falling back to regular webhook", streamError, requestId)
      }
    }

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

    // Check if response is SSE (Server-Sent Events)
    const contentType = response.headers.get("Content-Type") || ""
    const isSSE = contentType.includes("text/event-stream")

    // Parse and normalize response
    console.log(`API: Processing ${isSSE ? 'SSE' : 'JSON'} response`, requestId)
    let data
    try {
      const responseText = await response.text()
      console.log(`API: Response text received (${responseText.length} characters)`, requestId)

      if (!responseText || responseText.trim() === "") {
        console.error("API: Empty response from webhook", requestId)
        throw new Error("Empty response from webhook")
      }

      // Handle SSE responses (from premium webhook with chunking)
      if (isSSE) {
        console.log("API: Parsing SSE response to extract complete event", requestId)

        // Find the 'complete' event in the SSE stream
        // The data after "event: complete\ndata: " until the next double newline
        const completeEventStart = responseText.indexOf("event: complete\ndata: ")
        if (completeEventStart !== -1) {
          const dataStart = completeEventStart + "event: complete\ndata: ".length
          const dataEnd = responseText.indexOf("\n\n", dataStart)
          const jsonData = dataEnd !== -1
            ? responseText.substring(dataStart, dataEnd)
            : responseText.substring(dataStart)

          const parseResult = safeJsonParse<any>(jsonData)
          if (parseResult.success) {
            data = parseResult.data
            console.log("API: Successfully extracted data from SSE complete event", requestId)
          } else {
            // Try extractValidJson as fallback
            const extractResult = extractValidJson<any>(jsonData)
            if (extractResult.success) {
              data = extractResult.data
              console.log("API: Extracted data from SSE complete event (with recovery)", requestId)
            } else {
              throw new Error("Failed to parse SSE complete event: " + parseResult.error)
            }
          }
        } else {
          // Try to find any JSON with correctedText in the response
          const jsonMatch = extractValidJson<any>(responseText)
          if (jsonMatch.success && jsonMatch.data?.correctedText) {
            data = jsonMatch.data
            console.log("API: Extracted data from SSE response (fallback)", requestId)
          } else {
            throw new Error("No complete event or valid JSON found in SSE response")
          }
        }
      } else {
        // Standard JSON response
        // Use safe JSON parsing with recovery for malformed JSON
        let parseResult = safeJsonParse<any>(responseText)

        // If parsing fails, attempt to extract valid JSON
        if (!parseResult.success) {
          console.info("API: Attempting to recover from malformed JSON...", requestId)
          parseResult = extractValidJson<any>(responseText)
        }

        // If still failed, throw error to trigger fallback
        if (!parseResult.success) {
          throw new Error(parseResult.error || "Failed to parse JSON response")
        }

        data = parseResult.data
      }
    } catch (parseError) {
      console.warn("API: Webhook returned empty or malformed response, using fallback", requestId)

      logRequest(requestId, {
        status: 200,
        processingTime: Date.now() - startTime,
        textLength: text.length,
        ip,
        cfRay,
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

    if (customTone?.trim()) {
      processedEvaluation = {
        ...processedEvaluation,
        toneApplied: customTone.trim(),
      }
    } else if (tone && tone !== "Padrão") {
      processedEvaluation = {
        ...processedEvaluation,
        toneApplied: tone,
      }
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
      // Use currentUserContext when isPremium was auto-detected from profile
      const premiumUser = premiumContext?.user || currentUserContext?.user

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

      const toneStyleToPersist = customTone?.trim() ? customTone.trim() : tone

      const saveResult = await saveCorrection({
        userId: premiumUser.id,
        originalText: text,
        correctedText: normalized.text,
        operationType: "correct",
        toneStyle: toneStyleToPersist,
        evaluation: processedEvaluation,
      })

      if (saveResult.success && saveResult.id) {
        correctionId = saveResult.id
      } else if (!saveResult.success) {
        console.error(
          "API: Failed to persist premium correction",
          saveResult.error,
          requestId
        )
      }
    } else if (currentUserContext?.user && currentUserContext.profile?.plan_type === 'free') {
      // For free users, save correction and increment usage
      const userId = currentUserContext.user.id
      const toneStyleToPersist = customTone?.trim() ? customTone.trim() : tone

      // Save correction to history
      const saveResult = await saveCorrection({
        userId,
        originalText: text,
        correctedText: normalized.text,
        operationType: "correct",
        toneStyle: toneStyleToPersist,
        evaluation: processedEvaluation,
      })

      if (saveResult.success && saveResult.id) {
        correctionId = saveResult.id
      } else if (!saveResult.success) {
        console.error(
          "API: Failed to persist free user correction",
          saveResult.error,
          requestId
        )
      }

      // Increment usage counter
      const incrementResult = await incrementUserUsage(userId, 'correct')
      if (!incrementResult.success) {
        console.error(
          "API: Failed to increment usage for free user",
          incrementResult.error,
          requestId
        )
      } else {
        console.log(`API: Successfully incremented usage for free user ${userId}`, requestId)
      }
    }

    const apiResponse = NextResponse.json({
      correctedText: normalized.text,
      evaluation: processedEvaluation,
      correctionId,
    })

    apiResponse.headers.set("X-API-Version", "2.0")
    apiResponse.headers.set("X-Service", "CorretorIA-Correction")
    apiResponse.headers.set("X-Request-ID", requestId)
    apiResponse.headers.set("X-Processing-Time", `${processingTime}ms`)
    apiResponse.headers.set("X-Text-Length", text.length.toString())
    const sanitizedTone = sanitizeHeaderValue(customTone?.trim() || tone) || "default"
    apiResponse.headers.set("X-Tone-Applied", sanitizedTone)
    if (cfRay) {
      apiResponse.headers.set("CF-Ray", cfRay)
    }

    return apiResponse
  } catch (error) {
    return handleGeneralError(error as Error, requestId, ip, requestBody?.text || "", startTime, "correction")
  }
}
