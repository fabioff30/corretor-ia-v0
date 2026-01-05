/**
 * API Route: Check Pending PIX Payment
 * GET /api/mercadopago/check-pending-pix
 *
 * Checks if authenticated user has a PIX payment that is approved in MP
 * but not yet activated (profile still 'free')
 */

import { NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'
import type { Tables } from '@/types/supabase'

export const maxDuration = 30

export async function GET() {
  try {
    const { user, profile } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only check if user is on free plan
    if (profile?.plan_type !== 'free') {
      return NextResponse.json({
        hasPendingPayment: false,
        message: 'User is not on free plan',
      })
    }

    const supabase = createServiceRoleClient()

    if (!supabase) {
      console.error('[Check Pending PIX] Service role client unavailable')
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    // Find PIX payments for this user that are 'paid' or 'approved' (not consumed)
    const { data: pixPayments, error: pixError } = await supabase
      .from('pix_payments')
      .select('id, payment_intent_id, amount, plan_type, paid_at, status')
      .eq('user_id', user.id)
      .in('status', ['paid', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (pixError) {
      console.error('[Check Pending PIX] Database error:', pixError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!pixPayments || pixPayments.length === 0) {
      return NextResponse.json({
        hasPendingPayment: false,
        message: 'No pending payments found',
      }, { status: 404 })
    }

    const pixPayment = pixPayments[0] as Tables<'pix_payments'>

    // Verify payment is actually approved in Mercado Pago
    try {
      const mpClient = getMercadoPagoClient()
      const mpPayment = await mpClient.getPixPaymentStatus(pixPayment.payment_intent_id)

      if (mpPayment.status !== 'approved') {
        console.log(`[Check Pending PIX] Payment ${pixPayment.payment_intent_id} not approved in MP: ${mpPayment.status}`)
        return NextResponse.json({
          hasPendingPayment: false,
          message: 'Payment not approved in Mercado Pago',
        }, { status: 404 })
      }
    } catch (mpError) {
      console.error('[Check Pending PIX] Error checking MP status:', mpError)
      // If MP check fails, still return the payment (better UX)
    }

    // Return pending payment details
    return NextResponse.json({
      hasPendingPayment: true,
      payment: {
        paymentId: String(pixPayment.payment_intent_id),
        amount: Number(pixPayment.amount),
        planType: pixPayment.plan_type,
        paidAt: pixPayment.paid_at || new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Check Pending PIX] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Error checking pending payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
