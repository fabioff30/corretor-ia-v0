/**
 * useSubscription Hook
 * Manages subscription state and actions for the current user
 */

import { useEffect, useState } from 'react'
import { useUser } from './use-user'
import type { Subscription, PaymentTransaction } from '@/types/supabase'

interface SubscriptionData {
  subscription: Subscription | null
  isLoading: boolean
  error: string | null
  isActive: boolean
  isPro: boolean
  canCancel: boolean
  nextPaymentDate: string | null
  amount: number | null
  currency: string | null
}

interface SubscriptionActions {
  createSubscription: () => Promise<{ checkoutUrl: string } | null>
  cancelSubscription: () => Promise<boolean>
  refreshSubscription: () => Promise<void>
}

export function useSubscription(): SubscriptionData & SubscriptionActions {
  const { user, profile } = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch subscription data
  const fetchSubscription = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/mercadopago/create-subscription?userId=${user.id}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      const data = await response.json()

      if (data.hasActiveSubscription) {
        setSubscription(data.subscription)
      } else {
        setSubscription(null)
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Create new subscription
  const createSubscription = async (): Promise<{ checkoutUrl: string } | null> => {
    if (!user?.id || !user?.email) {
      setError('User not authenticated')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subscription')
      }

      const data = await response.json()

      // Refresh subscription data
      await fetchSubscription()

      return {
        checkoutUrl: data.checkoutUrl,
      }
    } catch (err) {
      console.error('Error creating subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to create subscription')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel subscription
  const cancelSubscription = async (): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated')
      return false
    }

    if (!subscription?.id) {
      setError('No active subscription to cancel')
      return false
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/mercadopago/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subscriptionId: subscription.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel subscription')
      }

      // Refresh subscription data
      await fetchSubscription()

      return true
    } catch (err) {
      console.error('Error canceling subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh subscription data
  const refreshSubscription = async () => {
    await fetchSubscription()
  }

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchSubscription()
  }, [user?.id])

  // Computed values
  const isActive = subscription?.status === 'authorized'
  const isPro = profile?.plan_type === 'pro' && profile?.subscription_status === 'active'
  const canCancel = isActive && subscription !== null
  const nextPaymentDate = subscription?.next_payment_date || null
  const amount = subscription?.amount || null
  const currency = subscription?.currency || null

  return {
    subscription,
    isLoading,
    error,
    isActive,
    isPro,
    canCancel,
    nextPaymentDate,
    amount,
    currency,
    createSubscription,
    cancelSubscription,
    refreshSubscription,
  }
}

/**
 * usePaymentHistory Hook
 * Fetch payment transaction history for the current user
 */
export function usePaymentHistory() {
  const { user } = useUser()
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // This would be a new API endpoint to fetch payment history
        // For now, we'll leave this as a placeholder
        const response = await fetch(`/api/mercadopago/transactions?userId=${user.id}`)

        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }

        const data = await response.json()
        setTransactions(data.transactions || [])
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [user?.id])

  return {
    transactions,
    isLoading,
    error,
  }
}
