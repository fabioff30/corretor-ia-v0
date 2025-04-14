/**
 * Utilitário para rastrear eventos do Meta Pixel
 */

// Verifica se o fbq está disponível e se o usuário consentiu com cookies
const canTrack = () => {
  if (typeof window === "undefined") return false

  // Verificar consentimento de cookies
  const consentGiven = localStorage.getItem("cookie-consent")

  // Se o usuário não aceitou explicitamente ou o fbq não está disponível, não rastrear
  if (consentGiven !== "accepted" || !window.fbq) return false

  return true
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
