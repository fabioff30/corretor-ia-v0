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
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY

    return NextResponse.json({
      publishableKey: publishableKey || null,
      isTest: publishableKey?.startsWith('pk_test_') || false,
      hasSecretKey: !!config.STRIPE_SECRET_KEY,
      configured: !!(publishableKey && config.STRIPE_SECRET_KEY),
    })
  } catch (error) {
    console.error('[Stripe Config] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get Stripe configuration' },
      { status: 500 }
    )
  }
}
