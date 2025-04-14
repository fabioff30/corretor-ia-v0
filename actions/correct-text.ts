"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const correctionResponseSchema = z.object({
  correctedText: z.string(),
  evaluation: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    suggestions: z.array(z.string()),
    score: z.number().min(0).max(10),
  }),
})

export async function correctText(text: string) {
  try {
    console.log("Iniciando correção de texto com API OpenAI")

    // Verificar se a chave da API está disponível
    if (!process.env.OPENAI_API_KEY) {
      console.error("Chave da API OpenAI não encontrada no ambiente")
      throw new Error("Chave da API OpenAI não configurada")
    }

    const prompt = `
    Você é um especialista em revisão e correção de textos em português. Analise o texto a seguir e faça as seguintes tarefas:

    1. Corrija erros de gramática, ortografia e pontuação.
    2. Melhore a clareza e a coesão do texto quando necessário.
    3. Mantenha o estilo e tom originais do autor.
    4. Forneça uma avaliação do texto com pontos fortes, pontos fracos e sugestões de melhoria.

    Texto original:
    """
    ${text}
    """

    Responda no seguinte formato JSON:
    {
      "correctedText": "O texto corrigido completo",
      "evaluation": {
        "strengths": ["Lista de pontos fortes do texto"],
        "weaknesses": ["Lista de pontos fracos ou erros comuns encontrados"],
        "suggestions": ["Sugestões específicas para melhorar a escrita"],
        "score": 7.5 // Uma pontuação de 0 a 10 para a qualidade geral do texto
      }
    }
    `

    try {
      // Tentar com gpt-3.5-turbo
      console.log("Tentando com modelo gpt-3.5-turbo")

      const { text: responseText } = await generateText({
        model: openai("gpt-3.5-turbo"),
        prompt,
        temperature: 0.3,
        maxTokens: 2000,
      })

      console.log("Resposta recebida da API OpenAI")

      // Extrair o JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error("Formato de resposta inválido:", responseText.substring(0, 100))
        throw new Error("Formato de resposta inválido")
      }

      const jsonResponse = JSON.parse(jsonMatch[0])
      const validatedResponse = correctionResponseSchema.parse(jsonResponse)

      return validatedResponse
    } catch (apiError) {
      console.error("Erro na chamada da API OpenAI:", apiError)
      throw new Error(`Erro na API OpenAI: ${apiError.message || "Erro desconhecido"}`)
    }
  } catch (error) {
    console.error("Erro ao corrigir texto:", error)
    throw new Error(
      "Não foi possível processar a correção do texto: " + (error instanceof Error ? error.message : String(error)),
    )
  }
}
