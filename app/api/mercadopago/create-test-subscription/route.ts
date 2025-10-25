/**
 * API Route: Create Test Mercado Pago Subscription (R$ 1.00)
 * POST /api/mercadopago/create-test-subscription
 *
 * ⚠️ USE ONLY FOR TESTING - Creates a R$ 1.00 subscription in PRODUCTION
 * This will charge a real credit card!
 */

import { NextRequest, NextResponse } from 'next/server'
import { createTestSubscription } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getPublicConfig } from '@/utils/env-config'

export const maxDuration = 60

interface CreateTestSubscriptionRequest {
  userId: string
  userEmail: string
  returnUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreateTestSubscriptionRequest = await request.json()
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
    const { data: existingSubscriptions } = await supabase
      .from('subscriptions')
      .select('id, status, mp_subscription_id, created_at')
      .eq('user_id', userId)
      .in('status', ['pending', 'authorized'])
      .order('created_at', { ascending: false })

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const latestSubscription = existingSubscriptions[0]

      // If subscription is pending and older than 30 minutes, allow creating new one
      const subscriptionAge = Date.now() - new Date(latestSubscription.created_at).getTime()
      const thirtyMinutes = 30 * 60 * 1000

      if (latestSubscription.status === 'pending' && subscriptionAge > thirtyMinutes) {
        // Cancel old pending subscription
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('id', latestSubscription.id)

        console.log(`Cancelled old pending subscription: ${latestSubscription.id}`)
      } else {
        // Has active or recent pending subscription
        return NextResponse.json(
          {
            error: 'User already has an active subscription',
            subscriptionId: latestSubscription.mp_subscription_id,
            status: latestSubscription.status,
            message: latestSubscription.status === 'pending'
              ? 'You have a pending subscription. Please wait 30 minutes or contact support to reset.'
              : 'You already have an active subscription',
          },
          { status: 409 }
        )
      }
    }

    // Determine return URL
    const backUrl =
      returnUrl ||
      `${getPublicConfig().APP_URL}/debug?test=success`

    // Create TEST subscription in Mercado Pago (R$ 1.00)
    const mpSubscription = await createTestSubscription(
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
        mp_plan_id: null,
        mp_payer_id: mpSubscription.payer_id?.toString() || null,
        status: mpSubscription.status as 'pending' | 'authorized' | 'paused' | 'canceled',
        payment_method_id: null,
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
        amount: 1.00,
        warning: '⚠️ This is a REAL subscription for R$ 1.00. You will be charged!',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating test subscription:', error)

    return NextResponse.json(
      {
        error: 'Failed to create test subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
