// @ts-nocheck
/**
 * Link Pending Payment
 *
 * Handles linking approved PIX payments to user accounts.
 * This is used when a guest pays first and creates account later.
 *
 * Flow:
 * 1. Find approved payments for the user's email
 * 2. Create subscription in database
 * 3. Activate user profile (PRO plan)
 * 4. Mark payment as consumed
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface LinkPaymentResult {
  success: boolean
  error?: string
  subscriptionId?: string
  planType?: 'monthly' | 'annual'
  expiresAt?: string
  alreadyActive?: boolean
  paymentId?: string
}

interface PixPayment {
  id: string
  payment_intent_id: string
  email: string
  plan_type: 'monthly' | 'annual'
  amount: number
  paid_at: string | null
  status: string
  user_id: string | null
}

/**
 * Link approved PIX payment to user account
 */
export async function linkPendingPayment(
  userId: string,
  userEmail: string
): Promise<LinkPaymentResult> {
  const supabase = createServiceRoleClient()

  if (!supabase) {
    return {
      success: false,
      error: 'Service role client not available',
    }
  }

  try {
    console.log('[Link Payment] Starting for user:', userId, 'email:', userEmail)

    // 1. Check if user already has active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['authorized', 'active'])
      .maybeSingle()

    if (existingSubscription) {
      console.log('[Link Payment] User already has active subscription:', existingSubscription.id)
      return {
        success: true,
        alreadyActive: true,
      }
    }

    // 2. Find approved payments for this email
    const { data: approvedPayments, error: fetchError } = await supabase
      .from('pix_payments')
      .select('*')
      .eq('email', userEmail)
      .eq('status', 'approved')
      .is('user_id', null) // Only unlinked payments
      .order('created_at', { ascending: false })
      .limit(1) // Take most recent

    if (fetchError) {
      console.error('[Link Payment] Error fetching payments:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch approved payments',
      }
    }

    if (!approvedPayments || approvedPayments.length === 0) {
      console.log('[Link Payment] No approved payments found for email:', userEmail)
      return {
        success: false,
        error: 'No approved payments found for this email',
      }
    }

    const payment = approvedPayments[0] as PixPayment
    console.log('[Link Payment] Found approved payment:', payment.id, 'amount:', payment.amount)

    // 3. Calculate subscription window
    const planType = payment.plan_type
    const paidAtIso = payment.paid_at || new Date().toISOString()
    const { startDateIso, expiresAtIso } = calculateSubscriptionWindow(planType, paidAtIso)

    // 4. Create subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        mp_subscription_id: `pix_${payment.payment_intent_id}`,
        mp_payer_id: null, // Guest payments don't have payer_id initially
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
      console.error('[Link Payment] Error creating subscription:', insertError)
      return {
        success: false,
        error: 'Failed to create subscription',
      }
    }

    console.log('[Link Payment] Subscription created:', newSubscription.id)

    // 5. Activate subscription via RPC
    const { error: activateError } = await supabase.rpc('activate_subscription', {
      p_user_id: userId,
      p_subscription_id: newSubscription.id,
    })

    if (activateError) {
      console.error('[Link Payment] Error activating subscription via RPC:', activateError)
      // Continue anyway - we'll update profile directly
    } else {
      console.log('[Link Payment] Subscription activated via RPC')
    }

    // 6. Update profile
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        plan_type: 'pro',
        subscription_status: 'active',
        subscription_expires_at: expiresAtIso,
        is_pro: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileUpdateError) {
      console.error('[Link Payment] Error updating profile:', profileUpdateError)
      return {
        success: false,
        error: 'Failed to update user profile',
      }
    }

    console.log('[Link Payment] Profile updated to PRO')

    // 7. Mark payment as consumed and link to user
    const { error: updatePaymentError } = await supabase
      .from('pix_payments')
      .update({
        status: 'consumed',
        user_id: userId,
        linked_to_user_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    if (updatePaymentError) {
      console.error('[Link Payment] Error marking payment as consumed:', updatePaymentError)
      // This is not critical - subscription is already created
    } else {
      console.log('[Link Payment] Payment marked as consumed')
    }

    console.log('[Link Payment] ✅ Successfully linked payment and activated PRO plan')

    return {
      success: true,
      subscriptionId: newSubscription.id,
      planType,
      expiresAt: expiresAtIso,
      paymentId: payment.payment_intent_id,
    }
  } catch (error) {
    console.error('[Link Payment] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Calculate subscription start and expiration dates
 */
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
// @ts-nocheck
