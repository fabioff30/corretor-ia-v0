/**
 * Controle de frequência do banner promocional de cópia
 * Gerencia quando o banner deve ser exibido para evitar spam
 */

const COPY_PROMO_BANNER_KEY = "copyPromoBannerLastShown"
const PROMO_END_TIME_KEY = "promoEndTime"
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000 // 24 horas em millisegundos

/**
 * Verifica se o banner promocional deve ser exibido
 * @returns true se o banner pode ser exibido, false caso contrário
 */
export function shouldShowPromoBanner(): boolean {
  if (typeof window === "undefined") return false

  const lastShown = localStorage.getItem(COPY_PROMO_BANNER_KEY)
  const now = Date.now()

  // Se nunca foi exibido, pode mostrar
  if (!lastShown) return true

  // Verifica se já passou o período de cooldown (24 horas)
  const timeSinceLastShown = now - parseInt(lastShown)
  return timeSinceLastShown > COOLDOWN_PERIOD
}

/**
 * Registra que o banner foi exibido
 */
export function markPromoBannerAsShown(): void {
  if (typeof window === "undefined") return

  const now = Date.now()
  localStorage.setItem(COPY_PROMO_BANNER_KEY, now.toString())
}

/**
 * Obtém o tempo final da promoção
 * Se não existir, cria um novo tempo de 24 horas a partir de agora
 * @returns timestamp do fim da promoção
 */
export function getPromoEndTime(): number {
  if (typeof window === "undefined") return Date.now() + COOLDOWN_PERIOD

  const savedEndTime = localStorage.getItem(PROMO_END_TIME_KEY)

  if (savedEndTime) {
    return parseInt(savedEndTime)
  }

  // Cria um novo tempo de expiração
  const endTime = Date.now() + COOLDOWN_PERIOD
  localStorage.setItem(PROMO_END_TIME_KEY, endTime.toString())
  return endTime
}

/**
 * Reseta o controle do banner (útil para testes)
 */
export function resetPromoBannerControl(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(COPY_PROMO_BANNER_KEY)
  localStorage.removeItem(PROMO_END_TIME_KEY)
}

/**
 * Calcula o tempo restante da promoção
 * @returns objeto com horas, minutos e segundos restantes
 */
export function calculateTimeLeft(endTime: number): {
  hours: number
  minutes: number
  seconds: number
} {
  const now = Date.now()
  const difference = endTime - now

  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 }
  }

  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((difference / 1000 / 60) % 60)
  const seconds = Math.floor((difference / 1000) % 60)

  return { hours, minutes, seconds }
}
