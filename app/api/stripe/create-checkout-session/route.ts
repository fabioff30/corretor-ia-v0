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
  userId: string
  userEmail: string
  planType: 'monthly' | 'annual'
  returnUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await request.json()
    const { userId, userEmail, planType, returnUrl } = body

    // Validate input
    if (!userId || !userEmail || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userEmail, planType' },
        { status: 400 }
      )
    }

    // Get price ID based on plan type
    const priceId = planType === 'monthly' ? STRIPE_PRICES.MONTHLY : STRIPE_PRICES.ANNUAL

    // Determine URLs - use request origin for correct environment
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || getPublicConfig().APP_URL
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin // Remove trailing slash
    const successUrl = returnUrl || `${baseUrl}/dashboard/subscription?success=true`
    const cancelUrl = `${baseUrl}/premium?canceled=true`

    // Create checkout session
    const session = await createCheckoutSession(
      userId,
      userEmail,
      priceId,
      successUrl,
      cancelUrl
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
