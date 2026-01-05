declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

/**
 * Emite um evento para o Google Analytics 4 / GTM
 *
 * Usa gtag() se disponível, senão usa dataLayer.push() como fallback.
 * O dataLayer funciona como uma queue que armazena eventos mesmo antes
 * do GTM/GA carregar completamente, evitando perda de eventos.
 */
function emitGA4Event(eventName: string, eventData: Record<string, any> = {}) {
  if (typeof window === "undefined") {
    return
  }

  // Log em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log(`[GA4] ${eventName}`, eventData)
  }

  // 1. Tentar gtag diretamente (mais rápido se já carregou)
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventData)
    return
  }

  // 2. Fallback: usar dataLayer (funciona como queue, não perde eventos)
  // O GTM processa esses eventos quando carregar
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: eventName,
    ...eventData
  })
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
