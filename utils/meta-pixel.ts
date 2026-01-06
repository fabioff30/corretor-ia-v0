/**
 * Utilitário para rastrear eventos do Meta Pixel
 *
 * Inclui suporte para:
 * - Deduplicação via eventID (para uso com CAPI)
 * - Captura de cookies _fbc e _fbp para server-side tracking
 */

// Verifica se o fbq está disponível e se o usuário consentiu com cookies
export const canTrack = () => {
  if (typeof window === "undefined") return false

  // Verificar consentimento de cookies
  const consentGiven = localStorage.getItem("cookie-consent")

  // Se o usuário não aceitou explicitamente ou o fbq não está disponível, não rastrear
  if (consentGiven !== "accepted" || !window.fbq) return false

  return true
}

/**
 * Gera um event_id único para deduplicação entre Pixel e CAPI
 * Formato: {eventName}_{timestamp}_{randomString}
 *
 * @param eventName Nome do evento (será usado como prefixo)
 * @returns ID único para o evento
 */
export function generateEventId(eventName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return `${eventName.toLowerCase()}_${timestamp}_${random}`
}

/**
 * Captura os cookies do Meta Pixel (_fbc e _fbp)
 * Usados para melhorar Event Match Quality no CAPI
 *
 * @returns { fbc, fbp } - Valores dos cookies ou null se não existirem
 */
export function getMetaCookies(): { fbc: string | null; fbp: string | null } {
  if (typeof document === "undefined") {
    return { fbc: null, fbp: null }
  }

  const cookies = document.cookie.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=")
      if (key) {
        acc[key] = value || ""
      }
      return acc
    },
    {} as Record<string, string>
  )

  return {
    fbc: cookies["_fbc"] || null,
    fbp: cookies["_fbp"] || null,
  }
}

/**
 * Verifica se o usuário deu consentimento para tracking
 */
export function hasTrackingConsent(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("cookie-consent") === "accepted"
}

/**
 * Rastreia um evento padrão do Meta Pixel
 * @param eventName Nome do evento padrão
 * @param params Parâmetros adicionais (opcional)
 */
export function trackPixelEvent(eventName: string, params?: Record<string, any>) {
  if (!canTrack()) return

  try {
    window.fbq("track", eventName, params)
    console.log(`Meta Pixel: Evento "${eventName}" rastreado`, params)
  } catch (error) {
    console.error(`Erro ao rastrear evento "${eventName}" do Meta Pixel:`, error)
  }
}

/**
 * Rastreia um evento padrão do Meta Pixel com eventID para deduplicação
 * Use esta função quando também enviar o evento via CAPI
 *
 * @param eventName Nome do evento padrão
 * @param params Parâmetros adicionais (opcional)
 * @param eventId ID do evento para deduplicação (gerar com generateEventId)
 * @returns O eventId usado (para passar ao CAPI) ou null se não rastreou
 */
export function trackPixelEventWithDedup(
  eventName: string,
  params?: Record<string, any>,
  eventId?: string
): string | null {
  if (!canTrack()) return null

  const id = eventId || generateEventId(eventName)

  try {
    // O terceiro parâmetro é options onde passamos eventID
    window.fbq("track", eventName, params, { eventID: id })
    console.log(`Meta Pixel: Evento "${eventName}" rastreado com eventID: ${id}`)
    return id
  } catch (error) {
    console.error(`Erro ao rastrear evento "${eventName}" do Meta Pixel:`, error)
    return null
  }
}

/**
 * Rastreia um evento personalizado do Meta Pixel
 * @param eventName Nome do evento personalizado
 * @param params Parâmetros adicionais (opcional)
 */
export function trackPixelCustomEvent(eventName: string, params?: Record<string, any>) {
  if (!canTrack()) return

  try {
    window.fbq("trackCustom", eventName, params)
    console.log(`Meta Pixel: Evento personalizado "${eventName}" rastreado`, params)
  } catch (error) {
    console.error(`Erro ao rastrear evento personalizado "${eventName}" do Meta Pixel:`, error)
  }
}

/**
 * Rastreia um evento personalizado do Meta Pixel com eventID para deduplicação
 * Use esta função quando também enviar o evento via CAPI
 *
 * @param eventName Nome do evento personalizado
 * @param params Parâmetros adicionais (opcional)
 * @param eventId ID do evento para deduplicação (gerar com generateEventId)
 * @returns O eventId usado (para passar ao CAPI) ou null se não rastreou
 */
export function trackPixelCustomEventWithDedup(
  eventName: string,
  params?: Record<string, any>,
  eventId?: string
): string | null {
  if (!canTrack()) return null

  const id = eventId || generateEventId(eventName)

  try {
    window.fbq("trackCustom", eventName, params, { eventID: id })
    console.log(`Meta Pixel: Evento personalizado "${eventName}" rastreado com eventID: ${id}`)
    return id
  } catch (error) {
    console.error(`Erro ao rastrear evento personalizado "${eventName}" do Meta Pixel:`, error)
    return null
  }
}
