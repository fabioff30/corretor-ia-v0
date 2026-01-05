/**
 * Christmas Gift Feature Configuration
 * Allows users to purchase subscriptions as gifts for others
 */

// Check if test mode is enabled
const isTestMode = process.env.NEXT_PUBLIC_GIFT_TEST_MODE === 'true' ||
  process.env.NODE_ENV === 'development'

export const CHRISTMAS_GIFT_CONFIG = {
  // Promotion dates
  START_DATE: new Date('2024-12-01T00:00:00Z'),
  END_DATE: new Date('2025-01-06T02:59:00Z'), // Dia de Reis (UTC)

  // Test mode flag
  IS_TEST_MODE: isTestMode,

  // Available plans for gifting
  PLANS: {
    // Test plan - only visible in development/test mode
    ...(isTestMode ? {
      test: {
        id: 'test' as const,
        name: 'Plano Teste',
        description: 'Para testar o fluxo (DEV)',
        price: 2.00,
        duration_months: 1,
        badge: 'TESTE',
        features: [
          'Plano de teste',
          'Apenas para desenvolvimento',
          'R$ 2,00 para testar PIX',
        ],
      },
    } : {}),
    monthly: {
      id: 'monthly' as const,
      name: '1 Mes Premium',
      description: 'Acesso completo por 1 mes',
      price: 29.90,
      duration_months: 1,
      features: [
        'Correcoes ilimitadas',
        'Reescritas ilimitadas',
        'Analise de IA ilimitada',
        'Sem anuncios',
      ],
    },
    annual: {
      id: 'annual' as const,
      name: '1 Ano Premium',
      description: 'Acesso completo por 1 ano',
      price: 238.80,
      original_price: 358.80,
      duration_months: 12,
      popular: true,
      badge: 'Mais Popular',
      features: [
        'Correcoes ilimitadas',
        'Reescritas ilimitadas',
        'Analise de IA ilimitada',
        'Sem anuncios',
        'Economia de 33%',
      ],
    },
    lifetime: {
      id: 'lifetime' as const,
      name: 'Acesso Vitalicio',
      description: 'Acesso Premium para sempre',
      price: 499.90,
      duration_months: -1, // -1 means lifetime
      badge: 'Melhor Valor',
      features: [
        'Correcoes ilimitadas para sempre',
        'Reescritas ilimitadas para sempre',
        'Analise de IA ilimitada',
        'Sem anuncios',
        'Nunca expira',
      ],
    },
  },

  // Gift code validity (in days)
  CODE_VALIDITY_DAYS: 90,

  // Message limits
  MAX_MESSAGE_LENGTH: 500,

  // Email configuration
  EMAIL: {
    subject: 'Voce recebeu um presente de Natal!',
    from_name: 'CorretorIA',
  },
} as const

export type GiftPlanId = keyof typeof CHRISTMAS_GIFT_CONFIG.PLANS
export type GiftPlan = (typeof CHRISTMAS_GIFT_CONFIG.PLANS)[GiftPlanId]

/**
 * Check if Christmas gift feature is active
 */
export function isChristmasGiftActive(): boolean {
  const now = new Date()
  return now >= CHRISTMAS_GIFT_CONFIG.START_DATE && now <= CHRISTMAS_GIFT_CONFIG.END_DATE
}

/**
 * Get gift plan by ID
 */
export function getGiftPlan(planId: GiftPlanId): GiftPlan | undefined {
  return CHRISTMAS_GIFT_CONFIG.PLANS[planId]
}

/**
 * Get all available gift plans as array
 */
export function getGiftPlansArray() {
  return Object.entries(CHRISTMAS_GIFT_CONFIG.PLANS).map(([id, plan]) => ({
    ...plan,
    id: id as GiftPlanId,
  }))
}

/**
 * Calculate gift code expiration date
 */
export function calculateGiftExpirationDate(): Date {
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + CHRISTMAS_GIFT_CONFIG.CODE_VALIDITY_DAYS)
  return expirationDate
}

/**
 * Format price for display
 */
export function formatGiftPrice(price: number): string {
  return price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Get discount percentage for plans with original_price
 */
export function getDiscountPercentage(plan: { price: number; original_price?: number } | undefined | null): number | null {
  if (plan && 'original_price' in plan && plan.original_price) {
    return Math.round(((plan.original_price - plan.price) / plan.original_price) * 100)
  }
  return null
}
