/**
 * API Route: Create Mercado Pago Subscription
 * POST /api/mercadopago/create-subscription
 *
 * Creates a new subscription in Mercado Pago and saves it to Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { createProSubscription } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getPublicConfig } from '@/utils/env-config'

export const maxDuration = 60

interface CreateSubscriptionRequest {
  userId: string
  userEmail: string
  returnUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreateSubscriptionRequest = await request.json()
    const { userId, userEmail, returnUrl } = body

    // Validate input
    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userEmail' },
        { status: 400 }
      )
    }

    // Initialize Supabase client (service role for admin operations)
    const supabase = createServiceRoleClient()

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, plan_type, subscription_status')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status, mp_subscription_id')
      .eq('user_id', userId)
      .in('status', ['pending', 'authorized'])
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: 'User already has an active subscription',
          subscriptionId: existingSubscription.mp_subscription_id,
        },
        { status: 409 }
      )
    }

    // Determine return URL
    const backUrl =
      returnUrl ||
      `${getPublicConfig().APP_URL}/dashboard/subscription?payment=success`

    // Create subscription in Mercado Pago
    const mpSubscription = await createProSubscription(
      userId,
      userEmail,
      backUrl
    )

    // Save subscription to Supabase
    const { data: subscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        mp_subscription_id: mpSubscription.id,
        mp_plan_id: null, // We're using auto_recurring, not a pre-created plan
        mp_payer_id: mpSubscription.payer_id?.toString() || null,
        status: mpSubscription.status as 'pending' | 'authorized' | 'paused' | 'canceled',
        payment_method_id: null, // Will be updated after first payment
        start_date: mpSubscription.date_created,
        next_payment_date: mpSubscription.auto_recurring.start_date || null,
        amount: mpSubscription.auto_recurring.transaction_amount,
        currency: mpSubscription.auto_recurring.currency_id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving subscription to Supabase:', insertError)
      return NextResponse.json(
        { error: 'Failed to save subscription', details: insertError.message },
        { status: 500 }
      )
    }

    // Return checkout URL
    return NextResponse.json(
      {
        success: true,
        subscriptionId: subscription.id,
        mpSubscriptionId: mpSubscription.id,
        checkoutUrl: mpSubscription.init_point,
        sandboxCheckoutUrl: mpSubscription.sandbox_init_point,
        status: mpSubscription.status,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating subscription:', error)

    return NextResponse.json(
      {
        error: 'Failed to create subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET method to check subscription creation status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get user's active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'authorized'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !subscription) {
      return NextResponse.json(
        { hasActiveSubscription: false },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        hasActiveSubscription: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          mpSubscriptionId: subscription.mp_subscription_id,
          amount: subscription.amount,
          currency: subscription.currency,
          nextPaymentDate: subscription.next_payment_date,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking subscription:', error)

    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}
