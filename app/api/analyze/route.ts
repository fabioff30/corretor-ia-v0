import { type NextRequest, NextResponse } from "next/server"
import { logRequest, logError } from "@/utils/logger"
import {
  HUMANIZE_ANALYSIS_URL,
  HUMANIZE_LIMITS,
  HUMANIZE_MODES,
  AUTH_TOKEN
} from "@/utils/constants"
import { fetchWithRetry } from "@/utils/fetch-retry"
import { humanizeRateLimiter, getHumanizeUsage } from "@/middleware/humanize-rate-limit"
import { checkFeatureLimit, recordFeatureUsage } from "@/utils/feature-limits"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export const maxDuration = 60 // Maximum execution time

// Function to detect if user is premium based on headers
const isPremiumUser = (request: NextRequest): boolean => {
  const isPremium = request.headers.get("x-user-premium") === "true"
  const userPlan = request.headers.get("x-user-plan")
  return isPremium || userPlan === "premium" || userPlan === "pro" || userPlan === "plus"
}

// Function to get user ID from headers/cookies
const getUserId = (request: NextRequest): string | null => {
  // Try to get from header first
  const userId = request.headers.get("x-user-id")
  if (userId) return userId

  // Try to get from cookie if not in header
  const cookieStore = cookies()
  const userCookie = cookieStore.get('user-id')
  return userCookie?.value || null
}

// Function to save analysis to history (only for Pro/Plus users)
const saveAnalysis = async (
  userId: string,
  originalText: string,
  analysisResult: any,
  analysisType: string
) => {
  try {
    const { error } = await supabase
      .from('analysis_history')
      .insert([
        {
          user_id: userId,
          original_text: originalText,
          analysis_result: analysisResult,
          analysis_type: analysisType,
          score: analysisResult?.score || 7,
          character_count: originalText.length
        }
      ])

    if (error) {
      console.error('Erro ao salvar análise no histórico:', error)
    } else {
      console.log('Análise salva no histórico com sucesso para usuário:', userId)
    }
  } catch (error) {
    console.error('Erro ao salvar análise:', error)
  }
}

// Function to validate humanization mode
const validateMode = (mode: string): string => {
  const validModes = Object.values(HUMANIZE_MODES)
  const normalizedMode = mode.toLowerCase().trim()
  return validModes.includes(normalizedMode) ? normalizedMode : HUMANIZE_MODES.DEFAULT
}

// Function to create fallback analysis response in case of error
const createFallbackAnalysis = (originalText: string, mode: string) => {
  const wordCount = originalText.trim().length
    ? originalText.trim().split(/\s+/).filter(Boolean).length
    : 0

  return {
    result: {
      verdict: "indefinido",
      probability: 0,
      confidence: "low",
      explanation: "Sistema temporariamente indisponível - exibindo análise básica.",
      signals: [],
      metadata: {
        mode,
        fallback: true,
      },
    },
    textStats: {
      charCount: originalText.length,
      wordCount,
      sentenceCount: 0,
    },
    metadata: {
      fallback: true,
    },
  }
}

