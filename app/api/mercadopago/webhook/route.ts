/**
 * API Route: Mercado Pago Webhook
 * POST /api/mercadopago/webhook
 *
 * Receives notifications from Mercado Pago about payment and subscription events
 * Validates signature and processes the event
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  validateWebhookSignature,
  parseWebhookPayload,
  sanitizeWebhookData,
} from '@/lib/mercadopago/webhook-validator'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const maxDuration = 60

// Allow GET for testing webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Mercado Pago Webhook endpoint is active',
    endpoint: '/api/mercadopago/webhook',
    methods: ['POST'],
  })
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-request-id',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Log incoming webhook
    console.log('[MP Webhook] Received webhook request')

    // Get headers
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')

    console.log('[MP Webhook] Headers:', {
      hasSignature: !!xSignature,
      hasRequestId: !!xRequestId
    })

    // Parse body
    const body = await request.json()
    console.log('[MP Webhook] Body:', JSON.stringify(body).substring(0, 200))

    // Parse webhook data
    const webhookData = parseWebhookPayload(body)

    if (!webhookData) {
      console.error('[MP Webhook] Invalid webhook payload:', body)
      return NextResponse.json({
        received: true,
        error: 'Invalid payload'
      }, { status: 200 }) // Return 200 to prevent retries
    }

    console.log('[MP Webhook] Parsed data:', {
      type: webhookData.type,
      action: webhookData.action,
      id: webhookData.id,
    })

    // Validate signature (skip in test mode if no signature)
    if (xSignature && xRequestId) {
      const validation = validateWebhookSignature(
        xSignature,
        xRequestId,
        webhookData.id
      )

      if (!validation.isValid) {
        console.error('[MP Webhook] Signature validation failed:', validation.error)
        return NextResponse.json(
          { received: true, error: 'Invalid signature' },
          { status: 200 } // Return 200 to prevent retries
        )
      }
      console.log('[MP Webhook] Signature validated successfully')
    } else {
      console.warn('[MP Webhook] No signature headers - skipping validation (test mode?)')
    }

    console.log('Webhook received:', {
      type: webhookData.type,
      action: webhookData.action,
      id: webhookData.id,
    })

    // Process based on webhook type
    switch (webhookData.type) {
      case 'payment':
      case 'authorized_payment':
        await handlePaymentEvent(webhookData.id, body)
        break

      case 'subscription':
        await handleSubscriptionEvent(webhookData.id, body)
        break

      default:
        console.log(`Unhandled webhook type: ${webhookData.type}`)
    }

    // Return 200 OK to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)

    // Still return 200 to prevent MP from retrying
    // Log the error for manual review
    return NextResponse.json(
      {
        received: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    )
  }
}

/**
 * Handle payment events
 */
