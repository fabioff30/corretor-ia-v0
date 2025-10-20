import { type NextRequest, NextResponse } from "next/server"
import { logRequest } from "@/utils/logger"
import { ANALYSIS_WEBHOOK_URL, AI_DETECTOR_CHARACTER_LIMIT, AI_DETECTOR_DAILY_LIMIT } from "@/utils/constants"
import { parseRequestBody, validateTextLength } from "@/lib/api/shared-handlers"
import { callWebhook } from "@/lib/api/webhook-client"
import { handleGeneralError, handleWebhookError } from "@/lib/api/error-handlers"
import { dailyRateLimiter } from "@/lib/api/daily-rate-limit"
import { getCurrentUserWithProfile, type AuthContext } from "@/utils/auth-helpers"
import { saveCorrection } from "@/utils/limit-checker"

export const maxDuration = 120

interface Signal {
  category: string
  direction: string
  description: string
  terms?: string[]
  count?: number
}

interface AIDetectionResponse {
  result: {
    verdict: "ai" | "human" | "uncertain"
    probability: number
    confidence: "low" | "medium" | "high"
    explanation?: string
    signals: string[]
  }
  textStats: {
    words: number
    characters: number
    sentences: number
    avgSentenceLength?: number
    avgWordLength?: number
    uppercaseRatio?: number
    digitRatio?: number
    punctuationRatio?: number
  }
  brazilianism?: {
    found: boolean
    count?: number
    score?: number
    explanation?: string
    terms?: Array<{ term: string; count: number }>
    source?: string
    version?: string
  }
  grammarSummary?: {
    errors: number
    grammarErrors?: number
    orthographyErrors?: number
    concordanceErrors?: number
    evaluation?: string
    confidence?: string
    model?: string
    details?: string[]
  }
  metadata: {
    promptVersion?: string
    termsVersion?: string
    termsSignature?: string
    models?: string[]
    grammarErrors?: number
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

  // Parse request body
  const { body: requestBody, error: parseError } = await parseRequestBody(request, requestId)
  if (parseError) return parseError

  try {
    const { text, isPremium: isPremiumRequest = false } = requestBody || {}

    let isPremium = false
    let premiumContext: AuthContext | null = null

    if (isPremiumRequest) {
      premiumContext = await getCurrentUserWithProfile()

      const premiumUser = premiumContext.user
      const premiumProfile = premiumContext.profile

      if (!premiumUser || !premiumProfile) {
        return NextResponse.json(
          { error: "Não autorizado", message: "Usuário não autenticado" },
          { status: 401 },
        )
      }

      if (premiumProfile.plan_type !== "pro" && premiumProfile.plan_type !== "admin") {
        return NextResponse.json(
          {
            error: "Acesso restrito",
            message: "É necessário um plano Premium ou Admin para usar este recurso.",
          },
          { status: 403 },
        )
      }

      isPremium = true
    }

    // Apply daily rate limiting (skip for premium users)
    if (!isPremium) {
      const rateLimitResponse = await dailyRateLimiter(request, "ai-detector", AI_DETECTOR_DAILY_LIMIT)
      if (rateLimitResponse) return rateLimitResponse
    } else {
      console.log(`API: PREMIUM user - skipping daily rate limit`, requestId)
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Texto inválido", message: "O campo 'text' é obrigatório" },
        { status: 400 }
      )
    }

    // Validate text length (10,000 characters max for free, unlimited for premium)
    if (!isPremium) {
      const lengthError = validateTextLength(text, AI_DETECTOR_CHARACTER_LIMIT, requestId, ip)
      if (lengthError) return lengthError
    }

    console.log(`API: Processing ${isPremium ? 'PREMIUM' : 'regular'} AI detection for text, length: ${text.length}`, requestId)

    // Call webhook
    const response = await callWebhook({
      url: ANALYSIS_WEBHOOK_URL,
      text,
      requestId,
      additionalData: {},
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API: Server error: ${response.status} ${response.statusText}`, errorText, requestId)
      return handleWebhookError(response, requestId, ip)
    }

    // Parse response
    console.log("API: Processing JSON response", requestId)
    const data = await response.json()
    console.log("API: Webhook raw response data:", JSON.stringify(data).substring(0, 200), requestId)

    // Normalize response
    const normalized: AIDetectionResponse = normalizeAIDetectionResponse(data)
    console.log("API: Normalized response:", JSON.stringify(normalized).substring(0, 200), requestId)

    let correctionId: string | null = null

    if (isPremium) {
      const premiumUser = premiumContext?.user

      if (!premiumUser) {
        return NextResponse.json(
          { error: "Não autorizado", message: "Usuário não autenticado" },
          { status: 401 },
        )
      }

      const compactSummary = {
        verdict: normalized.result.verdict,
        probability: normalized.result.probability,
        confidence: normalized.result.confidence,
        topSignals: normalized.result.signals.slice(0, 3),
      }

      const saveResult = await saveCorrection({
        userId: premiumUser.id,
        originalText: text,
        correctedText: JSON.stringify(compactSummary),
        operationType: "ai_analysis",
        toneStyle: "ai-detector",
        evaluation: normalized,
      })

      if (saveResult.success && saveResult.id) {
        correctionId = saveResult.id
      } else if (!saveResult.success) {
        console.error("API: Failed to persist AI detection", saveResult.error, requestId)
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

    console.log("API: Sending AI detection result to client", requestId)

    // Build response with headers
    const apiResponse = NextResponse.json({ ...normalized, correctionId })
    apiResponse.headers.set("X-API-Version", "2.0")
    apiResponse.headers.set("X-Service", "CorretorIA-AI-Detector")
    apiResponse.headers.set("X-Request-ID", requestId)
    apiResponse.headers.set("X-Processing-Time", `${processingTime}ms`)

    return apiResponse
  } catch (error) {
    return handleGeneralError(error as Error, requestId, ip, requestBody?.text || "", startTime, "correction")
  }
}

/**
 * Normalizes AI detection response from various formats
 */
function normalizeAIDetectionResponse(data: any): AIDetectionResponse {
  // Handle different response formats
  const result = data.result || {}
  const textStats = data.textStats || {}
  const brazilianism = data.brazilianism || {}
  const grammarSummary = data.grammarSummary || {}
  const metadata = data.metadata || {}

  // Normalize brazilianism terms
  let normalizedTerms: Array<{ term: string; count: number }> = []
  if (Array.isArray(brazilianism.terms)) {
    normalizedTerms = brazilianism.terms
  } else if (brazilianism.terms && typeof brazilianism.terms === 'object') {
    normalizedTerms = Object.entries(brazilianism.terms).map(([term, count]) => ({
      term,
      count: typeof count === 'number' ? count : 1
    }))
  }

  // Normalize signals - handle arrays of objects or strings
  let normalizedSignals: string[] = []
  if (Array.isArray(result.signals)) {
    normalizedSignals = result.signals.map((signal: any) => {
      if (typeof signal === 'string') {
        return signal
      } else if (signal && typeof signal === 'object') {
        // Format: [Category] Description
        const category = signal.category ? `[${signal.category}] ` : ''
        return category + (signal.description || signal.text || JSON.stringify(signal))
      }
      return String(signal)
    })
  } else if (result.signals && typeof result.signals === 'object') {
    normalizedSignals = Object.values(result.signals).map((v: any) => {
      if (typeof v === 'string') return v
      if (v && typeof v === 'object') {
        const category = v.category ? `[${v.category}] ` : ''
        return category + (v.description || v.text || JSON.stringify(v))
      }
      return String(v)
    })
  }

  // Parse numbers safely
  const parseNum = (val: any): number => {
    if (typeof val === 'number') return val
    const parsed = parseFloat(val)
    return isNaN(parsed) ? 0 : parsed
  }

  return {
    result: {
      verdict: result.verdict || "uncertain",
      probability: typeof result.probability === "number" ? result.probability : 0.5,
      confidence: result.confidence || "medium",
      explanation: result.explanation,
      signals: normalizedSignals,
    },
    textStats: {
      // Map API fields to our interface
      words: parseNum(textStats.wordCount || textStats.words),
      characters: parseNum(textStats.charCount || textStats.characters),
      sentences: parseNum(textStats.sentenceCount || textStats.paragraphs || textStats.sentences),
      avgSentenceLength: parseNum(textStats.avgSentenceLength),
      avgWordLength: parseNum(textStats.avgWordLength),
      uppercaseRatio: parseNum(textStats.uppercaseRatio),
      digitRatio: parseNum(textStats.digitRatio),
      punctuationRatio: parseNum(textStats.punctuationRatio),
    },
    brazilianism: {
      found: Boolean(brazilianism.found || brazilianism.available),
      count: parseNum(brazilianism.count),
      score: parseNum(brazilianism.score),
      explanation: brazilianism.explanation,
      terms: normalizedTerms,
      source: brazilianism.source,
      version: brazilianism.version,
    },
    grammarSummary: {
      errors: parseNum(grammarSummary.grammarErrors || grammarSummary.errors || metadata.grammarErrors),
      grammarErrors: parseNum(grammarSummary.grammarErrors),
      orthographyErrors: parseNum(grammarSummary.orthographyErrors),
      concordanceErrors: parseNum(grammarSummary.concordanceErrors),
      evaluation: grammarSummary.evaluation,
      confidence: grammarSummary.confidence,
      model: grammarSummary.model,
      details: Array.isArray(grammarSummary.details) ? grammarSummary.details : [],
    },
    metadata: {
      promptVersion: metadata.promptVersion,
      termsVersion: metadata.termsVersion,
      termsSignature: metadata.termsSignature,
      models: Array.isArray(metadata.models) ? metadata.models : [],
      grammarErrors: parseNum(metadata.grammarErrors),
    },
  }
}
