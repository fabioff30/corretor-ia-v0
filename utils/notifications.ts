/**
 * Utilitário para enviar notificações quando um usuário enviar uma avaliação
 */

// URL do webhook para notificações (pode ser Discord, Slack, ou um serviço personalizado)
const NOTIFICATION_WEBHOOK_URL =
  process.env.NOTIFICATION_WEBHOOK_URL || "https://auto.ffmedia.com.br/webhook/avaliacao-122312234234"

/**
 * Envia uma notificação para o webhook configurado
 */
export async function sendRatingNotification(data: {
  rating: number
  feedback?: string
  correctionId?: string
  textLength?: number
  timestamp: string
  ip?: string
}) {
  // Se não houver URL de webhook configurada, não fazer nada
  if (!NOTIFICATION_WEBHOOK_URL) {
    console.warn("URL de webhook para notificações não configurada")
    return false
  }

  try {
    // Formatar a mensagem para o webhook
    // O formato exato pode variar dependendo do serviço (Discord, Slack, etc.)
    const message = {
      // Formato genérico que funciona com a maioria dos webhooks
      content: `📊 Nova avaliação recebida: ${data.rating}/5 estrelas`,
      embeds: [
        {
          title: `Avaliação: ${data.rating}/5 estrelas`,
          description: data.feedback || "Sem feedback textual",
          color: getRatingColor(data.rating),
          fields: [
            {
              name: "ID da Correção",
              value: data.correctionId || "N/A",
              inline: true,
            },
            {
              name: "Tamanho do Texto",
              value: data.textLength ? `${data.textLength} caracteres` : "N/A",
              inline: true,
            },
            {
              name: "Timestamp",
              value: data.timestamp,
              inline: true,
            },
            {
              name: "IP (parcial)",
              value: data.ip ? maskIP(data.ip) : "N/A",
              inline: true,
            },
          ],
        },
      ],
    }

    // Enviar a notificação para o webhook com timeout para evitar bloqueio
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

    try {
      const response = await fetch(NOTIFICATION_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Erro ao enviar notificação: ${response.status} ${response.statusText}`)
        return false
      }

      return true
    } catch (fetchError) {
      console.warn("Erro na requisição de notificação:", fetchError)
      return false
    }
  } catch (error) {
    // Apenas registrar o erro, não interromper o fluxo principal
    console.warn("Erro ao preparar notificação:", error)
    return false
  }
}

/**
 * Retorna uma cor baseada na avaliação (para uso em embeds coloridos)
 */
function getRatingColor(rating: number): number {
  // Cores em formato decimal para embeds (Discord, etc.)
  switch (rating) {
    case 5:
      return 0x4caf50 // Verde
    case 4:
      return 0x8bc34a // Verde claro
    case 3:
      return 0xffeb3b // Amarelo
    case 2:
      return 0xff9800 // Laranja
    case 1:
      return 0xf44336 // Vermelho
    default:
      return 0x9e9e9e // Cinza
  }
}

/**
 * Mascara o IP para privacidade (mostra apenas os primeiros octetos)
 */
function maskIP(ip: string): string {
  // Para IPv4: mostra apenas os dois primeiros octetos (ex: 192.168.xxx.xxx)
  // Para IPv6: mostra apenas os primeiros 4 caracteres (ex: 2001:xxx:xxx:xxx)
  if (ip.includes(".")) {
    const parts = ip.split(".")
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`
    }
  } else if (ip.includes(":")) {
    return ip.substring(0, 4) + ":xxxx:xxxx:xxxx"
  }
  return "xxx.xxx.xxx.xxx"
}