const normalizeAnalysisPayload = (
  payload: any,
  originalText: string,
  mode: string
) => {
  if (!payload) {
    throw new Error("Resposta vazia")
  }

  const ensureStats = (stats?: any) => {
    if (stats) return stats
    const wordCount = originalText.trim().length
      ? originalText.trim().split(/\s+/).filter(Boolean).length
      : 0
    return {
      charCount: originalText.length,
      wordCount,
      sentenceCount: 0,
    }
  }

  const buildResponse = (result: any, extras?: { textStats?: any; termsSnapshot?: any; metadata?: any }) => {
    return {
      result: {
        verdict: result.verdict || "indefinido",
        probability: typeof result.probability === "number" ? result.probability : 0,
        confidence: result.confidence || "low",
        explanation: result.explanation || "",
        signals: Array.isArray(result.signals) ? result.signals : [],
        metadata: {
          ...(result.metadata || {}),
          mode,
        },
      },
      textStats: ensureStats(extras?.textStats || result.textStats),
      termsSnapshot: extras?.termsSnapshot || result.termsSnapshot || null,
      metadata: {
        ...(extras?.metadata || {}),
        ...(payload.metadata || {}),
      },
    }
  }

  if (payload.result && typeof payload.result === "object") {
    return buildResponse(payload.result, {
      textStats: payload.textStats,
      termsSnapshot: payload.termsSnapshot,
      metadata: payload.metadata,
    })
  }

  const maybeChoice = payload.choices?.[0]?.message?.content
  if (maybeChoice) {
    let parsedContent: any
    if (typeof maybeChoice === "string") {
      try {
        parsedContent = JSON.parse(maybeChoice)
      } catch (err) {
        throw new Error("Conteúdo do detector não é um JSON válido")
      }
    } else if (typeof maybeChoice === "object") {
      parsedContent = maybeChoice
    }

    if (!parsedContent) {
      throw new Error("Conteúdo do detector ausente")
    }

    return buildResponse(parsedContent, {
      textStats: parsedContent.textStats || payload.textStats,
      termsSnapshot: parsedContent.termsSnapshot || payload.termsSnapshot,
      metadata: parsedContent.metadata || payload.metadata,
    })
  }

  throw new Error("Resposta inválida do serviço de análise")
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    // Parse request body
    let requestBody: any
    try {
      requestBody = await request.json()
    } catch (parseError) {
      logRequest(requestId, {
        status: 400,
        message: "Invalid JSON in request body",
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })
      return NextResponse.json(
        {
          error: "Formato JSON inválido",
          message: "Corpo da requisição deve ser um JSON válido"
        },
        { status: 400 }
      )
    }

    console.log("API: Iniciando análise de IA", requestId)

    // Apply analysis-specific rate limiting
    const rateLimitResponse = await humanizeRateLimiter(request)
    if (rateLimitResponse) {
      logRequest(requestId, {
        status: 429,
        message: "Analysis rate limit exceeded",
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })
      return rateLimitResponse
    }

    // Validate and extract data
    const text = requestBody.text?.trim() || ""
    const mode = validateMode(requestBody.mode || HUMANIZE_MODES.DEFAULT)
    const isUserPremium = isPremiumUser(request)

    if (!text) {
      return NextResponse.json(
        {
          error: "Campo 'text' obrigatório",
          message: "O texto a ser analisado não pode estar vazio"
        },
        { status: 400 }
      )
    }

    // Check text length
    if (text.length > HUMANIZE_LIMITS.CHARACTER_LIMIT) {
      logRequest(requestId, {
        status: 413,
        message: "Text too large for analysis",
        textLength: text.length,
        maxAllowed: HUMANIZE_LIMITS.CHARACTER_LIMIT,
        isPremium: isUserPremium,
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })
      return NextResponse.json(
        {
          error: "Texto muito grande",
          message: `O texto não pode exceder ${HUMANIZE_LIMITS.CHARACTER_LIMIT} caracteres para análise.`,
          maxCharacters: HUMANIZE_LIMITS.CHARACTER_LIMIT,
          currentLength: text.length
        },
        { status: 413 }
      )
    }

    // Debug information
    const debugInfo = {
      requestId,
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      origin: request.headers.get("origin") || "unknown",
      referer: request.headers.get("referer") || "unknown",
      textLength: text.length,
      mode,
      isPremium: isUserPremium,
      webhookUrl: HUMANIZE_ANALYSIS_URL
    }

    console.log("API: Analysis request debug info:", JSON.stringify(debugInfo), requestId)

    // Check feature limit from database
    const userId = getUserId(request)
    if (userId) {
      const limitCheck = await checkFeatureLimit(userId, 'ai_analysis')

      if (!limitCheck.allowed) {
        logRequest(requestId, {
          status: 403,
          message: `Feature limit exceeded: ${limitCheck.reason}`,
          userId,
          feature: 'ai_analysis',
          daily_used: limitCheck.daily_used,
          daily_limit: limitCheck.daily_limit,
          monthly_used: limitCheck.monthly_used,
          monthly_limit: limitCheck.monthly_limit,
          ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
        })

        return NextResponse.json(
          {
            error: "Limite de uso excedido",
            message: limitCheck.reason === 'Daily limit reached'
              ? `Você atingiu o limite diário de ${limitCheck.daily_limit} análises de IA. Tente novamente amanhã ou faça upgrade para um plano superior.`
              : limitCheck.reason === 'Monthly limit reached'
              ? `Você atingiu o limite mensal de ${limitCheck.monthly_limit} análises de IA. Faça upgrade para continuar usando.`
              : `Recurso não disponível no seu plano atual.`,
            limits: {
              daily: { used: limitCheck.daily_used, limit: limitCheck.daily_limit },
              monthly: { used: limitCheck.monthly_used, limit: limitCheck.monthly_limit }
            }
          },
          { status: 403 }
        )
      }
    }

    // Get current usage information
    const usageInfo = await getHumanizeUsage(request)
    console.log(`API: Usuário ${isUserPremium ? 'premium' : 'gratuito'} - Uso: ${usageInfo.usage}/${usageInfo.limit}`, requestId)

    // Prepare request to analysis webhook (analysis-only mode)
    console.log(`API: Enviando texto para análise, modo: ${mode}`, requestId)

    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
      "X-Request-ID": requestId,
    }

    const webhookPayload = {
      text: text,
      mode: mode,
      authToken: AUTH_TOKEN,
      analysisOnly: true // Flag to indicate analysis-only mode
    }

    console.log(`API: Usando webhook: ${HUMANIZE_ANALYSIS_URL}`, requestId)
    console.log(`API: Headers:`, JSON.stringify(headers), requestId)

    // Make request to analysis API
    let response
    try {
      response = await fetchWithRetry(
        HUMANIZE_ANALYSIS_URL,
        {
          method: "POST",
          headers,
          body: JSON.stringify(webhookPayload),
        },
        {
          maxRetries: 2,
          timeout: HUMANIZE_LIMITS.TIMEOUT,
          retryDelay: 2000,
        }
      )

      console.log(`API: Resposta do webhook de análise com status ${response.status}`, requestId)
    } catch (webhookError) {
      const we = webhookError as Error
      console.error(`API: Erro ao acessar webhook de análise: ${we.message}`, requestId)

      logError(requestId, {
        status: 500,
        message: `Analysis webhook error: ${we.message}`,
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })

      // Return fallback analysis response
      const fallbackResult = createFallbackAnalysis(text, mode)
      console.log("API: Usando resposta de fallback devido a erro no webhook", requestId)
      return NextResponse.json(fallbackResult)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `API: Erro na resposta do webhook de análise: ${response.status} ${response.statusText}`,
        errorText,
        requestId,
      )

      logError(requestId, {
        status: response.status,
        message: `Analysis webhook error: ${response.statusText}`,
        details: errorText,
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })

      // Return fallback analysis response for API errors
      const fallbackResult = createFallbackAnalysis(text, mode)
      console.log("API: Usando resposta de fallback devido a erro HTTP", requestId)
      return NextResponse.json(fallbackResult)
    }

    // Process successful response
    console.log("API: Processando resposta de análise", requestId)
    const data = await response.json()
    console.log("API: Resposta de análise processada com sucesso", requestId)
    console.log("API: DEBUG - dados recebidos da API:", JSON.stringify(data, null, 2), requestId)

    // Validate and structure analysis response
    let processedData
    try {
      processedData = normalizeAnalysisPayload(data, text, mode)
      console.log("API: Estrutura de análise validada com sucesso", requestId)
    } catch (processingError) {
      console.error("API: Erro ao processar resposta de análise:", processingError, requestId)

      // Return fallback analysis response
      processedData = createFallbackAnalysis(text, mode)
      console.log("API: Usando resposta de fallback devido a erro de processamento", requestId)
    }

    // Record feature usage if user is identified
    if (userId) {
      await recordFeatureUsage(userId, 'ai_analysis', 1)

      // Save analysis to history only for Pro/Plus users
      if (isPremiumUser(request)) {
        await saveAnalysis(
          userId,
          text,
          data,
          mode
        )
      }
    }

    // Log successful request
    const processingTime = Date.now() - startTime
    logRequest(requestId, {
      status: 200,
      processingTime,
      textLength: text.length,
      mode,
      isPremium: isUserPremium,
      usage: usageInfo.usage + 1, // Will be incremented after this request
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    })

    console.log("API: Enviando resposta de análise para o cliente", requestId)

    // Return response with debug headers
    const apiResponse = NextResponse.json(processedData)

    // Add debug headers
    apiResponse.headers.set('X-API-Version', '1.0')
    apiResponse.headers.set('X-Service', 'CorretorIA-Analysis')
    apiResponse.headers.set('X-Request-ID', requestId)
    apiResponse.headers.set('X-Processing-Time', `${processingTime}ms`)
    apiResponse.headers.set('X-Text-Length', text.length.toString())
    apiResponse.headers.set('X-Mode-Applied', mode)
    apiResponse.headers.set('X-User-Premium', isUserPremium.toString())
    apiResponse.headers.set('X-Usage-Info', JSON.stringify({
      current: usageInfo.usage + 1,
      limit: usageInfo.limit,
      period: usageInfo.period
    }))

    return apiResponse

  } catch (error) {
    const err = error as Error
    console.error("API: Erro geral ao processar análise:", err, requestId)

    // Enhanced error logging
    logError(requestId, {
      status: err.name === "AbortError" ? 504 : 500,
      message: err.message || "Unknown error",
      stack: err.stack,
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    })

    // Return appropriate error response
    if (err.name === "AbortError") {
      return NextResponse.json(
        {
          error: "Tempo limite excedido",
          message: "O processamento demorou muito. Tente novamente com um texto menor.",
          code: "TIMEOUT_ERROR",
        },
        { status: 504 }
      )
    }

    // Try to return fallback analysis response
    try {
      const originalText = requestBody?.text || ""
      const mode = requestBody?.mode || HUMANIZE_MODES.DEFAULT
      const fallbackResult = createFallbackAnalysis(originalText, mode)
      console.log("API: Usando resposta de fallback devido a erro geral", requestId)
      return NextResponse.json(fallbackResult)
    } catch (fallbackError) {
      console.error("API: Erro ao criar resposta de fallback:", fallbackError, requestId)

      return NextResponse.json(
        {
          error: "Erro interno",
          message: "Erro inesperado no servidor. Tente novamente mais tarde.",
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      )
    }
  }
}

// GET endpoint to check analysis service status
export async function GET(request: NextRequest) {
  try {
    const usageInfo = await getHumanizeUsage(request)

    return NextResponse.json({
      usage: usageInfo,
      limits: HUMANIZE_LIMITS,
      modes: Object.values(HUMANIZE_MODES),
      status: "available",
      service: "analysis"
    })
  } catch (error) {
    console.error("Error getting analysis service info:", error)
    return NextResponse.json(
      { error: "Erro ao obter informações do serviço de análise" },
      { status: 500 }
    )
  }
}
