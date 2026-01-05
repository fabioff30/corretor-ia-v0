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
      console.error('[Link Payments] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Link Payments] Starting payment link process for user:', user.id)

    const supabase = createServiceRoleClient()

    // Get user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    let userEmail: string | null = profile?.email || null

    // Fallback: If email not in profile, try to get from auth.users
    if (!userEmail) {
      console.warn('[Link Payments] Email not found in profile, checking auth.users')

      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id)

      if (authError || !authUser?.user?.email) {
        console.error('[Link Payments] Failed to find user email:', {
          profileError,
          authError,
          userId: user.id
        })

        return NextResponse.json(
          {
            error: 'User email not found',
            message: 'Could not retrieve email from profile or auth system. Please contact support.',
            details: {
              profileError: profileError?.message,
              authError: authError?.message
            }
          },
          { status: 404 }
        )
      }

      userEmail = authUser.user.email

      // Update profile with email from auth.users
      console.log('[Link Payments] Updating profile with email from auth.users')
      await supabase
        .from('profiles')
        .update({ email: userEmail })
        .eq('id', user.id)
    }

    console.log('[Link Payments] User email found:', userEmail)

    const linkedItems: any[] = []

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['authorized', 'active'])
      .single()

    if (existingSubscription) {
      console.log('[Link Payments] User already has active subscription:', {
        userId: user.id,
        subscriptionId: existingSubscription.id,
        status: existingSubscription.status
      })
      return NextResponse.json({
        linked: false,
        message: 'User already has an active subscription',
      })
    }

    console.log('[Link Payments] Checking for guest PIX payments for email:', userEmail)

    // 1. Find and link PIX payments
    const { data: guestPixPayments, error: pixError } = await supabase
      .from('pix_payments')
      .select('*')
      .is('user_id', null)
      .eq('email', userEmail)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })

    if (pixError) {
      console.error('[Link Payments] Error fetching PIX payments:', pixError)
    }

    if (guestPixPayments && guestPixPayments.length > 0) {
      console.log('[Link Payments] Found', guestPixPayments.length, 'guest PIX payment(s) for', userEmail)

      const pixPayment = guestPixPayments[0] // Most recent
      console.log('[Link Payments] Processing PIX payment:', {
        paymentId: pixPayment.payment_intent_id,
        amount: pixPayment.amount,
        planType: pixPayment.plan_type
      })

      const planTypeRaw = pixPayment.plan_type
      if (planTypeRaw !== 'monthly' && planTypeRaw !== 'annual') {
        console.error('[Link Payments] Unsupported PIX plan type:', planTypeRaw)
      } else {
        const paidAtIso = pixPayment.paid_at || new Date().toISOString()
        const { startDateIso, expiresAtIso } = calculateSubscriptionWindow(planTypeRaw, paidAtIso)

        const { data: newSubscription, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            mp_subscription_id: `pix_${pixPayment.payment_intent_id}`,
            mp_payer_id: null,
            status: 'authorized',
            start_date: startDateIso,
            next_payment_date: expiresAtIso,
            amount: pixPayment.amount,
            currency: 'BRL',
            payment_method_id: 'pix',
          })
          .select()
          .single()

        if (insertError || !newSubscription) {
          console.error('[Link Payments] Error creating subscription:', insertError)
        } else {
          console.log('[Link Payments] Subscription created, activating...', { subscriptionId: newSubscription.id })

          const { error: activateError } = await supabase.rpc('activate_subscription', {
            p_user_id: user.id,
            p_subscription_id: newSubscription.id,
          })

          if (activateError) {
            console.error('[Link Payments] Error activating subscription:', activateError)
          } else {
            console.log('[Link Payments] Subscription activated successfully')
          }

          const { error: profileUpdateError } = await supabase
            .from('profiles')
          .update({
            plan_type: 'pro',
            subscription_status: 'active',
            subscription_expires_at: expiresAtIso,
            updated_at: new Date().toISOString(),
          })
            .eq('id', user.id)

          if (profileUpdateError) {
            console.error('[Link Payments] Error updating profile:', profileUpdateError)
          } else {
            console.log('[Link Payments] Profile updated to premium')
          }

          const { error: linkError } = await supabase
            .from('pix_payments')
            .update({
              user_id: user.id,
              linked_to_user_at: new Date().toISOString(),
            })
            .eq('id', pixPayment.id)

          if (linkError) {
            console.error('[Link Payments] Error linking PIX payment to user:', linkError)
          }

          linkedItems.push({
            type: 'pix',
            paymentId: pixPayment.payment_intent_id,
            amount: pixPayment.amount,
            planType: planTypeRaw,
            expiresAt: expiresAtIso,
          })

          console.log('[Link Payments] PIX payment linked and subscription activated', {
            userId: user.id,
            subscriptionId: newSubscription.id,
            plan: pixPayment.plan_type,
            expiresAt: expiresAtIso,
          })
        }
      }
    } else {
      console.log('[Link Payments] No guest PIX payments found for', userEmail)
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
          .upsert({
            user_id: user.id,
            stripe_customer_id: stripeSubscription.stripe_customer_id,
            email: userEmail,
          }, {
            onConflict: 'stripe_customer_id'
          })

        // Activate subscription
        await supabase.rpc('activate_subscription', {
          p_user_id: user.id,
          p_subscription_id: newSubscription.id,
        })

        // Update user profile
        await supabase
          .from('profiles')
          .update({
            plan_type: 'pro',
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
      console.log('[Link Payments] No pending payments found for user:', user.id)
      return NextResponse.json({
        linked: false,
        message: 'No pending payments found for this email',
      })
    }

    console.log('[Link Payments] Successfully linked', linkedItems.length, 'payment(s) to user:', user.id)

    return NextResponse.json({
      linked: true,
      message: 'Payment(s) successfully linked to your account',
      items: linkedItems,
    })
  } catch (error) {
    console.error('[Link Payments] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
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

function calculateSubscriptionWindow(planType: 'monthly' | 'annual', paidAtIso: string) {
  const paidAt = new Date(paidAtIso)
  const baseTime = Number.isNaN(paidAt.getTime()) ? Date.now() : paidAt.getTime()
  const startDate = new Date(baseTime)
  const expiresAt = new Date(baseTime)

  if (planType === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  }

  return {
    startDateIso: startDate.toISOString(),
    expiresAtIso: expiresAt.toISOString(),
  }
}
