/**
 * usePurchaseTracking Hook
 * Tracks GA4 purchase events after successful payments
 * Works with both Stripe (card) and PIX payments
 */

import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { sendGA4Event } from '@/utils/gtm-helper'
import { useUser } from './use-user'

interface PurchaseData {
  transactionId: string
  value: number
  currency: string
  paymentMethod: 'card' | 'pix'
  planType: 'monthly' | 'annual' | 'bundle_monthly' | 'lifetime'
  coupon?: string
}

interface UsePurchaseTrackingOptions {
  onPurchaseTracked?: (data: PurchaseData) => void
}

const PLAN_INFO: Record<string, { id: string; name: string; category: string }> = {
  monthly: { id: 'premium_monthly', name: 'Premium Mensal', category: 'subscription' },
  annual: { id: 'premium_annual', name: 'Premium Anual', category: 'subscription' },
  bundle_monthly: { id: 'bundle_monthly', name: 'CorretorIA + Julinho Mensal', category: 'bundle' },
  lifetime: { id: 'premium_lifetime', name: 'Premium Vitalício', category: 'one-time' },
}

const PLAN_PRICES: Record<string, number> = {
  monthly: 29.90,
  annual: 238.80,
  bundle_monthly: 19.90,
  lifetime: 99.90,
}

export function usePurchaseTracking(options: UsePurchaseTrackingOptions = {}) {
  const searchParams = useSearchParams()
  const { user } = useUser()
  const purchaseTrackedRef = useRef(false)
  const { onPurchaseTracked } = options

  // Check if we should track a purchase
  const shouldTrackPurchase = useCallback(() => {
    // Already tracked in this session
    if (purchaseTrackedRef.current) return false

    // Check for payment success indicators
    const paymentSuccess = searchParams.get('payment_success') === 'true'
    const checkoutSuccess = searchParams.get('success') === 'true'
    const paymentStatus = searchParams.get('payment') === 'success'

    return paymentSuccess || checkoutSuccess || paymentStatus
  }, [searchParams])

  // Get purchase data from URL params or fetch from DB
  const getPurchaseData = useCallback(async (): Promise<PurchaseData | null> => {
    // Try to get plan from URL
    const planParam = searchParams.get('plan') as PurchaseData['planType'] | null
    const valueParam = searchParams.get('value')
    const sessionId = searchParams.get('session_id')
    const isBundle = searchParams.get('bundle') === 'true'

    // Determine plan type
    let planType: PurchaseData['planType'] = planParam || (isBundle ? 'bundle_monthly' : 'monthly')

    // Validate plan type
    if (!['monthly', 'annual', 'bundle_monthly', 'lifetime'].includes(planType)) {
      planType = 'monthly'
    }

    // Get value from URL or use default for plan
    const value = valueParam ? parseFloat(valueParam) : PLAN_PRICES[planType] || 29.90

    // Generate transaction ID from session_id or timestamp
    const transactionId = sessionId || `stripe_${user?.id || 'guest'}_${Date.now()}`

    return {
      transactionId,
      value,
      currency: 'BRL',
      paymentMethod: 'card', // Coming from Stripe
      planType,
    }
  }, [searchParams, user?.id])

  // Track the purchase event
  const trackPurchase = useCallback(async (data: PurchaseData) => {
    const planInfo = PLAN_INFO[data.planType] || PLAN_INFO.monthly

    // Send GA4 purchase event with all recommended parameters
    sendGA4Event('purchase', {
      transaction_id: data.transactionId,
      value: data.value,
      currency: data.currency,
      payment_method: data.paymentMethod,
      ...(data.coupon && { coupon: data.coupon }),
      items: [{
        item_id: planInfo.id,
        item_name: planInfo.name,
        item_brand: 'CorretorIA',
        item_category: planInfo.category,
        price: data.value,
        quantity: 1,
      }],
    })

    console.log('[GA4] Purchase event tracked:', {
      transaction_id: data.transactionId,
      value: data.value,
      plan: data.planType,
      payment_method: data.paymentMethod,
    })

    // Mark as tracked
    purchaseTrackedRef.current = true

    // Callback
    onPurchaseTracked?.(data)
  }, [onPurchaseTracked])

  // Effect to track purchase on mount
  useEffect(() => {
    const handlePurchaseTracking = async () => {
      if (!shouldTrackPurchase()) return

      const purchaseData = await getPurchaseData()
      if (purchaseData) {
        await trackPurchase(purchaseData)
      }
    }

    handlePurchaseTracking()
  }, [shouldTrackPurchase, getPurchaseData, trackPurchase])

  // Return function to manually track if needed (for PIX that already tracks in modal)
  return {
    trackPurchase,
    isTracked: purchaseTrackedRef.current,
  }
}
