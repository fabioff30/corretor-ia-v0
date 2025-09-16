import { PREMIUM_CHARACTER_LIMIT, FREE_CHARACTER_LIMIT } from './constants'

// Tipos para assinatura (mantendo compatibilidade)
export interface Subscription {
  id: string
  status: "active" | "canceled" | "expired" | "trial"
  plan: "free" | "premium"
  expiresAt: string // ISO date string
  features: {
    characterLimit: number
    noAds: boolean
    priorityProcessing: boolean
    advancedAnalysis: boolean
  }
}

// Função para obter a assinatura do usuário atual
// Esta função agora serve principalmente como fallback para compatibilidade
export async function getUserSubscription(): Promise<Subscription> {
  // NOTA: Esta função é mantida para compatibilidade com o código existente
  // A lógica principal de assinatura agora está no AuthContext e useSubscription hook
  
  try {
    // Tentar obter dados do localStorage como fallback
    const subscriptionToken = localStorage.getItem("subscription_token")

    if (subscriptionToken) {
      const [plan, expiryDate] = subscriptionToken.split(".")
      const expiry = new Date(expiryDate)

      if (expiry > new Date() && plan === "premium") {
        return {
          id: "sub_legacy_" + Math.random().toString(36).substring(2, 15),
          status: "active",
          plan: "premium",
          expiresAt: expiry.toISOString(),
          features: {
            characterLimit: PREMIUM_CHARACTER_LIMIT,
            noAds: true,
            priorityProcessing: true,
            advancedAnalysis: true,
          },
        }
      }
    }

    // Retornar plano gratuito por padrão
    return {
      id: "free",
      status: "active", 
      plan: "free",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      features: {
        characterLimit: FREE_CHARACTER_LIMIT,
        noAds: false,
        priorityProcessing: false,
        advancedAnalysis: false,
      },
    }
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error)

    return {
      id: "free",
      status: "active",
      plan: "free", 
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      features: {
        characterLimit: FREE_CHARACTER_LIMIT,
        noAds: false,
        priorityProcessing: false,
        advancedAnalysis: false,
      },
    }
  }
}

// Função para simular a ativação de uma assinatura premium (para testes)
export function activatePremiumSubscription(durationDays = 30): void {
  const expiryDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * durationDays)
  const token = `premium.${expiryDate.toISOString()}`
  localStorage.setItem("subscription_token", token)
}

// Função para cancelar uma assinatura  
export function cancelSubscription(): void {
  localStorage.removeItem("subscription_token")
}

// Utilitários para migração
export function migrateToSupabase(): void {
  // Remove dados de assinatura do localStorage ao migrar para Supabase
  localStorage.removeItem("subscription_token")
}
