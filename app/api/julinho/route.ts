import { xai } from "@ai-sdk/xai"
import { StreamingTextResponse } from "ai"
import { generateText } from "ai"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Contexto inicial para o Julinho
    const systemPrompt = `Você é Julinho, um assistente especializado em língua portuguesa.
    Seu objetivo é ajudar os usuários com dúvidas sobre gramática, ortografia, sintaxe, 
    semântica e outros aspectos da língua portuguesa.
    
    Regras importantes:
    1. Responda APENAS perguntas relacionadas à língua portuguesa.
    2. Se a pergunta não estiver relacionada ao idioma português, educadamente explique que você só pode ajudar com questões sobre a língua portuguesa.
    3. Mantenha um tom amigável, didático e engajador.
    4. Seja conciso e direto nas respostas.
    5. Use exemplos quando apropriado para ilustrar conceitos.
    
    Lembre-se: você é um tutor de português, não um assistente geral.`

    // Extrair a última mensagem do usuário
    const lastUserMessage = messages[messages.length - 1].content

    // Verificar se a pergunta é sobre língua portuguesa
    const { text: isPortugueseRelated } = await generateText({
      model: xai("grok-3-mini"),
      prompt: `Determine se a seguinte pergunta está relacionada à língua portuguesa (gramática, ortografia, sintaxe, semântica, literatura portuguesa, etc.): "${lastUserMessage}". Responda apenas com "sim" ou "não".`,
      maxTokens: 5,
    })

    let response

    if (isPortugueseRelated.toLowerCase().includes("sim")) {
      // Gerar resposta para perguntas sobre português
      response = await generateText({
        model: xai("grok-3-mini"),
        system: systemPrompt,
        prompt: lastUserMessage,
        maxTokens: 1000,
      })
    } else {
      // Resposta padrão para perguntas não relacionadas
      response = {
        text: "Desculpe, mas só posso responder perguntas relacionadas à língua portuguesa. Se tiver alguma dúvida sobre gramática, ortografia, sintaxe ou outros aspectos do português, ficarei feliz em ajudar!",
      }
    }

    return new StreamingTextResponse(response.textStream)
  } catch (error) {
    console.error("Erro ao processar a solicitação:", error)
    return new Response(JSON.stringify({ error: "Erro ao processar a solicitação" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
