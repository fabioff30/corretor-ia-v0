/**
 * API Route: Create Stripe Checkout Session
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe/server'
import { getPublicConfig } from '@/utils/env-config'
import { isVoltaFeriasActive, VOLTA_FERIAS_CONFIG } from '@/utils/constants'

export const maxDuration = 60

interface CreateCheckoutRequest {
  userId?: string // Optional for guest checkouts
  userEmail?: string // Optional for authenticated users
  guestEmail?: string // Required for guest checkouts
  planType: 'monthly' | 'annual' | 'bundle_monthly' | 'bundle_monthly_test'
  returnUrl?: string
  couponCode?: string // Optional coupon code for discounts
  whatsappPhone?: string // Required for bundle purchases (for Julinho activation)
  testPriceId?: string // Optional test price ID for testing
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await request.json()
    const { userId, userEmail, guestEmail, planType, returnUrl, couponCode, whatsappPhone, testPriceId } = body

    // Determine if this is a guest checkout
    const isGuestCheckout = !userId

    // Check if this is a test mode request
    const isTestMode = planType === 'bundle_monthly_test' || !!testPriceId

    // Validate: must have userId OR guestEmail
    if (!userId && !guestEmail) {
      return NextResponse.json(
        { error: 'Either userId or guestEmail is required' },
        { status: 400 }
      )
    }

    // Validate plan type
    if (!planType || !['monthly', 'annual', 'bundle_monthly', 'bundle_monthly_test'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "monthly", "annual", "bundle_monthly", or "bundle_monthly_test"' },
        { status: 400 }
      )
    }

    // Bundle requires WhatsApp phone for Julinho activation (including test mode)
    const isBundlePlan = planType === 'bundle_monthly' || planType === 'bundle_monthly_test'
    if (isBundlePlan && !whatsappPhone) {
      return NextResponse.json(
        { error: 'WhatsApp phone is required for bundle purchases' },
        { status: 400 }
      )
    }

    // Determine final email
    const finalEmail = isGuestCheckout ? guestEmail! : (userEmail || '')

    // Validate email format for ALL checkouts (guest and authenticated)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!finalEmail || !emailRegex.test(finalEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format. Please update your email in account settings.' },
        { status: 400 }
      )
    }

    console.log('[Stripe Checkout]', isGuestCheckout ? 'Guest' : 'Authenticated', 'checkout for:', finalEmail, 'plan:', planType)

    // Check if Volta às Férias promotion is active
    const isPromoActive = isVoltaFeriasActive()

    // Get price ID based on plan type (or use test price ID if provided)
    let priceId: string
    if (testPriceId) {
      // Test mode: use provided test price ID
      priceId = testPriceId
      console.log('[Stripe Checkout] TEST MODE: Using test price ID:', priceId)
    } else {
      switch (planType) {
        case 'monthly':
          // Use promotion price ID if active
          priceId = isPromoActive ? VOLTA_FERIAS_CONFIG.STRIPE_MONTHLY_PRICE_ID : STRIPE_PRICES.MONTHLY
          break
        case 'annual':
          // Use promotion price ID if active
          priceId = isPromoActive ? VOLTA_FERIAS_CONFIG.STRIPE_ANNUAL_PRICE_ID : STRIPE_PRICES.ANNUAL
          break
        case 'bundle_monthly':
        case 'bundle_monthly_test':
          priceId = STRIPE_PRICES.BUNDLE_MONTHLY
          break
        default:
          priceId = isPromoActive ? VOLTA_FERIAS_CONFIG.STRIPE_MONTHLY_PRICE_ID : STRIPE_PRICES.MONTHLY
      }
    }

    if (isPromoActive && (planType === 'monthly' || planType === 'annual')) {
      console.log('[Stripe Checkout] PROMO ACTIVE: Using Volta às Férias price ID:', priceId)
    }

    // Determine URLs - use request origin for correct environment
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || getPublicConfig().APP_URL
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin // Remove trailing slash

    // For guest checkouts, redirect to login/register page after success
    // For all plans, redirect to dashboard after success
    // Include plan type and value for GA4 purchase tracking
    const planPrices: Record<string, number> = {
      monthly: isPromoActive ? VOLTA_FERIAS_CONFIG.MONTHLY_PRICE : 29.90,
      annual: isPromoActive ? VOLTA_FERIAS_CONFIG.ANNUAL_PRICE : 238.80,
      bundle_monthly: 19.90,
      bundle_monthly_test: 19.90,
    }
    const planValue = planPrices[planType] || (isPromoActive ? VOLTA_FERIAS_CONFIG.MONTHLY_PRICE : 29.90)

    let successUrl: string
    if (isGuestCheckout) {
      successUrl = isBundlePlan
        ? `${baseUrl}/login?payment_success=true&bundle=true&email=${encodeURIComponent(finalEmail)}&value=${planValue}`
        : `${baseUrl}/login?payment_success=true&email=${encodeURIComponent(finalEmail)}&plan=${planType}&value=${planValue}`
    } else {
      // Authenticated users go to dashboard with GA4 tracking params
      successUrl = `${baseUrl}/dashboard?payment_success=true&plan=${planType}&value=${planValue}&session_id={CHECKOUT_SESSION_ID}`
    }

    const cancelUrl = isBundlePlan
      ? `${baseUrl}/oferta-fim-de-ano?canceled=true`
      : `${baseUrl}/premium?canceled=true`

    // Create checkout session with bundle metadata if applicable
    const session = await createCheckoutSession(
      userId || null, // null for guest checkouts
      finalEmail,
      priceId,
      successUrl,
      cancelUrl,
      isGuestCheckout, // Pass flag to mark as guest in metadata
      couponCode, // Optional coupon code
      isBundlePlan ? whatsappPhone : undefined // Pass WhatsApp for bundle (including test)
    )

    return NextResponse.json(
      {
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Create Checkout] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
