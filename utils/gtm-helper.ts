/**
 * Envia um evento para o Google Analytics 4 via gtag
 * @param eventName Nome do evento
 * @param eventData Dados adicionais do evento
 */
export function sendGTMEvent(eventName: string, eventData: Record<string, any> = {}) {
  // Verificar se está no navegador
  if (typeof window === "undefined") {
    console.warn('[GA4] Tentativa de envio no servidor - ignorado')
    return
  }

  // Enviar para o dataLayer (GTM - será desabilitado depois)
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    })
    console.log(`[GA4] Evento enviado para dataLayer: ${eventName}`, eventData)
  } else {
    console.warn('[GA4] dataLayer não disponível')
  }

  // Enviar diretamente para o GA4 via gtag
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventData)
    console.log(`[GA4] Evento enviado via gtag: ${eventName}`, eventData)
  } else {
    console.warn('[GA4] gtag() não disponível - script pode não ter carregado ainda')
  }

  // Log detalhado sempre (não apenas em dev)
  console.log(`[GA4 Event] ${eventName}`, {
    params: eventData,
    dataLayerOK: !!window.dataLayer,
    gtagOK: typeof window.gtag === "function"
  })
}

/**
 * Envia um evento customizado para o GA4
 * Usa nomenclatura e parâmetros padronizados do GA4
 */
export function sendGA4Event(eventName: string, eventParams: Record<string, any> = {}) {
  sendGTMEvent(eventName, eventParams)
}
