/**
 * API Route: Link All Guest Payments to User Account
 * POST /api/link-guest-payments
 *
 * Links all paid guest payments (PIX and Stripe) to a newly registered/logged-in user account
 * Called automatically after user registration or login
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'

export const maxDuration = 60

/**
 * POST endpoint to link all guest payments to user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      )
    }

    const userEmail = profile.email
    const linkedItems: any[] = []

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['authorized', 'active'])
      .single()

    if (existingSubscription) {
      console.log('[Link Payments] User already has active subscription:', user.id)
      return NextResponse.json({
        linked: false,
        message: 'User already has an active subscription',
      })
    }

    // 1. Find and link PIX payments
    const { data: guestPixPayments } = await supabase
      .from('pix_payments')
      .select('*')
      .is('user_id', null)
      .eq('email', userEmail)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })

    if (guestPixPayments && guestPixPayments.length > 0) {
      console.log('[Link Payments] Found', guestPixPayments.length, 'guest PIX payment(s)')

      const pixPayment = guestPixPayments[0] // Most recent

      // Link payment to user
      await supabase
        .from('pix_payments')
        .update({
          user_id: user.id,
          linked_to_user_at: new Date().toISOString(),
        })
        .eq('id', pixPayment.id)

      // Create subscription
      const planType = pixPayment.plan_type as 'monthly' | 'annual' | 'test'

      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          mp_subscription_id: `pix_${pixPayment.payment_intent_id}`,
          mp_payer_id: null,
          status: 'authorized',
          start_date: pixPayment.paid_at || new Date().toISOString(),
          next_payment_date: planType === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          amount: pixPayment.amount,
          currency: 'BRL',
          payment_method_id: 'pix',
        })
        .select()
        .single()

      if (!insertError && newSubscription) {
        // Activate subscription
        await supabase.rpc('activate_subscription', {
          p_user_id: user.id,
          p_subscription_id: newSubscription.id,
        })

        // Update user profile
        await supabase
          .from('profiles')
          .update({
            is_pro: true,
            plan_type: 'premium',
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        linkedItems.push({
          type: 'pix',
          paymentId: pixPayment.payment_intent_id,
          amount: pixPayment.amount,
          planType: pixPayment.plan_type,
        })

        console.log('[Link Payments] PIX payment linked and subscription activated')
      }
    }

    // 2. Find and link Stripe subscriptions
    const { data: guestStripeSubscriptions } = await supabase
      .from('pending_stripe_subscriptions')
      .select('*')
      .is('linked_to_user_id', null)
      .eq('email', userEmail)
      .in('status', ['authorized', 'active'])
      .order('created_at', { ascending: false })

    if (guestStripeSubscriptions && guestStripeSubscriptions.length > 0 && linkedItems.length === 0) {
      console.log('[Link Payments] Found', guestStripeSubscriptions.length, 'guest Stripe subscription(s)')

      const stripeSubscription = guestStripeSubscriptions[0] // Most recent

      // Create subscription in main table
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          stripe_subscription_id: stripeSubscription.stripe_subscription_id,
          stripe_customer_id: stripeSubscription.stripe_customer_id,
          stripe_price_id: stripeSubscription.stripe_price_id,
          status: stripeSubscription.status as 'pending' | 'authorized' | 'paused' | 'canceled',
          start_date: stripeSubscription.start_date,
          next_payment_date: stripeSubscription.next_payment_date,
          amount: stripeSubscription.amount,
          currency: stripeSubscription.currency,
        })
        .select()
        .single()

      if (!insertError && newSubscription) {
        // Mark as linked in pending table
        await supabase
          .from('pending_stripe_subscriptions')
          .update({
            linked_to_user_id: user.id,
            linked_at: new Date().toISOString(),
          })
          .eq('id', stripeSubscription.id)

        // Also update Stripe customer metadata
        await supabase
          .from('stripe_customers')
          .insert({
            user_id: user.id,
            stripe_customer_id: stripeSubscription.stripe_customer_id,
            email: userEmail,
          })
          .onConflict('stripe_customer_id')
          .merge()

        // Activate subscription
        await supabase.rpc('activate_subscription', {
          p_user_id: user.id,
          p_subscription_id: newSubscription.id,
        })

        // Update user profile
        await supabase
          .from('profiles')
          .update({
            is_pro: true,
            plan_type: 'premium',
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        linkedItems.push({
          type: 'stripe',
          subscriptionId: stripeSubscription.stripe_subscription_id,
          amount: stripeSubscription.amount,
        })

        console.log('[Link Payments] Stripe subscription linked and activated')
      }
    }

    if (linkedItems.length === 0) {
      return NextResponse.json({
        linked: false,
        message: 'No pending payments found for this email',
      })
    }

    return NextResponse.json({
      linked: true,
      message: 'Payment(s) successfully linked to your account',
      items: linkedItems,
    })
  } catch (error) {
    console.error('[Link Payments] Error:', error)
    return NextResponse.json(
      {
        error: 'Error linking payments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check for pending guest payments
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({
        hasPendingPayments: false,
      })
    }

    // Check for PIX payments
    const { data: guestPixPayments } = await supabase
      .from('pix_payments')
      .select('id, amount, plan_type')
      .is('user_id', null)
      .eq('email', profile.email)
      .eq('status', 'paid')

    // Check for Stripe subscriptions
    const { data: guestStripeSubscriptions } = await supabase
      .from('pending_stripe_subscriptions')
      .select('id, amount')
      .is('linked_to_user_id', null)
      .eq('email', profile.email)
      .in('status', ['authorized', 'active'])

    const hasPending =
      (guestPixPayments && guestPixPayments.length > 0) ||
      (guestStripeSubscriptions && guestStripeSubscriptions.length > 0)

    return NextResponse.json({
      hasPendingPayments: hasPending,
      pixPayments: guestPixPayments || [],
      stripeSubscriptions: guestStripeSubscriptions || [],
    })
  } catch (error) {
    console.error('[Link Payments] Error checking pending:', error)
    return NextResponse.json({
      hasPendingPayments: false,
    })
  }
}
