import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/middleware/rate-limit"
import { validateInput } from "@/middleware/input-validation"
import { logRequest, logError } from "@/utils/logger"
// Atualizar a constante WEBHOOK_URL para o novo endpoint
// Certifique-se de que a URL está exatamente como fornecida
const WEBHOOK_URL = "https://my-corretoria.vercel.app/api/corrigir"

// Adicionar um fallback para o webhook original caso o novo falhe
const FALLBACK_WEBHOOK_URL = "https://auto.ffmedia.com.br/webhook/webapp-tradutor"
import { FETCH_TIMEOUT, AUTH_TOKEN } from "@/utils/constants"

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

export const maxDuration = 60 // Configurar o tempo máximo de execução da função para 60 segundos (máximo permitido)

// Função para criar uma resposta padrão em caso de erro
const createFallbackResponse = (originalText: string) => {
  return {
    correctedText: originalText, // Retorna o texto original como fallback
    evaluation: {
      strengths: ["O texto foi processado parcialmente"],
      weaknesses: ["Não foi possível realizar uma correção completa devido a um erro no serviço"],
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

    // Validar e sanitizar a entrada
    const validatedInput = await validateInput(request)
    if (validatedInput instanceof NextResponse) {
      logRequest(requestId, {
        status: 400,
        message: "Input validation failed",
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      })
      return validatedInput
    }

    const { text, isMobile, tone = "Padrão" } = validatedInput

    console.log("API: Iniciando processamento de correção", requestId)

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

    // Enviar o texto para o webhook do n8n com timeout estendido e garantir codificação correta
    console.log(`API: Enviando requisição para o webhook, tom selecionado: ${tone}`, requestId)
    let response
    try {
      // Escolher o webhook com base no tom selecionado
      const webhookUrl =
        tone === "Padrão"
          ? "https://auto.ffmedia.com.br/webhook/webapp-tradutor"
          : "https://my-corretoria.vercel.app/api/corrigir"

      console.log(`API: Usando webhook: ${webhookUrl}`, requestId)

      // Preparar o corpo da requisição
      const requestBody: any = {
        text: text,
        source: isMobile ? "mobile" : "desktop",
      }

      // Adicionar o tom apenas se não for "Padrão"
      if (tone !== "Padrão") {
        requestBody.tone = tone
      }

      // Sempre adicionar authToken quando disponível, independente do webhook
      if (AUTH_TOKEN) {
        requestBody.authToken = AUTH_TOKEN
        console.log("API: Adicionando authToken à requisição", requestId)
      }

      response = await fetchWithTimeout(
        webhookUrl,
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
    } catch (webhookError) {
      console.error(`API: Erro ao acessar o webhook: ${webhookError.message}`, requestId)
      console.log("API: Tentando webhook de fallback", requestId)

      // Se falhar, tentar o webhook de fallback (sempre o webhook original)
      const fallbackUrl = "https://auto.ffmedia.com.br/webhook/webapp-tradutor"
      console.log(`API: Usando webhook de fallback: ${fallbackUrl}`, requestId)

      // No fallback, também enviamos authToken se disponível
      const fallbackRequestBody: any = {
        text: text,
        source: isMobile ? "mobile" : "desktop",
      }

      // Adicionar authToken se disponível
      if (AUTH_TOKEN) {
        fallbackRequestBody.authToken = AUTH_TOKEN
        console.log("API: Adicionando authToken à requisição de fallback", requestId)
      }

      response = await fetchWithTimeout(
        fallbackUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Request-ID": requestId,
          },
          body: JSON.stringify(fallbackRequestBody),
        },
        FETCH_TIMEOUT,
      )
      console.log(`API: Resposta recebida do webhook de fallback com status ${response.status}`, requestId)
    }

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
      if (Array.isArray(data) && data.length > 0 && data[0].output) {
        // Formato antigo: [{ output: { correctedText, evaluation } }]
        console.log("API: Detectado formato de array com output", requestId)
        processedData = data[0].output
      } else if (data.correctedText && data.evaluation) {
        // Formato direto: { correctedText, evaluation }
        console.log("API: Detectado formato direto com correctedText e evaluation", requestId)
        processedData = data
      } else if (data.output && typeof data.output === "object") {
        // Formato alternativo: { output: { correctedText, evaluation } }
        console.log("API: Detectado formato com objeto output", requestId)
        processedData = data.output
      } else if (data.result && typeof data.result === "object") {
        // Outro formato possível: { result: { correctedText, evaluation } }
        console.log("API: Detectado formato com objeto result", requestId)
        processedData = data.result
      } else if (typeof data === "string") {
        // Tentar parsear se for uma string JSON
        console.log("API: Resposta é uma string, tentando parsear como JSON", requestId)
        try {
          const parsedData = JSON.parse(data)
          if (parsedData.correctedText && parsedData.evaluation) {
            processedData = parsedData
          } else {
            throw new Error("Dados JSON parseados não contêm os campos necessários")
          }
        } catch (parseError) {
          console.error("API: Erro ao parsear string JSON:", parseError, requestId)
          throw new Error("Formato de resposta não reconhecido (string inválida)")
        }
      } else {
        // Tentar encontrar os campos necessários em qualquer lugar da resposta
        console.log("API: Tentando encontrar campos necessários em qualquer lugar da resposta", requestId)

        // Função para buscar recursivamente os campos necessários
        const findFields = (obj) => {
          if (!obj || typeof obj !== "object") return null

          // Verificar se o objeto atual tem os campos necessários
          if (obj.correctedText && obj.evaluation) {
            return obj
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
      if (!processedData.correctedText) {
        console.error("API: Campo correctedText não encontrado nos dados processados", requestId)
        throw new Error("Campo correctedText não encontrado na resposta")
      }

      if (!processedData.evaluation) {
        console.error("API: Campo evaluation não encontrado nos dados processados", requestId)
        // Se tiver o texto corrigido mas não a avaliação, criar uma avaliação padrão
        processedData.evaluation = {
          strengths: ["Texto corrigido com sucesso"],
          weaknesses: ["Não foi possível gerar uma análise detalhada"],
          suggestions: ["Revise o texto manualmente para garantir a qualidade"],
          score: 7,
        }
        console.log("API: Criada avaliação padrão para substituir campo ausente", requestId)
      }

      // Modificar a avaliação com base no tom selecionado
      if (tone !== "Padrão") {
        console.log(`API: Modificando avaliação para tom "${tone}" - mantendo apenas ajustes de tom`, requestId)

        // Preservar apenas o campo toneChanges na avaliação
        const toneChanges = processedData.evaluation.toneChanges || []

        // Substituir a avaliação completa por uma versão simplificada apenas com ajustes de tom
        // Definindo score como 0 para indicar que não deve ser exibido
        processedData.evaluation = {
          strengths: [],
          weaknesses: [],
          suggestions: [],
          score: 0,
          toneChanges: toneChanges,
        }
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
    console.error("API: Erro ao processar a correção:", error, requestId)

    // Enhanced error logging with more details
    logError(requestId, {
      status: error.name === "AbortError" ? 504 : 500,
      message: error.message || "Unknown error",
      stack: error.stack,
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    })

    // Try to use fallback response for any error
    try {
      // Get the original text from the request
      const body = await request.json()
      const originalText = body.text || ""

      const fallbackResponse = createFallbackResponse(originalText)
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
      } else if (error.name === "SyntaxError") {
        return NextResponse.json(
          {
            error: "Erro de formato",
            message: "Houve um problema ao processar a resposta. Por favor, tente novamente.",
            code: "FORMAT_ERROR",
          },
          { status: 500 },
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
}
