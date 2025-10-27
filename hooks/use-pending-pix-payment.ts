/**
 * Hook to detect pending PIX payments that need manual activation
 * Checks if user has approved PIX payment but profile is still 'free'
 */

import { useState, useEffect } from 'react'
import { useUser } from './use-user'

interface PendingPixPayment {
  paymentId: string
  amount: number
  planType: 'monthly' | 'annual'
  paidAt: string
}

interface UsePendingPixPaymentResult {
  hasPendingPayment: boolean
  pendingPayment: PendingPixPayment | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function usePendingPixPayment(): UsePendingPixPaymentResult {
  const { profile, user } = useUser()
  const [hasPendingPayment, setHasPendingPayment] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<PendingPixPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPendingPayment = async () => {
    // Only check if user is authenticated and on free plan
    if (!user || !profile || profile.plan_type !== 'free') {
      setHasPendingPayment(false)
      setPendingPayment(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/mercadopago/check-pending-pix', {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 404) {
          // No pending payment found - this is OK
          setHasPendingPayment(false)
          setPendingPayment(null)
          return
        }

        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.hasPendingPayment && data.payment) {
        setHasPendingPayment(true)
        setPendingPayment(data.payment)
      } else {
        setHasPendingPayment(false)
        setPendingPayment(null)
      }
    } catch (err) {
      console.error('[usePendingPixPayment] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to check pending payment')
      setHasPendingPayment(false)
      setPendingPayment(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPendingPayment()
  }, [user?.id, profile?.plan_type])

  return {
    hasPendingPayment,
    pendingPayment,
    loading,
    error,
    refetch: fetchPendingPayment,
  }
}
