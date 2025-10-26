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
  planType: 'monthly' | 'annual'
  returnUrl?: string
  couponCode?: string // Optional coupon code for discounts
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await request.json()
    const { userId, userEmail, guestEmail, planType, returnUrl, couponCode } = body

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
    if (!planType || !['monthly', 'annual'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "monthly" or "annual"' },
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

    console.log('[Stripe Checkout]', isGuestCheckout ? 'Guest' : 'Authenticated', 'checkout for:', finalEmail)

    // Get price ID based on plan type
    const priceId = planType === 'monthly' ? STRIPE_PRICES.MONTHLY : STRIPE_PRICES.ANNUAL

    // Determine URLs - use request origin for correct environment
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || getPublicConfig().APP_URL
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin // Remove trailing slash

    // For guest checkouts, redirect to login/register page after success
    const successUrl = isGuestCheckout
      ? `${baseUrl}/login?payment_success=true&email=${encodeURIComponent(finalEmail)}`
      : (returnUrl || `${baseUrl}/dashboard/subscription?success=true`)

    const cancelUrl = `${baseUrl}/premium?canceled=true`

    // Create checkout session
    const session = await createCheckoutSession(
      userId || null, // null for guest checkouts
      finalEmail,
      priceId,
      successUrl,
      cancelUrl,
      isGuestCheckout, // Pass flag to mark as guest in metadata
      couponCode // Optional coupon code
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
