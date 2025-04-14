"use server"

// URL do webhook do n8n
const WEBHOOK_URL = "https://auto.ffmedia.com.br/webhook/webapp-tradutor"

export async function correctTextViaWebhook(text: string, isMobile = false) {
  try {
    console.log(`Enviando texto para o webhook do n8n (${isMobile ? "mobile" : "desktop"})`)

    // Sanitizar o texto antes de enviar
    let sanitizedText = text.trim()

    // Sanitização adicional para dispositivos móveis
    if (isMobile) {
      // Remover caracteres problemáticos que podem aparecer em teclados móveis
      sanitizedText = sanitizedText
        .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remover caracteres de largura zero
        .replace(/\u00A0/g, " ") // Substituir espaços não-quebráveis por espaços normais
        .replace(/[\r\n]+/g, "\n") // Normalizar quebras de linha
    }

    if (!sanitizedText) {
      throw new Error("Texto vazio")
    }

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: sanitizedText,
        source: isMobile ? "mobile" : "desktop",
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Resposta recebida do webhook")

    // Processar o formato específico retornado pelo webhook
    // [{ output: { correctedText: "...", evaluation: {...} } }]
    if (Array.isArray(data) && data.length > 0 && data[0].output) {
      return data[0].output
    } else if (data.correctedText && data.evaluation) {
      // Formato alternativo que pode ser retornado
      return data
    } else {
      console.warn("Formato de resposta inesperado do webhook:", data)
      throw new Error("Formato de resposta inesperado do webhook")
    }
  } catch (error) {
    console.error("Erro ao enviar texto para o webhook:", error)
    throw new Error(
      "Não foi possível processar a correção do texto: " + (error instanceof Error ? error.message : String(error)),
    )
  }
}
