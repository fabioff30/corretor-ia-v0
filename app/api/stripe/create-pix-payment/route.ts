/**
 * API Route: Create Stripe PIX Payment
 * POST /api/stripe/create-pix-payment
 *
 * Creates a Stripe Payment Intent with PIX payment method
 */

import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, getOrCreateStripeCustomer, STRIPE_PRICES } from '@/lib/stripe/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isVoltaFeriasActive, VOLTA_FERIAS_CONFIG } from '@/utils/constants'

export const maxDuration = 60

interface CreatePixPaymentRequest {
  userId: string
  userEmail: string
  planType: 'monthly' | 'annual'
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePixPaymentRequest = await request.json()
    const { userId, userEmail, planType } = body

    // Validate input
    if (!userId || !userEmail || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userEmail, planType' },
        { status: 400 }
      )
    }

    // Get or create customer
    const customerId = await getOrCreateStripeCustomer(userId, userEmail)

    // Check if Volta às Férias promotion is active
    const isPromoActive = isVoltaFeriasActive()

    // Calculate amount based on plan type (with promotion prices when active)
    let amount: number
    let description: string

    if (planType === 'monthly') {
      amount = isPromoActive
        ? Math.round(VOLTA_FERIAS_CONFIG.MONTHLY_PRICE * 100) // R$ 19.90 = 1990 cents
        : 2990 // R$ 29.90
      description = isPromoActive
        ? 'CorretorIA Premium - Plano Mensal (Promoção Volta às Férias)'
        : 'CorretorIA Premium - Plano Mensal'
    } else {
      amount = isPromoActive
        ? Math.round(VOLTA_FERIAS_CONFIG.ANNUAL_PRICE * 100) // R$ 99.00 = 9900 cents
        : 23880 // R$ 238.80
      description = isPromoActive
        ? 'CorretorIA Premium - Plano Anual (Promoção Volta às Férias)'
        : 'CorretorIA Premium - Plano Anual'
    }

    if (isPromoActive) {
      console.log('[Stripe PIX] PROMO ACTIVE: Using Volta às Férias pricing -', planType, ':', amount / 100)
    }

    // Create Payment Intent with PIX
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      amount,
      currency: 'brl',
      payment_method_types: ['pix'],
      description,
      metadata: {
        userId,
        userEmail,
        planType,
        productType: 'subscription',
      },
      payment_method_options: {
        pix: {
          expires_after_seconds: 1800, // 30 minutes
        },
      },
    })

    // Get the PIX payment method details
    const pixDetails = await getPixDetails(paymentIntent.id)

    // Save payment intent to database for tracking
    const supabase = createServiceRoleClient()
    const { error: insertError } = await supabase.from('pix_payments').insert({
      user_id: userId,
      payment_intent_id: paymentIntent.id,
      amount: amount / 100, // Convert to reais
      plan_type: planType,
      qr_code: pixDetails?.qrCode || null,
      pix_code: pixDetails?.pixCode || null,
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    })

    if (insertError) {
      console.error('[Create PIX Payment] Failed to persist payment intent:', insertError)
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id)
      } catch (cancelError) {
        console.error('[Create PIX Payment] Failed to cancel orphaned payment intent:', cancelError)
      }

      return NextResponse.json(
        {
          error: 'Erro ao registrar pagamento PIX',
          message: 'Não foi possível salvar o PIX no banco. Tente novamente.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amount / 100,
        planType,
        pixDetails: {
          qrCode: pixDetails?.qrCode,
          pixCode: pixDetails?.pixCode,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Create PIX Payment] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to create PIX payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get PIX payment details from a payment intent
 */
async function getPixDetails(paymentIntentId: string) {
  try {
    // Retrieve the payment intent with expanded payment method
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      {
        expand: ['payment_method'],
      }
    )

    // Get the next action which contains PIX details
    const nextAction = paymentIntent.next_action as (Stripe.PaymentIntent.NextAction & {
      display_pix_qr_code?: { qr_code: string; text: string }
    }) | null

    if (nextAction?.type === 'display_pix_qr_code' && nextAction.display_pix_qr_code) {
      const pixData = nextAction.display_pix_qr_code
      return {
        qrCode: pixData.qr_code, // Base64 encoded QR code image
        pixCode: pixData.text, // PIX copy-paste code
      }
    }

    return null
  } catch (error) {
    console.error('Error getting PIX details:', error)
    return null
  }
}

/**
 * Check payment status endpoint
 * GET /api/stripe/create-pix-payment?paymentIntentId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('paymentIntentId')

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId parameter' },
        { status: 400 }
      )
    }

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Update database if status changed
    if (paymentIntent.status === 'succeeded') {
      const supabase = createServiceRoleClient()
      await supabase
        .from('pix_payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('payment_intent_id', paymentIntentId)
    }

    return NextResponse.json({
      status: paymentIntent.status,
      paid: paymentIntent.status === 'succeeded',
      amount: paymentIntent.amount / 100,
      metadata: paymentIntent.metadata,
    })
  } catch (error) {
    console.error('[Check PIX Payment] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check payment status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
