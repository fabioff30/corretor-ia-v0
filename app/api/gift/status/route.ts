// @ts-nocheck
/**
 * API Route: Check Gift Payment Status
 * GET /api/gift/status?id={giftId}
 *
 * Checks the payment and email status of a gift purchase
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { GiftStatusResponse } from '@/lib/gift/types'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const giftId = url.searchParams.get('id')

    if (!giftId) {
      return NextResponse.json(
        { error: 'ID do presente e obrigatorio' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Get gift purchase
    const { data: gift, error } = await supabase
      .from('gift_purchases')
      .select('status, payment_id, payment_method, email_sent_at')
      .eq('id', giftId)
      .single()

    if (error || !gift) {
      return NextResponse.json(
        { error: 'Presente nao encontrado' },
        { status: 404 }
      )
    }

    // If payment is pending and we have a payment ID, check with Mercado Pago
    if (gift.status === 'pending_payment' && gift.payment_id && gift.payment_method === 'pix') {
      try {
        const mpClient = getMercadoPagoClient()
        const mpStatus = await mpClient.getPixPaymentStatus(gift.payment_id)

        if (mpStatus.status === 'approved') {
          // Payment was approved but webhook hasn't processed yet
          // We'll return the current status and let the webhook handle the update
          console.log('[Gift Status] PIX payment approved, waiting for webhook:', gift.payment_id)
        }
      } catch (mpError) {
        console.error('[Gift Status] Error checking MP payment:', mpError)
        // Continue with database status
      }
    }

    const response: GiftStatusResponse = {
      status: gift.status,
      payment_confirmed: ['paid', 'email_sent', 'redeemed'].includes(gift.status),
      email_sent: !!gift.email_sent_at,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Gift Status] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}
// @ts-nocheck
