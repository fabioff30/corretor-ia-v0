import { useAuth } from '@/contexts/unified-auth-context'
import { useMemo } from 'react'

// Configurações dos planos
const PLAN_CONFIG = {
  free: {
    characterLimit: 1500,
    noAds: false,
    priorityProcessing: false,
    advancedAnalysis: false,
  },
  premium: {
    characterLimit: 10000,
    noAds: true,
    priorityProcessing: true,
    advancedAnalysis: true,
  },
  pro: {
    characterLimit: 10000,
    noAds: true,
    priorityProcessing: true,
    advancedAnalysis: true,
  },
  plus: {
    characterLimit: 10000,
    noAds: true,
    priorityProcessing: true,
    advancedAnalysis: true,
  },
} as const

export interface SubscriptionFeatures {
  characterLimit: number
  noAds: boolean
  priorityProcessing: boolean
  advancedAnalysis: boolean
}

export interface EnhancedSubscription {
  id: string
  status: 'active' | 'canceled' | 'expired' | 'trial'
  plan: 'free' | 'premium' | 'pro' | 'plus'
  features: SubscriptionFeatures
  expiresAt?: string
  isActive: boolean
  isPremium: boolean
  daysUntilExpiry?: number
  planDisplayName: string
  planPrice: string
}

export function useSubscription(): EnhancedSubscription {
  const { user } = useAuth()

  return useMemo(() => {
    // Check for user profile with Stripe data first
    const subscription = user?.subscription
    const plan = subscription?.plan || 'free'
    const status = subscription?.status || 'active'

    // Verificar se a assinatura está ativa
    const isActive = status === 'active' && (
      !subscription?.current_period_end ||
      new Date(subscription.current_period_end) > new Date()
    )

    // Calcular dias até expirar
    let daysUntilExpiry: number | undefined
    if (subscription?.current_period_end) {
      const expiryDate = new Date(subscription.current_period_end)
      const today = new Date()
      const diffTime = expiryDate.getTime() - today.getTime()
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const isPremium = isActive && (plan === 'premium' || plan === 'pro' || plan === 'plus')
    const features = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free

    // Map plan names and prices
    const planMapping = {
      free: { displayName: 'Gratuito', price: 'R$ 0,00' },
      premium: { displayName: 'CorretorIA Premium', price: 'R$ 19,90/mês' },
      pro: { displayName: 'CorretorIA Pro', price: 'R$ 19,90/mês' },
      plus: { displayName: 'CorretorIA Plus', price: 'R$ 39,90/mês' },
    }

    const currentPlanInfo = planMapping[plan as keyof typeof planMapping] || planMapping.free

    return {
      id: subscription?.id || 'free',
      status,
      plan: plan as 'free' | 'premium' | 'pro' | 'plus',
      features,
      expiresAt: subscription?.current_period_end,
      isActive,
      isPremium,
      daysUntilExpiry: daysUntilExpiry && daysUntilExpiry > 0 ? daysUntilExpiry : undefined,
      planDisplayName: currentPlanInfo.displayName,
      planPrice: currentPlanInfo.price,
    }
  }, [user])
}

// Hook para verificar se o usuário pode usar uma funcionalidade
export function useFeatureAccess() {
  const subscription = useSubscription()

  return {
    canUseAdvancedFeatures: subscription.isPremium,
    canAvoidAds: subscription.features.noAds,
    characterLimit: subscription.features.characterLimit,
    hasExpired: subscription.status === 'expired',
    needsUpgrade: (requiredFeature: keyof SubscriptionFeatures) => {
      return !subscription.features[requiredFeature]
    },
  }
}