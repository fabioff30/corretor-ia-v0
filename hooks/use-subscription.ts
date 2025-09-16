import { useAuth } from '@/contexts/auth-context'
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
  plan: 'free' | 'premium'
  features: SubscriptionFeatures
  expiresAt?: string
  isActive: boolean
  isPremium: boolean
  daysUntilExpiry?: number
}

export function useSubscription(): EnhancedSubscription {
  const { user } = useAuth()

  return useMemo(() => {
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

    const isPremium = isActive && plan === 'premium'
    const features = PLAN_CONFIG[isPremium ? 'premium' : 'free']

    return {
      id: subscription?.id || 'free',
      status,
      plan: isPremium ? 'premium' : 'free',
      features,
      expiresAt: subscription?.current_period_end,
      isActive,
      isPremium,
      daysUntilExpiry: daysUntilExpiry && daysUntilExpiry > 0 ? daysUntilExpiry : undefined,
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