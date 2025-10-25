/**
 * API Route: Create Stripe Customer Portal Session
 * POST /api/stripe/create-portal-session
 *
 * Creates a Stripe Customer Portal session for subscription management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/stripe/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getPublicConfig } from '@/utils/env-config'

export const maxDuration = 60

interface CreatePortalRequest {
  userId: string
  returnUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePortalRequest = await request.json()
    const { userId, returnUrl } = body

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Get customer ID from database
    const supabase = createServiceRoleClient()
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (customerError || !customer?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Customer not found. Please create a subscription first.' },
        { status: 404 }
      )
    }

    // Determine return URL
    const baseUrl = getPublicConfig().APP_URL
    const finalReturnUrl = returnUrl || `${baseUrl}/dashboard/subscription`

    // Create portal session
    const session = await createPortalSession(
      customer.stripe_customer_id,
      finalReturnUrl
    )

    return NextResponse.json(
      {
        success: true,
        portalUrl: session.url,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Create Portal] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