async function handlePaymentEvent(paymentId: string, webhookBody: any) {
  try {
    const mpClient = getMercadoPagoClient()
    const supabase = createServiceRoleClient()

    // Get payment details from MP
    const payment = await mpClient.getPayment(paymentId)

    console.log('Processing payment:', {
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      payment_method: payment.payment_method_id,
      external_reference: payment.external_reference
    })

    // Check if it's a PIX payment
    if (payment.payment_method_id === 'pix' && payment.status === 'approved') {
      // Handle PIX payment for subscription creation
      const userId = payment.external_reference // We set this when creating the PIX payment

      if (!userId) {
        console.error('PIX payment missing user ID in external_reference')
        return
      }

      // Update PIX payment record
      await supabase
        .from('pix_payments')
        .update({
          status: 'paid',
          paid_at: payment.date_approved || new Date().toISOString(),
        })
        .eq('payment_intent_id', payment.id.toString())

      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['authorized', 'active'])
        .single()

      if (existingSubscription) {
        console.log('User already has an active subscription')
        return
      }

      // Determine plan type from amount
      const planType = payment.transaction_amount === 299.00 ? 'annual' : 'monthly'

      // Create subscription record
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          mp_subscription_id: `pix_${payment.id}`, // PIX payments don't have subscription IDs
          mp_payer_id: payment.payer.id,
          status: 'authorized',
          start_date: new Date().toISOString(),
          next_payment_date: planType === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          amount: payment.transaction_amount,
          currency: payment.currency_id,
          payment_method_id: 'pix',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating subscription:', insertError)
        return
      }

      // Activate subscription
      const { error: activateError } = await supabase.rpc('activate_subscription', {
        p_user_id: userId,
        p_subscription_id: newSubscription.id,
      })

      if (activateError) {
        console.error('Error activating subscription:', activateError)
        return
      }

      // Update user profile to premium
      await supabase
        .from('profiles')
        .update({
          is_pro: true,
          plan_type: 'premium',
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      console.log('PIX payment processed and subscription activated for user:', userId)
      return
    }

    // Handle regular subscription payments (non-PIX)
    // Find subscription by payer email or external reference
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, user_id, mp_subscription_id')
      .eq('mp_payer_id', payment.payer.id)
      .single()

    if (!subscription) {
      console.warn(`No subscription found for payer ${payment.payer.id}`)
      return
    }

    // Insert payment transaction record
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        subscription_id: subscription.id,
        user_id: subscription.user_id,
        mp_payment_id: payment.id.toString(),
        mp_subscription_id: subscription.mp_subscription_id,
        status: payment.status as 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled',
        status_detail: payment.status_detail,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        payment_method: payment.payment_method_id,
        payment_type: payment.payment_type_id,
        webhook_data: sanitizeWebhookData(webhookBody),
        paid_at: payment.date_approved || payment.date_created,
      })

    if (insertError) {
      console.error('Error inserting payment transaction:', insertError)
      throw insertError
    }

    // Handle payment status
    if (payment.status === 'approved') {
      // Payment approved - activate subscription
      const { error: activateError } = await supabase.rpc(
        'activate_subscription',
        {
          p_user_id: subscription.user_id,
          p_subscription_id: subscription.id,
        }
      )

      if (activateError) {
        console.error('Error activating subscription:', activateError)
        throw activateError
      }

      // Update next payment date
      const mpSubscription = await mpClient.getSubscription(
        subscription.mp_subscription_id!
      )

      await supabase
        .from('subscriptions')
        .update({
          next_payment_date: mpSubscription.next_payment_date,
          payment_method_id: payment.payment_method_id,
        })
        .eq('id', subscription.id)

      console.log('Subscription activated for user:', subscription.user_id)
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      console.log('Payment rejected/cancelled:', payment.id)
      // Could send email notification here
    }
  } catch (error) {
    console.error('Error handling payment event:', error)
    throw error
  }
}

/**
 * Handle subscription events (status changes)
 */
async function handleSubscriptionEvent(subscriptionId: string, webhookBody: any) {
  try {
    const mpClient = getMercadoPagoClient()
    const supabase = createServiceRoleClient()

    // Get subscription details from MP
    const mpSubscription = await mpClient.getSubscription(subscriptionId)

    console.log('Processing subscription event:', {
      id: subscriptionId,
      status: mpSubscription.status,
    })

    // Find subscription in database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('mp_subscription_id', subscriptionId)
      .single()

    if (!subscription) {
      console.warn(`Subscription not found in database: ${subscriptionId}`)
      return
    }

    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: mpSubscription.status as 'pending' | 'authorized' | 'paused' | 'canceled',
        next_payment_date: mpSubscription.next_payment_date,
        payment_method_id: mpSubscription.payment_method_id,
      })
      .eq('id', subscription.id)

    // Handle subscription cancellation
    if (mpSubscription.status === 'cancelled') {
      const { error: cancelError } = await supabase.rpc('cancel_subscription', {
        p_user_id: subscription.user_id,
        p_subscription_id: subscription.id,
      })

      if (cancelError) {
        console.error('Error canceling subscription:', cancelError)
        throw cancelError
      }

      console.log('Subscription cancelled for user:', subscription.user_id)
    }
  } catch (error) {
    console.error('Error handling subscription event:', error)
    throw error
  }
}

// Disable body size limit for webhooks
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
