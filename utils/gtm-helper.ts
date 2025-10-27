declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

/**
 * Emite um evento diretamente para o Google Analytics 4 via gtag
 */
function emitGA4Event(eventName: string, eventData: Record<string, any> = {}) {
  if (typeof window === "undefined") {
    return
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventData)
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[GA4] ${eventName}`, eventData)
  }
}

/**
 * @deprecated Utilize `sendGA4Event`. Mantido por compatibilidade.
 */
export function sendGTMEvent(eventName: string, eventData: Record<string, any> = {}) {
  emitGA4Event(eventName, eventData)
}

/**
 * Envia um evento customizado para o GA4
 * Usa nomenclatura e parâmetros padronizados do GA4
 */
export function sendGA4Event(eventName: string, eventParams: Record<string, any> = {}) {
  emitGA4Event(eventName, eventParams)
}
