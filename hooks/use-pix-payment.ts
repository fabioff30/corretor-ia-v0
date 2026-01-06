/**
 * usePixPayment Hook
 * Manages PIX payment state and actions
 */

import { useState, useCallback } from 'react'
import { useToast } from './use-toast'
import { sendGA4Event } from '@/utils/gtm-helper'
import { obfuscateIdentifier } from '@/utils/analytics'

interface PixPaymentData {
  paymentId: string
  qrCode: string
  qrCodeText: string
  amount: number
  planType: 'monthly' | 'annual'
  expiresAt: string
  payerEmail?: string
  isGuest: boolean
}

interface MetaTrackingData {
  fbc?: string | null
  fbp?: string | null
  eventId?: string
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
    couponCode?: string,
    whatsappPhone?: string,
    metaTracking?: MetaTrackingData
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
    couponCode?: string,
    whatsappPhone?: string,
    metaTracking?: MetaTrackingData
  ): Promise<PixPaymentData | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const isGuestPayment = !userId
      const normalizedUserEmail = userEmail?.trim() || undefined
      const normalizedGuestEmail = guestEmail?.trim() || undefined

      // Track initiation
      if (userId) {
        const anonymizedUser = await obfuscateIdentifier(userId, 'uid')
        sendGA4Event('pix_payment_initiated', {
          plan: planType,
          user: anonymizedUser,
        })
      } else {
        // Guest payment tracking (no user ID)
        sendGA4Event('pix_payment_initiated', {
          plan: planType,
          guest: true,
        })
      }

      const response = await fetch('/api/mercadopago/create-pix-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          planType,
          ...(userId && { userId }),
          ...(normalizedUserEmail && { userEmail: normalizedUserEmail }),
          ...(normalizedGuestEmail && { guestEmail: normalizedGuestEmail }),
          ...(couponCode && { couponCode }),
          ...(whatsappPhone && { whatsappPhone }),
          // Meta CAPI tracking data for deduplication
          ...(metaTracking?.fbc && { fbc: metaTracking.fbc }),
          ...(metaTracking?.fbp && { fbp: metaTracking.fbp }),
          ...(metaTracking?.eventId && { eventId: metaTracking.eventId }),
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
        payerEmail:
          data.payerEmail || (isGuestPayment ? normalizedGuestEmail : normalizedUserEmail),
        isGuest: data.isGuest ?? isGuestPayment,
      }

      setPaymentData(payment)

      const anonymizedPayment = await obfuscateIdentifier(payment.paymentId, 'pid')

      // Track success with anonymised identifiers
      sendGA4Event('pix_payment_created', {
        transaction_id: anonymizedPayment,
        plan: planType,
        value: payment.amount,
        currency: 'BRL',
        guest: isGuestPayment,
      })

      return payment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create PIX payment'
      setError(message)

      // Track error
      if (userId) {
        const anonymizedUser = await obfuscateIdentifier(userId, 'uid')
        sendGA4Event('pix_payment_error', {
          error: message,
          plan: planType,
          user: anonymizedUser,
        })
      } else {
        sendGA4Event('pix_payment_error', {
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
        `/api/mercadopago/create-pix-payment?paymentId=${paymentId}`,
        {
          credentials: "include",
        }
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
