import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/middleware/rate-limit"
import { validateInput } from "@/middleware/input-validation"
import { logRequest, logError } from "@/utils/logger"
import { FETCH_TIMEOUT } from "@/utils/constants"

// URL do webhook para reescrita
const REWRITE_WEBHOOK_URL = "https://auto.ffmedia.com.br/webhook/reescrever/c5d85e34-988a-4be8-bcae-e79451476f7e"

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
    let requestData = { rewriteStyle: "formal" }

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

    // Obter o estilo diretamente do objeto requestData
    const rewriteStyle = requestData.rewriteStyle || "formal"

    console.log(`API: Estilo de reescrita selecionado: ${rewriteStyle}`, requestId)

    console.log("API: Iniciando processamento de reescrita", requestId)

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
      // Preparar o corpo da requisição
      const requestBody = {
        text: text,
        style: rewriteStyle, // Usar o estilo extraído diretamente do corpo da requisição
        source: isMobile ? "mobile" : "desktop",
      }

      console.log(`API: Corpo da requisição para o webhook:`, JSON.stringify(requestBody), requestId)

      const response = await fetchWithTimeout(
        REWRITE_WEBHOOK_URL,
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

      // Verificar se a resposta tem o formato esperado
      let processedData

      try {
        // Adicionar log detalhado da resposta para diagnóstico
        console.log("API: Resposta bruta recebida:", JSON.stringify(data).substring(0, 500), requestId)

        // Verificar diferentes formatos possíveis
        if (data.rewrittenText || data.correctedText) {
          processedData = {
            rewrittenText: data.rewrittenText || data.correctedText,
            evaluation: data.evaluation || {
              strengths: ["Texto reescrito com sucesso"],
              weaknesses: [],
              suggestions: [],
              score: 7,
            },
          }
        } else if (Array.isArray(data) && data.length > 0 && data[0].output) {
          // Formato antigo: [{ output: { rewrittenText/correctedText, evaluation } }]
          console.log("API: Detectado formato de array com output", requestId)
          processedData = data[0].output
          if (!processedData.rewrittenText && processedData.correctedText) {
            processedData.rewrittenText = processedData.correctedText
          }
        } else if (data.output && typeof data.output === "object") {
          // Formato alternativo: { output: { rewrittenText/correctedText, evaluation } }
          console.log("API: Detectado formato com objeto output", requestId)
          processedData = data.output
          if (!processedData.rewrittenText && processedData.correctedText) {
            processedData.rewrittenText = processedData.correctedText
          }
        } else {
          // Tentar encontrar os campos necessários em qualquer lugar da resposta
          console.log("API: Tentando encontrar campos necessários em qualquer lugar da resposta", requestId)

          // Função para buscar recursivamente os campos necessários
          const findFields = (obj) => {
            if (!obj || typeof obj !== "object") return null

            // Verificar se o objeto atual tem os campos necessários
            if (obj.rewrittenText || obj.correctedText) {
              return {
                rewrittenText: obj.rewrittenText || obj.correctedText,
                evaluation: obj.evaluation || {
                  strengths: ["Texto reescrito com sucesso"],
                  weaknesses: [],
                  suggestions: [],
                  score: 7,
                },
              }
            }

            // Buscar em todas as propriedades do objeto
            for (const key in obj) {
              if (typeof obj[key] === "object") {
                const result = findFields(obj[key])
                if (result) return result
              }
            }

            return null
          }

          const foundData = findFields(data)
          if (foundData) {
            console.log("API: Campos necessários encontrados em estrutura aninhada", requestId)
            processedData = foundData
          } else {
            console.warn("API: Formato de resposta não reconhecido:", JSON.stringify(data).substring(0, 200), requestId)
            throw new Error("Formato de resposta não reconhecido")
          }
        }

        // Verificar se os campos necessários existem
        if (!processedData.rewrittenText && !processedData.correctedText) {
          console.error("API: Campo rewrittenText/correctedText não encontrado nos dados processados", requestId)
          throw new Error("Campo de texto reescrito não encontrado na resposta")
        }

        // Garantir que temos um campo rewrittenText
        if (!processedData.rewrittenText && processedData.correctedText) {
          processedData.rewrittenText = processedData.correctedText
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
        // Retornar a resposta para o cliente
        return NextResponse.json(processedData)
      } catch (processingError) {
        console.error("API: Erro ao processar dados da resposta:", processingError, requestId)

        logError(requestId, {
          status: 500,
          message: `Processing error: ${processingError.message}`,
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
      console.error("API: Erro ao processar a reescrita:", error, requestId)

      // Enhanced error logging with more details
      logError(requestId, {
        status: error.name === "AbortError" ? 504 : 500,
        message: error.message || "Unknown error",
        stack: error.stack,
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
        if (error.name === "AbortError") {
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
              error: error instanceof Error ? error.message : "Erro desconhecido",
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
    console.error("API: Erro ao processar a requisição:", error, requestId)

    // Enhanced error logging with more details
    logError(requestId, {
      status: 500,
      message: error.message || "Unknown error",
      stack: error.stack,
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    })

    // Default error response
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        message:
          "Erro ao processar o texto. Por favor, verifique se o texto contém apenas caracteres válidos e tente novamente.",
        code: "GENERAL_ERROR",
      },
      { status: 500 },
    )
  }
}
