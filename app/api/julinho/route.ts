import { NextResponse } from "next/server"

export const runtime = "nodejs"

interface MessageFormat {
  mensagem_1?: string
  mensagem_2?: string
  mensagem_3?: string
  mensagem_4?: string
  mensagem_5?: string
  mensagem_6?: string
  mensagem_7?: string
  mensagem_8?: string
  mensagem_9?: string
  mensagem_10?: string
  [key: string]: any
  batchTotal?: number
}

export async function POST(req: Request) {
  try {
    // Extrair os dados da requisição
    const requestData = await req.json()
    const { messages, sessionId } = requestData

    // Extrair a última mensagem do usuário
    const lastUserMessage = messages[messages.length - 1].content

    console.log(`Enviando mensagem para o webhook (Sessão: ${sessionId}):`, lastUserMessage)

    // Preparar o corpo da requisição para o webhook
    const webhookBody = {
      message: lastUserMessage,
      conversation_id: sessionId, // Usar o ID da sessão como ID da conversa
      user_id: "website_user",
      stream: true, // Indicar que queremos respostas em stream/batches
    }

    // Enviar a requisição para o webhook
    const webhookResponse = await fetch(
      "https://auto.ffmedia.com.br/webhook/julinho/6cb8b110-8c94-4753-9299-e4d1b39cdf10",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookBody),
      },
    )

    // Verificar se a resposta foi bem-sucedida
    if (!webhookResponse.ok) {
      console.error("Erro na resposta do webhook:", webhookResponse.status, webhookResponse.statusText)
      const errorText = await webhookResponse.text()
      console.error("Detalhes do erro:", errorText)
      throw new Error(`Webhook respondeu com status: ${webhookResponse.status}`)
    }

    // Obter a resposta do webhook
    const responseText = await webhookResponse.text()
    console.log(`Resposta do webhook (Sessão: ${sessionId}):`, responseText)

    try {
      // Tentar fazer o parse do JSON
      const jsonData = JSON.parse(responseText)

      // Verificar se é um array e extrair o primeiro item se for
      const messageObj = Array.isArray(jsonData) ? jsonData[0] : jsonData

      console.log("Objeto de mensagem extraído:", messageObj)

      // Verificar se temos o formato com mensagem_X e batchTotal
      if (messageObj && typeof messageObj === "object") {
        const batches: string[] = []

        // Se temos batchTotal, usar para extrair as mensagens numeradas
        if ("batchTotal" in messageObj && typeof messageObj.batchTotal === "number") {
          const batchTotal = messageObj.batchTotal

          for (let i = 1; i <= batchTotal; i++) {
            const key = `mensagem_${i}`
            if (key in messageObj && typeof messageObj[key] === "string") {
              batches.push(messageObj[key])
            }
          }
        }
        // Caso contrário, procurar por todas as chaves mensagem_X
        else {
          for (const key in messageObj) {
            if (key.startsWith("mensagem_") && typeof messageObj[key] === "string") {
              batches.push(messageObj[key])
            }
          }
        }

        // Se encontramos mensagens, retornar como batches
        if (batches.length > 0) {
          console.log(`Encontradas ${batches.length} mensagens em batch`)
          return NextResponse.json({
            batches,
            isBatched: true,
          })
        }

        // Se não encontramos mensagens numeradas, verificar outros campos comuns
        for (const field of ["text", "response", "message", "content"]) {
          if (field in messageObj && typeof messageObj[field] === "string") {
            return NextResponse.json({
              response: messageObj[field],
              isBatched: false,
            })
          }
        }
      }

      // Se chegamos aqui, não conseguimos extrair as mensagens no formato esperado
      console.log("Formato de resposta não reconhecido:", messageObj)

      // Tentar usar o objeto JSON diretamente como resposta
      if (typeof messageObj === "string") {
        return NextResponse.json({
          response: messageObj,
          isBatched: false,
        })
      }

      // Último recurso: converter o objeto para string
      return NextResponse.json({
        response: "Recebi uma resposta, mas não consegui processá-la corretamente. Por favor, tente novamente.",
        isBatched: false,
      })
    } catch (e) {
      console.error("Erro ao processar JSON:", e)

      // Se não for JSON, verificar se o texto contém o separador '---'
      if (responseText.includes("---")) {
        const blocos = responseText
          .split("---")
          .map((bloco) => bloco.trim())
          .filter((bloco) => bloco !== "")

        if (blocos.length > 0) {
          return NextResponse.json({
            batches: blocos,
            isBatched: true,
          })
        }
      }

      // Retornar o texto como está
      return NextResponse.json({
        response: responseText,
        isBatched: false,
      })
    }
  } catch (error) {
    const err = error as Error
    console.error("Erro na API Julinho:", err)
    return NextResponse.json(
      {
        error: "Erro ao processar a solicitação",
        message: err.message,
      },
      { status: 500 },
    )
  }
}
