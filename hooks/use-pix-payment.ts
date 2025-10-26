/**
 * usePixPayment Hook
 * Manages PIX payment state and actions
 */

import { useState, useCallback } from 'react'
import { useToast } from './use-toast'
import { sendGTMEvent } from '@/utils/gtm-helper'
import { obfuscateIdentifier } from '@/utils/analytics'

interface PixPaymentData {
  paymentId: string
  qrCode: string
  qrCodeText: string
  amount: number
  planType: 'monthly' | 'annual'
  expiresAt: string
}

interface UsePixPaymentReturn {
  isLoading: boolean
  error: string | null
  paymentData: PixPaymentData | null
  createPixPayment: (
    planType: 'monthly' | 'annual',
    userId?: string,
    userEmail?: string,
    guestEmail?: string,
    couponCode?: string
  ) => Promise<PixPaymentData | null>
  checkPaymentStatus: (paymentId: string) => Promise<boolean>
  reset: () => void
}

export function usePixPayment(): UsePixPaymentReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null)
  const { toast } = useToast()

  const createPixPayment = useCallback(async (
    planType: 'monthly' | 'annual',
    userId?: string,
    userEmail?: string,
    guestEmail?: string,
    couponCode?: string
  ): Promise<PixPaymentData | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const isGuestPayment = !userId

      // Track initiation
      if (userId) {
        const anonymizedUser = await obfuscateIdentifier(userId, 'uid')
        sendGTMEvent('pix_payment_initiated', {
          plan: planType,
          user: anonymizedUser,
        })
      } else {
        // Guest payment tracking (no user ID)
        sendGTMEvent('pix_payment_initiated', {
          plan: planType,
          guest: true,
        })
      }

      const response = await fetch('/api/mercadopago/create-pix-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          userId,
          userEmail,
          guestEmail,
          ...(couponCode && { couponCode }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create PIX payment')
      }

      const data = await response.json()

      if (!data.paymentId || !data.qrCode) {
        throw new Error('Invalid PIX payment response')
      }

      const payment: PixPaymentData = {
        paymentId: data.paymentId,
        qrCode: data.qrCode,
        qrCodeText: data.qrCodeText || '',
        amount: data.amount,
        planType,
        expiresAt: data.expiresAt,
      }

      setPaymentData(payment)

      const anonymizedPayment = await obfuscateIdentifier(payment.paymentId, 'pid')

      // Track success with anonymised identifiers
      sendGTMEvent('pix_payment_created', {
        payment: anonymizedPayment,
        plan: planType,
        amount: payment.amount,
        guest: isGuestPayment,
      })

      return payment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create PIX payment'
      setError(message)

      // Track error
      if (userId) {
        const anonymizedUser = await obfuscateIdentifier(userId, 'uid')
        sendGTMEvent('pix_payment_error', {
          error: message,
          plan: planType,
          user: anonymizedUser,
        })
      } else {
        sendGTMEvent('pix_payment_error', {
          error: message,
          plan: planType,
          guest: true,
        })
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao gerar PIX',
        description: message,
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const checkPaymentStatus = useCallback(async (paymentId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/mercadopago/create-pix-payment?paymentId=${paymentId}`
      )

      if (!response.ok) {
        throw new Error('Failed to check payment status')
      }

      const data = await response.json()
      return data.status === 'approved'
    } catch (err) {
      console.error('Error checking payment status:', err)
      return false
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setPaymentData(null)
  }, [])

  return {
    isLoading,
    error,
    paymentData,
    createPixPayment,
    checkPaymentStatus,
    reset,
  }
}
