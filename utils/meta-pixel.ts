/**
 * Utilitário para rastrear eventos do Meta Pixel
 *
 * Inclui suporte para:
 * - Deduplicação via eventID (para uso com CAPI)
 * - Captura de cookies _fbc e _fbp para server-side tracking
 * - Construção manual de fbc a partir de fbclid quando cookie não existe
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 */

// Storage key for fbclid persistence
const FBCLID_STORAGE_KEY = 'meta_fbclid'
const FBCLID_TIMESTAMP_KEY = 'meta_fbclid_ts'

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
 * Captura o fbclid da URL e armazena no sessionStorage
 * Deve ser chamado o mais cedo possível no carregamento da página
 *
 * @returns O fbclid se encontrado, null caso contrário
 */
export function captureFbclid(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    // Tentar capturar da URL atual
    const urlParams = new URLSearchParams(window.location.search)
    const fbclid = urlParams.get("fbclid")

    if (fbclid) {
      // Armazenar para uso posterior (sessão do usuário)
      sessionStorage.setItem(FBCLID_STORAGE_KEY, fbclid)
      sessionStorage.setItem(FBCLID_TIMESTAMP_KEY, Date.now().toString())
      console.log("[Meta] fbclid capturado da URL:", fbclid.substring(0, 20) + "...")
      return fbclid
    }

    // Se não está na URL, tentar recuperar do sessionStorage
    const storedFbclid = sessionStorage.getItem(FBCLID_STORAGE_KEY)
    const storedTimestamp = sessionStorage.getItem(FBCLID_TIMESTAMP_KEY)

    if (storedFbclid && storedTimestamp) {
      // fbclid é válido por 7 dias segundo a Meta
      const timestamp = parseInt(storedTimestamp, 10)
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - timestamp < sevenDaysMs) {
        return storedFbclid
      } else {
        // Expirado, limpar
        sessionStorage.removeItem(FBCLID_STORAGE_KEY)
        sessionStorage.removeItem(FBCLID_TIMESTAMP_KEY)
      }
    }

    return null
  } catch (error) {
    console.error("[Meta] Erro ao capturar fbclid:", error)
    return null
  }
}

/**
 * Constrói o parâmetro fbc a partir do fbclid
 * Formato: fb.{subdomain_index}.{creation_time}.{fbclid}
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters#fbc
 *
 * @param fbclid - O click ID do Meta (da URL ou armazenado)
 * @param timestamp - Timestamp opcional (usa Date.now() se não fornecido)
 * @returns String no formato fbc ou null se fbclid inválido
 */
export function constructFbc(fbclid: string | null, timestamp?: number): string | null {
  if (!fbclid) {
    return null
  }

  // Formato: fb.1.{timestamp_ms}.{fbclid}
  // subdomain_index é sempre 1 para websites
  const ts = timestamp || Date.now()
  return `fb.1.${ts}.${fbclid}`
}

/**
 * Obtém o fbc para envio ao CAPI
 * Prioridade:
 * 1. Cookie _fbc (definido pelo Meta Pixel)
 * 2. Construção manual a partir de fbclid (se disponível)
 *
 * @returns O valor fbc pronto para envio (NÃO hashado) ou null
 */
export function getFbc(): string | null {
  if (typeof document === "undefined") {
    return null
  }

  // Primeiro, tentar obter do cookie _fbc (definido pelo Pixel)
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

  const cookieFbc = cookies["_fbc"]
  if (cookieFbc) {
    console.log("[Meta] fbc obtido do cookie _fbc")
    return cookieFbc
  }

  // Se não tem cookie, tentar construir a partir do fbclid
  const fbclid = captureFbclid()
  if (fbclid) {
    const constructedFbc = constructFbc(fbclid)
    console.log("[Meta] fbc construído a partir de fbclid:", constructedFbc?.substring(0, 30) + "...")
    return constructedFbc
  }

  return null
}

/**
 * Obtém os parâmetros fbc e fbp para envio ao CAPI
 * Versão melhorada que tenta construir fbc a partir de fbclid se necessário
 *
 * @returns { fbc, fbp } - Valores prontos para envio (NÃO hashados)
 */
export function getMetaTrackingParams(): { fbc: string | null; fbp: string | null } {
  if (typeof document === "undefined") {
    return { fbc: null, fbp: null }
  }

  const { fbp } = getMetaCookies()
  const fbc = getFbc()

  return { fbc, fbp }
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
