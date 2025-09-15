import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/middleware/rate-limit"
import { validateInput } from "@/middleware/input-validation"
import { logRequest, logError } from "@/utils/logger"
import { FETCH_TIMEOUT, AUTH_TOKEN, WEBHOOK_URL, FALLBACK_WEBHOOK_URL } from "@/utils/constants"
import { fetchWithRetry, fetchWithTimeout } from "@/utils/fetch-retry"

// Token de bypass para autenticação Vercel
const VERCEL_BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

// Função fetchWithTimeout agora importada de @/utils/fetch-retry

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
  
  // Ler o body uma vez apenas no início - declarado no escopo da função
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

    // Validar e sanitizar a entrada
    const validatedInput = await validateInput(mockRequest)
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
    
    // Logs de debugging melhorados
    const debugInfo = {
      requestId,
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      origin: request.headers.get("origin") || "unknown",
      referer: request.headers.get("referer") || "unknown",
      textLength: text.length,
      isMobile,
      tone,
      webhookUrl: WEBHOOK_URL
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

    // Enviar o texto para o webhook do n8n com timeout estendido e garantir codificação correta
    console.log(`API: Enviando requisição para o webhook, tom selecionado: ${tone}`, requestId)
    let response
    try {
      // Preparar headers com token de bypass se disponível
      const headers: Record<string, string> = {
        "Content-Type": "application/json; charset=utf-8",
        "X-Request-ID": requestId,
      }

      let webhookUrl = WEBHOOK_URL
      
      // Adicionar token de bypass apenas se não for localhost e se o token estiver disponível
      if (VERCEL_BYPASS_TOKEN && !webhookUrl.includes('localhost')) {
        // Tentar ambas as abordagens: query params E headers
        const urlObj = new URL(webhookUrl)
        urlObj.searchParams.set('x-vercel-set-bypass-cookie', 'true')
        urlObj.searchParams.set('x-vercel-protection-bypass', VERCEL_BYPASS_TOKEN)
        webhookUrl = urlObj.toString()
        
        // Também adicionar como headers
        headers['x-vercel-protection-bypass'] = VERCEL_BYPASS_TOKEN
        headers['x-vercel-set-bypass-cookie'] = 'true'
        
        console.log(`API: Adicionando token de bypass do Vercel (query params + headers)`, requestId)
      }

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

      // Adicionar authToken para autenticação
      if (AUTH_TOKEN) {
        requestBody.authToken = AUTH_TOKEN
        console.log("API: Adicionando authToken à requisição", requestId)
      }

      console.log(`API: Headers:`, JSON.stringify(headers), requestId)

      response = await fetchWithRetry(
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
    } catch (webhookError) {
      const we = webhookError as Error
      console.error(`API: Erro ao acessar o webhook: ${we.message}`, requestId)
      console.log("API: Tentando webhook de fallback", requestId)

      // Se falhar, tentar o webhook de fallback (n8n)
      const fallbackUrl = FALLBACK_WEBHOOK_URL
      console.log(`API: Usando webhook de fallback: ${fallbackUrl}`, requestId)

      // No fallback, não enviamos o parâmetro de tom nem authToken para manter compatibilidade
      response = await fetchWithRetry(
        fallbackUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Request-ID": requestId,
          },
          body: JSON.stringify({
            text: text,
            source: isMobile ? "mobile" : "desktop",
          }),
        },
        {
          maxRetries: 2,
          timeout: FETCH_TIMEOUT,
          retryDelay: 1000,
        },
      )
      console.log(`API: Resposta recebida do webhook de fallback com status ${response.status}`, requestId)
    }

    // Se a resposta principal der 401, tentar fallback imediatamente
    if (!response.ok && response.status === 401) {
      console.log("API: Status 401 detectado, tentando fallback automaticamente", requestId)
      
      const fallbackUrl = FALLBACK_WEBHOOK_URL
      console.log(`API: Usando webhook de fallback: ${fallbackUrl}`, requestId)

      response = await fetchWithRetry(
        fallbackUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Request-ID": requestId,
          },
          body: JSON.stringify({
            text: text,
            source: isMobile ? "mobile" : "desktop",
          }),
        },
        {
          maxRetries: 2,
          timeout: FETCH_TIMEOUT,
          retryDelay: 1000,
        },
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
        const findFields = (obj: any): any => {
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
      
      // Retornar a resposta com headers de debug
      const apiResponse = NextResponse.json(processedData)
      
      // Adicionar headers de debug úteis
      apiResponse.headers.set('X-API-Version', '2.0')
      apiResponse.headers.set('X-Service', 'CorretorIA-Correction')
      apiResponse.headers.set('X-Request-ID', requestId)
      apiResponse.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)
      apiResponse.headers.set('X-Text-Length', text.length.toString())
      apiResponse.headers.set('X-Tone-Applied', tone)
      
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
    console.error("API: Erro ao processar a correção:", err, requestId)

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
      } else if (err.name === "SyntaxError") {
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
}
