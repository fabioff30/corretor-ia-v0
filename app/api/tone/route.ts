import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/middleware/rate-limit"
import { validateInput } from "@/middleware/input-validation"
import { logRequest, logError } from "@/utils/logger"
import { FETCH_TIMEOUT, AUTH_TOKEN } from "@/utils/constants"

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic'

// URL do webhook para ajuste de tom
const TONE_WEBHOOK_URL = "https://my-corretoria.vercel.app/api/reescrever"

// Função para fazer fetch com timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

export const maxDuration = 60 // Configurar o tempo máximo de execução da função para 60 segundos

// Função para criar uma resposta padrão em caso de erro
const createFallbackResponse = (originalText: string) => {
  return {
    adjustedText: originalText, // Retorna o texto original como fallback
    evaluation: {
      toneApplied: "Padrão",
      changes: ["Não foi possível aplicar o ajuste de tom devido a um erro no serviço"],
      suggestions: [
        "Tente novamente mais tarde ou com um texto menor",
        "Verifique se o texto contém caracteres especiais ou formatação complexa",
      ],
    },
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

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

    // Inicializar requestData com valores padrão
    let requestData = { tone: "Padrão" }

    try {
      // Tentar ler o corpo da requisição como texto primeiro
      const bodyText = await request.text()
      console.log("API: Corpo da requisição recebido:", bodyText, requestId)

      // Verificar se o corpo não está vazio antes de tentar fazer o parse
      if (bodyText && bodyText.trim()) {
        try {
          requestData = JSON.parse(bodyText)
          console.log("API: Dados JSON parseados com sucesso:", JSON.stringify(requestData), requestId)
        } catch (parseError) {
          console.error("API: Erro ao fazer parse do JSON:", parseError, requestId)
          // Manter os valores padrão se o parse falhar
        }
      } else {
        console.warn("API: Corpo da requisição vazio ou inválido", requestId)
      }
    } catch (readError) {
      console.error("API: Erro ao ler o corpo da requisição:", readError, requestId)
      // Continuar com os valores padrão
    }

    // Validar e sanitizar a entrada usando uma nova requisição com o mesmo corpo
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(requestData),
    })

    const validatedInput = await validateInput(newRequest)
    if (validatedInput instanceof NextResponse) {
      logRequest(requestId, {
        status: 400,
        message: "Input validation failed",
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })
      return validatedInput
    }

    const { text, isMobile } = validatedInput

    // Obter o tom diretamente do objeto requestData
    const tone = requestData.tone || "Padrão"

    console.log(`API: Tom selecionado: ${tone}`, requestId)

    console.log("API: Iniciando processamento de ajuste de tom", requestId)

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
    console.log(`API: Enviando requisição para o webhook de ajuste de tom, tom selecionado: ${tone}`, requestId)

    try {
      // Preparar o corpo da requisição
      const requestBody = {
        text: text,
        style: tone, // Usar o tom como estilo para o webhook de reescrita
        source: isMobile ? "mobile" : "desktop",
        authToken: AUTH_TOKEN,
      }

      console.log(`API: Enviando para webhook ${TONE_WEBHOOK_URL}`)
      console.log(`API: Corpo da requisição para o webhook:`, JSON.stringify(requestBody), requestId)

      const response = await fetchWithTimeout(
        TONE_WEBHOOK_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Request-ID": requestId,
          },
          body: JSON.stringify(requestBody),
        },
        FETCH_TIMEOUT,
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

        // Verificar diferentes formatos possíveis de resposta
        let webhookResponse
        if (Array.isArray(data) && data.length > 0 && data[0].output) {
          // Formato: [{ output: { rewrittenText, evaluation } }]
          webhookResponse = data[0].output
        } else if (data.rewrittenText && data.evaluation) {
          // Formato direto: { rewrittenText, evaluation }
          webhookResponse = data
        } else {
          throw new Error("Formato de resposta não reconhecido")
        }

        if (!webhookResponse.rewrittenText) {
          console.error("API: Campo rewrittenText não encontrado na resposta", requestId)
          throw new Error("Campo rewrittenText não encontrado na resposta do webhook")
        }

        // Mapear a resposta para o formato esperado pelo frontend
        processedData = {
          adjustedText: webhookResponse.rewrittenText,
          evaluation: {
            toneApplied: webhookResponse.evaluation?.styleApplied || tone,
            changes: webhookResponse.evaluation?.changes || ["Tom aplicado com sucesso"],
            suggestions: [],
          },
        }

        if (!processedData.evaluation) {
          console.error("API: Campo evaluation não encontrado nos dados processados", requestId)
          // Se tiver o texto ajustado mas não a avaliação, criar uma avaliação padrão
          processedData.evaluation = {
            toneApplied: tone,
            changes: ["Tom aplicado com sucesso"],
            suggestions: [],
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
        // Retornar a resposta para o cliente
        return NextResponse.json(processedData)
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
      console.error("API: Erro ao processar o ajuste de tom:", err, requestId)

      // Enhanced error logging with more details
      logError(requestId, {
        status: err.name === "AbortError" ? 504 : 500,
        message: err.message || "Unknown error",
        stack: err.stack,
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })

      // Try to use fallback response for any error
      try {
        const fallbackResponse = createFallbackResponse(text)
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