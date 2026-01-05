/**
 * API Route: Verify PIX Activation Status
 * GET /api/verify-pix-activation?paymentId=xxx
 *
 * Verifies both Mercado Pago payment approval AND database profile activation
 * This endpoint solves the race condition between webhook processing and client polling
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'
import type { Profile } from '@/types/supabase'

export const maxDuration = 30

interface VerificationResponse {
  paymentApproved: boolean
  profileActivated: boolean
  ready: boolean // Both payment approved AND profile activated
  profile: Profile | null
  subscriptionCreated: boolean
  debug?: {
    paymentStatus?: string
    profilePlanType?: string
    profileSubscriptionStatus?: string
    timestamp: string
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const url = new URL(request.url)
    const paymentId = url.searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    console.log(`[PIX Activation] Verification started for payment: ${paymentId}`)

    // Get authenticated user
    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      console.log('[PIX Activation] No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize clients
    const mpClient = getMercadoPagoClient()
    const supabase = createServiceRoleClient()

    if (!supabase) {
      console.error('[PIX Activation] Service role client not available')
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    // Step 1: Check payment status in Mercado Pago
    console.log('[PIX Activation] Checking MP payment status...')
    const mpPayment = await mpClient.getPixPaymentStatus(paymentId)
    const paymentApproved = mpPayment.status === 'approved'

    console.log(`[PIX Activation] MP payment status: ${mpPayment.status}, approved: ${paymentApproved}`)

    // Step 2: Get PIX payment record from database
    const { data: pixPayment } = await supabase
      .from('pix_payments')
      .select('user_id, status, paid_at')
      .eq('payment_intent_id', paymentId)
      .maybeSingle()

    if (!pixPayment) {
      console.warn(`[PIX Activation] PIX payment record not found: ${paymentId}`)
      return NextResponse.json<VerificationResponse>({
        paymentApproved,
        profileActivated: false,
        ready: false,
        profile: null,
        subscriptionCreated: false,
        debug: {
          paymentStatus: mpPayment.status,
          timestamp: new Date().toISOString(),
        }
      })
    }

    // Verify payment belongs to the authenticated user
    if (pixPayment.user_id !== user.id) {
      console.error(`[PIX Activation] Payment ${paymentId} does not belong to user ${user.id}`)
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Step 3: Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      console.error(`[PIX Activation] Profile not found for user: ${user.id}`)
      return NextResponse.json<VerificationResponse>({
        paymentApproved,
        profileActivated: false,
        ready: false,
        profile: null,
        subscriptionCreated: false,
        debug: {
          paymentStatus: mpPayment.status,
          timestamp: new Date().toISOString(),
        }
      })
    }

    // Step 4: Check if profile is activated (plan_type: 'pro' and subscription_status: 'active')
    const profileActivated = profile.plan_type === 'pro' && profile.subscription_status === 'active'

    console.log(`[PIX Activation] Profile status - plan: ${profile.plan_type}, subscription: ${profile.subscription_status}, activated: ${profileActivated}`)

    // Step 5: Check if subscription was created
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['authorized', 'active'])
      .maybeSingle()

    const subscriptionCreated = !!subscription

    console.log(`[PIX Activation] Subscription created: ${subscriptionCreated}, status: ${subscription?.status || 'none'}`)

    // Ready when payment approved AND profile activated
    // Note: subscription creation can happen async (Julinho integration, etc.)
    // so we don't require subscriptionCreated for ready state
    const ready = paymentApproved && profileActivated

    const duration = Date.now() - startTime

    console.log(`[PIX Activation] Verification complete in ${duration}ms - Payment: ${paymentApproved}, Profile: ${profileActivated}, Subscription: ${subscriptionCreated}, Ready: ${ready}`)

    const response: VerificationResponse = {
      paymentApproved,
      profileActivated,
      ready,
      profile: profileActivated ? profile : null,
      subscriptionCreated,
      debug: {
        paymentStatus: mpPayment.status,
        profilePlanType: profile?.plan_type || 'none',
        profileSubscriptionStatus: profile?.subscription_status || 'none',
        timestamp: new Date().toISOString(),
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[PIX Activation] Error after ${duration}ms:`, error)

    return NextResponse.json(
      {
        error: 'Error verifying PIX activation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
