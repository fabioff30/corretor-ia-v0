/**
 * API Route: Create Stripe Checkout Session
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe/server'
import { getPublicConfig } from '@/utils/env-config'

export const maxDuration = 60

interface CreateCheckoutRequest {
  userId?: string // Optional for guest checkouts
  userEmail?: string // Optional for authenticated users
  guestEmail?: string // Required for guest checkouts
  planType: 'monthly' | 'annual' | 'bundle_monthly'
  returnUrl?: string
  couponCode?: string // Optional coupon code for discounts
  whatsappPhone?: string // Required for bundle purchases (for Julinho activation)
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await request.json()
    const { userId, userEmail, guestEmail, planType, returnUrl, couponCode, whatsappPhone } = body

    // Determine if this is a guest checkout
    const isGuestCheckout = !userId

    // Validate: must have userId OR guestEmail
    if (!userId && !guestEmail) {
      return NextResponse.json(
        { error: 'Either userId or guestEmail is required' },
        { status: 400 }
      )
    }

    // Validate plan type
    if (!planType || !['monthly', 'annual', 'bundle_monthly'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "monthly", "annual", or "bundle_monthly"' },
        { status: 400 }
      )
    }

    // Bundle requires WhatsApp phone for Julinho activation
    if (planType === 'bundle_monthly' && !whatsappPhone) {
      return NextResponse.json(
        { error: 'WhatsApp phone is required for bundle purchases' },
        { status: 400 }
      )
    }

    // Validate email format for guest checkouts
    if (isGuestCheckout && guestEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(guestEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Determine final email
    const finalEmail = isGuestCheckout ? guestEmail! : (userEmail || '')

    console.log('[Stripe Checkout]', isGuestCheckout ? 'Guest' : 'Authenticated', 'checkout for:', finalEmail, 'plan:', planType)

    // Get price ID based on plan type
    let priceId: string
    switch (planType) {
      case 'monthly':
        priceId = STRIPE_PRICES.MONTHLY
        break
      case 'annual':
        priceId = STRIPE_PRICES.ANNUAL
        break
      case 'bundle_monthly':
        priceId = STRIPE_PRICES.BUNDLE_MONTHLY
        break
      default:
        priceId = STRIPE_PRICES.MONTHLY
    }

    // Determine URLs - use request origin for correct environment
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || getPublicConfig().APP_URL
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin // Remove trailing slash

    // For guest checkouts, redirect to login/register page after success
    // For bundle, redirect back to the offer page with success message
    let successUrl: string
    if (planType === 'bundle_monthly') {
      successUrl = isGuestCheckout
        ? `${baseUrl}/login?payment_success=true&bundle=true&email=${encodeURIComponent(finalEmail)}`
        : `${baseUrl}/oferta-fim-de-ano?success=true`
    } else {
      successUrl = isGuestCheckout
        ? `${baseUrl}/login?payment_success=true&email=${encodeURIComponent(finalEmail)}`
        : (returnUrl || `${baseUrl}/dashboard/subscription?success=true`)
    }

    const cancelUrl = planType === 'bundle_monthly'
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
      planType === 'bundle_monthly' ? whatsappPhone : undefined // Pass WhatsApp for bundle
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
