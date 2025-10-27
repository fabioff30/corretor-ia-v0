/**
 * API Route: Link Guest PIX Payment to User Account
 * POST /api/mercadopago/link-guest-payment
 *
 * Links a paid guest PIX payment to a newly registered/logged-in user account
 * Called automatically after user registration or login
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'

export const maxDuration = 60

/**
 * POST endpoint to link guest payment to user
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

    // Find paid guest payments with this email
    const { data: guestPayments, error: fetchError } = await supabase
      .from('pix_payments')
      .select('*')
      .is('user_id', null)
      .eq('email', userEmail)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })

    if (fetchError) {
      console.error('[Link Guest Payment] Error fetching guest payments:', fetchError)
      return NextResponse.json(
        { error: 'Error fetching guest payments' },
        { status: 500 }
      )
    }

    if (!guestPayments || guestPayments.length === 0) {
      return NextResponse.json({
        linked: false,
        message: 'No pending guest payments found for this email',
      })
    }

    console.log('[Link Guest Payment] Found', guestPayments.length, 'guest payment(s) for', userEmail)

    // Link each payment to the user
    const linkedPayments = []

    for (const payment of guestPayments) {
      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .in('status', ['authorized', 'active'])
        .single()

      if (existingSubscription) {
        console.log('[Link Guest Payment] User already has active subscription, skipping payment:', payment.id)
        continue
      }

      const planTypeRaw = payment.plan_type
      if (planTypeRaw !== 'monthly' && planTypeRaw !== 'annual') {
        console.error('[Link Guest Payment] Unsupported plan type:', planTypeRaw)
        continue
      }

      const paidAtIso = payment.paid_at || new Date().toISOString()
      const { startDateIso, expiresAtIso } = calculateSubscriptionWindow(planTypeRaw, paidAtIso)

      // Create subscription for the user
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          mp_subscription_id: `pix_${payment.payment_intent_id}`,
          mp_payer_id: null, // Guest payments don't have payer_id yet
          status: 'authorized',
          start_date: startDateIso,
          next_payment_date: expiresAtIso,
          amount: payment.amount,
          currency: 'BRL',
          payment_method_id: 'pix',
        })
        .select()
        .single()

      if (insertError) {
        console.error('[Link Guest Payment] Error creating subscription:', insertError)
        continue
      }

      // Activate subscription
      const { error: activateError } = await supabase.rpc('activate_subscription', {
        p_user_id: user.id,
        p_subscription_id: newSubscription.id,
      })

      if (activateError) {
        console.error('[Link Guest Payment] Error activating subscription:', activateError)
        continue
      }

      // Update user profile to pro
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          plan_type: 'pro',
          subscription_status: 'active',
          is_pro: true,
          subscription_expires_at: expiresAtIso,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileUpdateError) {
        console.error('[Link Guest Payment] Error updating profile:', profileUpdateError)
      }

      const { error: linkError } = await supabase
        .from('pix_payments')
        .update({
          user_id: user.id,
          linked_to_user_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      if (linkError) {
        console.error('[Link Guest Payment] Error linking payment to user:', linkError)
      }

      linkedPayments.push({
        paymentId: payment.payment_intent_id,
        amount: payment.amount,
        planType: planTypeRaw,
        paidAt: payment.paid_at,
        expiresAt: expiresAtIso,
      })

      console.log('[Link Guest Payment] Successfully linked payment and activated subscription:', {
        userId: user.id,
        paymentId: payment.payment_intent_id,
        planType: payment.plan_type,
      })

      // Only link the most recent payment
      break
    }

    if (linkedPayments.length === 0) {
      return NextResponse.json({
        linked: false,
        message: 'No payments could be linked (user may already have subscription)',
      })
    }

    return NextResponse.json({
      linked: true,
      message: 'Guest payment(s) successfully linked to your account',
      payments: linkedPayments,
    })
  } catch (error) {
    console.error('[Link Guest Payment] Error:', error)
    return NextResponse.json(
      {
        error: 'Error linking guest payment',
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
      return NextResponse.json({
        hasPendingPayments: false,
      })
    }

    // Check for paid guest payments with this email
    const { data: guestPayments, error: fetchError } = await supabase
      .from('pix_payments')
      .select('id, amount, plan_type, paid_at')
      .is('user_id', null)
      .eq('email', profile.email)
      .eq('status', 'paid')

    if (fetchError) {
      console.error('[Link Guest Payment] Error checking pending payments:', fetchError)
      return NextResponse.json({
        hasPendingPayments: false,
      })
    }

    return NextResponse.json({
      hasPendingPayments: guestPayments && guestPayments.length > 0,
      count: guestPayments?.length || 0,
      payments: guestPayments || [],
    })
  } catch (error) {
    console.error('[Link Guest Payment] Error checking pending payments:', error)
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
