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
  createSubscription: (planType?: 'monthly' | 'annual', guestEmail?: string, couponCode?: string) => Promise<{ checkoutUrl: string } | null>
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

      // For now, rely on profile data from useUser hook
      // Stripe subscription details are synced via webhooks to the database
      // and available through the profile
      setSubscription(null)
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Create new subscription
  const createSubscription = async (
    planType: 'monthly' | 'annual' = 'monthly',
    guestEmail?: string,
    couponCode?: string
  ): Promise<{ checkoutUrl: string } | null> => {
    // Guest checkout: requires email
    // Authenticated checkout: requires user
    if (!user && !guestEmail) {
      setError('Email is required for guest checkout')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify(
          user
            ? {
                userId: user.id,
                userEmail: user.email,
                planType,
                ...(couponCode && { couponCode }),
              }
            : {
                guestEmail,
                planType,
                ...(couponCode && { couponCode }),
              }
        ),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMsg = typeof errorData.error === 'string'
          ? errorData.error
          : (errorData.message || 'Failed to create subscription')
        throw new Error(errorMsg)
      }

      const data = await response.json()

      // Refresh subscription data (only for authenticated users)
      if (user) {
        await fetchSubscription()
      }

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

  // Cancel subscription (opens Stripe Customer Portal)
  const cancelSubscription = async (): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated')
      return false
    }

    try {
      setIsLoading(true)
      setError(null)

      // Stripe uses Customer Portal for self-service subscription management
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMsg = typeof errorData.error === 'string'
          ? errorData.error
          : (errorData.message || 'Failed to open customer portal')
        throw new Error(errorMsg)
      }

      const data = await response.json()

      // Redirect to Customer Portal
      window.location.href = data.portalUrl

      return true
    } catch (err) {
      console.error('Error opening customer portal:', err)
      setError(err instanceof Error ? err.message : 'Failed to open customer portal')
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
  const isAdmin = profile?.plan_type === 'admin'
  const hasActiveProSubscription = profile?.plan_type === 'pro' && profile?.subscription_status === 'active'
  const isActive = subscription?.status === 'authorized' || isAdmin
  const isPro = hasActiveProSubscription || isAdmin
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

        // This would be a new API endpoint to fetch payment history from Stripe
        // For now, we'll leave this as a placeholder
        const response = await fetch(`/api/stripe/transactions?userId=${user.id}`)

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
