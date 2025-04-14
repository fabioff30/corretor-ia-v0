// Tipos para assinatura
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
export async function getUserSubscription(): Promise<Subscription> {
  // Em produção, isso faria uma chamada à API para verificar o status da assinatura
  // Por enquanto, vamos simular com base no localStorage

  try {
    // Verificar se há um token de assinatura no localStorage
    const subscriptionToken = localStorage.getItem("subscription_token")

    if (subscriptionToken) {
      // Em produção, validaríamos este token com o backend
      // Por enquanto, vamos decodificar um token simulado
      const [plan, expiryDate] = subscriptionToken.split(".")
      const expiry = new Date(expiryDate)

      // Verificar se a assinatura expirou
      if (expiry > new Date()) {
        if (plan === "premium") {
          return {
            id: "sub_" + Math.random().toString(36).substring(2, 15),
            status: "active",
            plan: "premium",
            expiresAt: expiry.toISOString(),
            features: {
              characterLimit: Number.POSITIVE_INFINITY,
              noAds: true,
              priorityProcessing: true,
              advancedAnalysis: true,
            },
          }
        }
      }
    }

    // Se não houver token ou estiver expirado, retornar plano gratuito
    return {
      id: "free",
      status: "active",
      plan: "free",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 ano no futuro
      features: {
        characterLimit: 1500,
        noAds: false,
        priorityProcessing: false,
        advancedAnalysis: false,
      },
    }
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error)

    // Em caso de erro, retornar plano gratuito por segurança
    return {
      id: "free",
      status: "active",
      plan: "free",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      features: {
        characterLimit: 1500,
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
