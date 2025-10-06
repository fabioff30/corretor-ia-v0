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

export async function POST(request: NextRequest) {
  try {
    // Get headers
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')

    // Parse body
    const body = await request.json()

    // Parse webhook data
    const webhookData = parseWebhookPayload(body)

    if (!webhookData) {
      console.error('Invalid webhook payload:', body)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Validate signature
    const validation = validateWebhookSignature(
      xSignature,
      xRequestId,
      webhookData.id
    )

    if (!validation.isValid) {
      console.error('Webhook signature validation failed:', validation.error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
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
    })

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
