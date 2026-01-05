/**
 * Debug Endpoint: Check Mercado Pago Payment
 * GET /api/debug/check-mp-payment?paymentId=XXX
 *
 * Checks the status of a payment directly from Mercado Pago API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const paymentId = url.searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId parameter is required' },
        { status: 400 }
      )
    }

    console.log('[Debug MP] Checking payment:', paymentId)

    const mpClient = getMercadoPagoClient()

    try {
      const payment = await mpClient.getPayment(paymentId)

      console.log('[Debug MP] Payment found:', {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        payment_method_id: payment.payment_method_id,
        transaction_amount: payment.transaction_amount,
        date_created: payment.date_created,
        date_approved: payment.date_approved,
        date_last_updated: (payment as any).date_last_updated,
      })

      return NextResponse.json({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          payment_method_id: payment.payment_method_id,
          transaction_amount: payment.transaction_amount,
          currency_id: payment.currency_id,
          payer: payment.payer,
          date_created: payment.date_created,
          date_approved: payment.date_approved,
          date_last_updated: (payment as any).date_last_updated,
          external_reference: payment.external_reference,
        },
      })
    } catch (mpError) {
      console.error('[Debug MP] Error fetching payment from MP:', mpError)

      return NextResponse.json({
        success: false,
        error: 'Payment not found or error fetching from Mercado Pago',
        details: mpError instanceof Error ? mpError.message : 'Unknown error',
        paymentId,
      }, { status: 404 })
    }
  } catch (error) {
    console.error('[Debug MP] Unexpected error:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
