import { useState } from 'react'
import { useAuth } from '@/contexts/unified-auth-context'

export function useStripeCustomerPortal() {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const openCustomerPortal = async () => {
    if (!user) {
      alert('Você precisa estar logado para acessar o portal de gerenciamento.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.error) {
        console.error('Error creating customer portal session:', data.error)
        alert('Erro ao abrir portal de gerenciamento. Tente novamente.')
        return
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (error) {
      console.error('Error opening customer portal:', error)
      alert('Erro ao abrir portal de gerenciamento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    openCustomerPortal,
    isLoading,
  }
}