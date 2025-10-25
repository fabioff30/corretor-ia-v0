/**
 * API Route: Stripe Configuration
 * GET /api/stripe/config
 *
 * Returns Stripe publishable key for client-side SDK
 */

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/utils/env-config'

export async function GET() {
  try {
    const config = getServerConfig()

    return NextResponse.json({
      publishableKey: config.STRIPE_PUBLISHABLE_KEY || null,
      isTest: config.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') || false,
      hasSecretKey: !!config.STRIPE_SECRET_KEY,
      configured: !!(config.STRIPE_PUBLISHABLE_KEY && config.STRIPE_SECRET_KEY),
    })
  } catch (error) {
    console.error('[Stripe Config] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get Stripe configuration' },
      { status: 500 }
    )
  }
}
