import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/middleware/rate-limit"
import { validateInput } from "@/middleware/input-validation"
import { logRequest, logError } from "@/utils/logger"
import { FETCH_TIMEOUT, AUTH_TOKEN, REWRITE_WEBHOOK_URL } from "@/utils/constants"
import { fetchWithRetry, fetchWithTimeout } from "@/utils/fetch-retry"

// Token de bypass para autenticação Vercel
const VERCEL_BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic'

// Função fetchWithTimeout agora importada de @/utils/fetch-retry

export const maxDuration = 60 // Configurar o tempo máximo de execução da função para 60 segundos

// Função para criar uma resposta padrão em caso de erro
const createFallbackResponse = (originalText: string) => {
  return {
    rewrittenText: originalText, // Retorna o texto original como fallback
    evaluation: {
      strengths: ["O texto foi processado parcialmente"],
      weaknesses: ["Não foi possível realizar uma reescrita completa devido a um erro no serviço"],
      suggestions: [
        "Tente novamente mais tarde ou com um texto menor",
        "Verifique se o texto contém caracteres especiais ou formatação complexa",
      ],
      score: 5,
    },
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  // Ler o body uma vez apenas no início - declarado no escopo da função
  let requestBody: any
  try {
    requestBody = await request.json()
    console.log("API: Dados JSON parseados com sucesso:", JSON.stringify(requestBody), requestId)
  } catch (parseError) {
    console.error("API: Erro ao fazer parse do JSON:", parseError, requestId)
    logRequest(requestId, {
      status: 400,
      message: "Invalid JSON in request body",
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    })
    return NextResponse.json(
      { error: "Formato JSON inválido", message: "Corpo da requisição deve ser um JSON válido" },
      { status: 400 }
    )
  }

  try {
    // Aplicar rate limiting
    const rateLimitResponse = await rateLimiter(request)
    if (rateLimitResponse) {
      logRequest(requestId, {
        status: 429,
        message: "Rate limit exceeded",
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })
      return rateLimitResponse
    }

    // Criar uma nova requisição com o body já lido para validação
    const mockRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(requestBody),
    })

    const validatedInput = await validateInput(mockRequest)
    if (validatedInput instanceof NextResponse) {
      logRequest(requestId, {
        status: 400,
        message: "Input validation failed",
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })
      return validatedInput
    }

    const { text, isMobile, style } = validatedInput

    // Obter o estilo da validação
    const rewriteStyle = style || "formal"

    console.log(`API: Estilo de reescrita selecionado: ${rewriteStyle}`, requestId)

    console.log("API: Iniciando processamento de reescrita", requestId)
    
    // Logs de debugging melhorados
    const debugInfo = {
      requestId,
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      origin: request.headers.get("origin") || "unknown",
      referer: request.headers.get("referer") || "unknown",
      textLength: text.length,
      isMobile,
      rewriteStyle,
      webhookUrl: REWRITE_WEBHOOK_URL
    }
    
    console.log("API: Request debug info:", JSON.stringify(debugInfo), requestId)

    // Verificar tamanho do texto
    if (text.length > 5000) {
      logRequest(requestId, {
        status: 413,
        message: "Text too large",
        textLength: text.length,
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })
      return NextResponse.json(
        { error: "Texto muito grande", message: "O texto não pode exceder 5000 caracteres" },
        { status: 413 },
      )
    }

    console.log(
      `API: Processando texto ${isMobile ? "de dispositivo móvel" : "de desktop"}, comprimento: ${text.length}`,
      requestId,
    )

    // Enviar o texto para o webhook com timeout estendido
    console.log(`API: Enviando requisição para o webhook de reescrita, estilo selecionado: ${rewriteStyle}`, requestId)

    try {
      // Preparar o corpo da requisição conforme nova API
      const requestBody = {
        text: text,
        style: rewriteStyle, // Usar o estilo extraído diretamente do corpo da requisição
        authToken: AUTH_TOKEN
      }

      // Configurar headers com token de bypass se disponível
      const headers: Record<string, string> = {
        "Content-Type": "application/json; charset=utf-8",
        "X-Request-ID": requestId,
      }

      let webhookUrl = REWRITE_WEBHOOK_URL

      console.log(`API: Enviando para webhook ${webhookUrl}`)
      console.log(`API: Headers:`, JSON.stringify(headers), requestId)
      console.log(`API: Corpo da requisição para o webhook:`, JSON.stringify(requestBody), requestId)

      let response = await fetchWithRetry(
        webhookUrl,
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        },
        {
          maxRetries: 3,
          timeout: FETCH_TIMEOUT,
          retryDelay: 2000,
        },
      )

      console.log(`API: Resposta recebida do webhook com status ${response.status}`, requestId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(
          `API: Erro na resposta do servidor: ${response.status} ${response.statusText}`,
          errorText,
          requestId,
        )

        logError(requestId, {
          status: response.status,
          message: `Webhook error: ${response.statusText}`,
          details: errorText,
          ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
        })

        throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`)
      }

      // Obter a resposta do webhook
      console.log("API: Processando resposta JSON", requestId)
      const data = await response.json()
      console.log("API: Resposta JSON processada com sucesso", requestId)

      // Processar resposta do webhook
      let processedData

      try {
        // Adicionar log detalhado da resposta para diagnóstico
        console.log("API: Resposta bruta recebida:", JSON.stringify(data), requestId)

        // A nova API retorna formato: [{ output: { adjustedText: string, evaluation: object } }]
        let adjustedText = ""
        let evaluation = null

        if (Array.isArray(data) && data.length > 0 && data[0].output) {
          // Formato da nova API
          adjustedText = data[0].output.adjustedText
          evaluation = data[0].output.evaluation
        } else if (data.correctedText) {
          // Formato de fallback/antigo (correção sendo usada como reescrita)
          adjustedText = data.correctedText
          evaluation = data.evaluation
          
          // Adaptar avaliação de correção para reescrita
          if (evaluation) {
            evaluation = {
              toneApplied: rewriteStyle,
              changes: evaluation.suggestions || [`Texto reescrito no estilo ${rewriteStyle}`],
              suggestions: []
            }
          }
          
          console.log("API: Usando resposta de correção adaptada para reescrita", requestId)
        } else {
          console.error("API: Formato de resposta não reconhecido", requestId)
          throw new Error("Formato de resposta não reconhecido da nova API")
        }

        if (!adjustedText) {
          console.error("API: Campo adjustedText não encontrado na resposta", requestId)
          throw new Error("Campo adjustedText não encontrado na resposta do webhook")
        }

        // Mapear a resposta para o formato esperado pelo frontend
        processedData = {
          rewrittenText: adjustedText,
          evaluation: {
            strengths: evaluation?.changes || ["Texto reescrito com sucesso"],
            weaknesses: [],
            suggestions: evaluation?.suggestions || [],
            score: 7,
            toneApplied: evaluation?.toneApplied || rewriteStyle,
            changes: evaluation?.changes || []
          },
        }

        if (!processedData.evaluation) {
          console.error("API: Campo evaluation não encontrado nos dados processados", requestId)
          // Se tiver o texto reescrito mas não a avaliação, criar uma avaliação padrão
          processedData.evaluation = {
            strengths: ["Texto reescrito com sucesso"],
            weaknesses: [],
            suggestions: [],
            score: 7,
          }
          console.log("API: Criada avaliação padrão para substituir campo ausente", requestId)
        }

        // Registrar o sucesso da requisição
        const processingTime = Date.now() - startTime
        logRequest(requestId, {
          status: 200,
          processingTime,
          textLength: text.length,
          ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
        })

        console.log("API: Enviando resposta processada para o cliente", requestId)
        
        // Retornar a resposta com headers de debug
        const apiResponse = NextResponse.json(processedData)
        
        // Adicionar headers de debug úteis
        apiResponse.headers.set('X-API-Version', '2.0')
        apiResponse.headers.set('X-Service', 'CorretorIA-Rewrite')
        apiResponse.headers.set('X-Request-ID', requestId)
        apiResponse.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)
        apiResponse.headers.set('X-Text-Length', text.length.toString())
        apiResponse.headers.set('X-Style-Applied', rewriteStyle)
        
        return apiResponse
      } catch (processingError) {
        const pe = processingError as Error
        console.error("API: Erro ao processar dados da resposta:", pe, requestId)

        logError(requestId, {
          status: 500,
          message: `Processing error: ${pe.message}`,
          ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
        })

        // Try to use fallback response
        try {
          const fallbackResponse = createFallbackResponse(text)
          console.log("API: Usando resposta de fallback devido a erro de processamento", requestId)
          return NextResponse.json(fallbackResponse)
        } catch (fallbackError) {
          console.error("API: Erro ao criar resposta de fallback:", fallbackError, requestId)
          throw processingError // Re-throw the original error if fallback fails
        }
      }
    } catch (error) {
      const err = error as Error
      console.error("API: Erro ao processar a reescrita:", err, requestId)

      // Enhanced error logging with more details
      logError(requestId, {
        status: err.name === "AbortError" ? 504 : 500,
        message: err.message || "Unknown error",
        stack: err.stack,
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })

      // Try to use fallback response for any error
      try {
        // Use the original text from the already read request body
        const originalText = requestBody?.text || ""
        const fallbackResponse = createFallbackResponse(originalText)
        console.log("API: Usando resposta de fallback devido a erro geral", requestId)
        return NextResponse.json(fallbackResponse)
      } catch (fallbackError) {
        console.error("API: Erro ao criar resposta de fallback para erro geral:", fallbackError, requestId)

        // If all else fails, return a specific error based on the error type
        if (err.name === "AbortError") {
          return NextResponse.json(
            {
              error: "Tempo limite excedido",
              message:
                "O servidor demorou muito para responder. Por favor, tente novamente com um texto menor ou mais tarde.",
              code: "TIMEOUT_ERROR",
            },
            { status: 504 },
          )
        } else {
          // Default error response
          return NextResponse.json(
            {
              error: err instanceof Error ? err.message : "Erro desconhecido",
              message:
                "Erro ao processar o texto. Por favor, verifique se o texto contém apenas caracteres válidos e tente novamente.",
              code: "GENERAL_ERROR",
            },
            { status: 500 },
          )
        }
      }
    }
  } catch (error) {
    const err = error as Error
    console.error("API: Erro ao processar a requisição:", err, requestId)

    // Enhanced error logging with more details
    logError(requestId, {
      status: 500,
      message: err.message || "Unknown error",
      stack: err.stack,
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    })

    // Default error response
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Erro desconhecido",
        message:
          "Erro ao processar o texto. Por favor, verifique se o texto contém apenas caracteres válidos e tente novamente.",
        code: "GENERAL_ERROR",
      },
      { status: 500 },
    )
  }
}
