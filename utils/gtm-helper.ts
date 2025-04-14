/**
 * Envia um evento para o Google Tag Manager
 * @param eventName Nome do evento
 * @param eventData Dados adicionais do evento
 */
export function sendGTMEvent(eventName: string, eventData: Record<string, any> = {}) {
  // Verificar se o dataLayer existe
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    })
  }
}
