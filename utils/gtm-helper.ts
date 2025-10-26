/**
 * Envia um evento para o Google Analytics 4 via gtag
 * @param eventName Nome do evento
 * @param eventData Dados adicionais do evento
 */
export function sendGTMEvent(eventName: string, eventData: Record<string, any> = {}) {
  // Verificar se está no navegador
  if (typeof window === "undefined") {
    return
  }

  // Enviar para o dataLayer (GTM - será desabilitado depois)
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    })
  }

  // Enviar diretamente para o GA4 via gtag
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventData)
  }

  // Log em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log(`[GA4 Event] ${eventName}`, eventData)
  }
}

/**
 * Envia um evento customizado para o GA4
 * Usa nomenclatura e parâmetros padronizados do GA4
 */
export function sendGA4Event(eventName: string, eventParams: Record<string, any> = {}) {
  sendGTMEvent(eventName, eventParams)
}
