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
import { sendPaymentApprovedEmail } from '@/lib/email/send'
import { getPublicConfig } from '@/utils/env-config'

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
    // Note: v0 (old format) webhooks may fail validation but should still be processed
    if (xSignature && xRequestId) {
      const validation = validateWebhookSignature(
        xSignature,
        xRequestId,
        webhookData.id
      )

      if (!validation.isValid) {
        console.error('[MP Webhook] Signature validation failed:', validation.error)

        // If it's v0 format (old), allow it despite validation failure
        // v0 webhooks use different validation method
        if (webhookData.apiVersion === 'v0') {
          console.warn('[MP Webhook] Allowing v0 webhook despite validation failure (old format)')
        } else {
          // v1 format MUST have valid signature
          return NextResponse.json(
            { received: true, error: 'Invalid signature' },
            { status: 200 } // Return 200 to prevent retries
          )
        }
      } else {
        console.log('[MP Webhook] Signature validated successfully')
      }
    } else {
      console.warn('[MP Webhook] No signature headers - skipping validation (v0 format or test mode)')
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
  const startTime = Date.now()
  console.log(`[MP Webhook Payment] Started processing payment ${paymentId} at ${new Date().toISOString()}`)

  try {
    const mpClient = getMercadoPagoClient()
    const supabase = createServiceRoleClient()

    if (!supabase) {
      console.error('[MP Webhook Payment] Failed to create Supabase client')
      return
    }

    // Get payment details from MP
    console.log(`[MP Webhook Payment] Fetching payment details from Mercado Pago...`)
    const payment = await mpClient.getPayment(paymentId)

    console.log(`[MP Webhook Payment] Payment details retrieved (${Date.now() - startTime}ms):`, {
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      payment_method: payment.payment_method_id,
      external_reference: payment.external_reference,
      date_approved: payment.date_approved,
    })

    // Check if it's a PIX payment
    if (payment.payment_method_id === 'pix' && payment.status === 'approved') {
      // Handle PIX payment for subscription creation
      const externalReference = payment.external_reference // Can be userId or guest_email

      if (!externalReference) {
        console.error('PIX payment missing external_reference')
        return
      }

      // Check if this is a guest payment (starts with "guest_")
      const isGuestPayment = externalReference.startsWith('guest_')

      // Update PIX payment record
      console.log(`[MP Webhook Payment] Updating PIX payment record in database...`)

      // First, get the payment to check if it's a guest payment
      const { data: pixPaymentCheck, error: pixCheckError } = await supabase
        .from('pix_payments')
        .select('user_id, email, plan_type')
        .eq('payment_intent_id', payment.id.toString())
        .maybeSingle()

      if (pixCheckError) {
        console.error(`[MP Webhook Payment] Error querying PIX payment:`, pixCheckError)
        return
      }

      if (!pixPaymentCheck) {
        console.error(`[MP Webhook Payment] PIX payment record not found for payment ID: ${payment.id}`)
        return
      }

      const isGuestPaymentCheck = !pixPaymentCheck.user_id

      // For guest payments: mark as 'approved' (not yet linked to account)
      // For logged users: will be marked as 'consumed' after activation
      const targetStatus = isGuestPaymentCheck ? 'approved' : 'paid'

      const { data: pixPayment, error: pixUpdateError } = await supabase
        .from('pix_payments')
        .update({
          status: targetStatus,
          paid_at: payment.date_approved || new Date().toISOString(),
        })
        .eq('payment_intent_id', payment.id.toString())
        .select('user_id, email, plan_type')
        .maybeSingle()

      if (pixUpdateError) {
        console.error(`[MP Webhook Payment] Error updating PIX payment record:`, pixUpdateError)
        return
      }

      if (!pixPayment) {
        console.error(`[MP Webhook Payment] PIX payment record not found after update for payment ID: ${payment.id}`)
        return
      }

      console.log(`[MP Webhook Payment] PIX payment record updated (${Date.now() - startTime}ms):`, {
        user_id: pixPayment.user_id,
        email: pixPayment.email,
        plan_type: pixPayment.plan_type,
        status: targetStatus,
      })

      // If this is a guest payment, mark as approved but don't create subscription yet
      if (isGuestPayment || !pixPayment.user_id) {
        console.log('[MP Webhook] Guest PIX payment approved:', {
          paymentId: payment.id,
          email: pixPayment.email,
          amount: payment.transaction_amount,
          status: 'approved',
        })
        console.log('[MP Webhook] Payment marked as APPROVED. Will be linked when user registers/logs in.')
        return
      }

      // For authenticated user payments, proceed with subscription creation
      const userId = pixPayment.user_id

      // Check if user already has an active subscription
      const { data: existingSubscription, error: existingSubError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['authorized', 'active'])
        .maybeSingle()

      if (existingSubError) {
        console.error('[MP Webhook Payment] Error checking existing subscription:', existingSubError)
        return
      }

      if (existingSubscription) {
        console.log('[MP Webhook Payment] User already has an active subscription')
        return
      }

      // Determine plan type from database record
      const planTypeRaw = pixPayment.plan_type
      if (planTypeRaw !== 'monthly' && planTypeRaw !== 'annual') {
        console.error(`[MP Webhook Payment] Unsupported PIX plan type: ${planTypeRaw}`)
        return
      }
      const planType = planTypeRaw
      const paidAtIso = payment.date_approved || pixPayment.paid_at || new Date().toISOString()
      const { startDateIso, expiresAtIso } = calculateSubscriptionWindow(planType, paidAtIso)

      // Create subscription record
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          mp_subscription_id: `pix_${payment.id}`, // PIX payments don't have subscription IDs
          mp_payer_id: payment.payer.id,
          status: 'authorized',
          start_date: startDateIso,
          next_payment_date: expiresAtIso,
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
      console.log(`[MP Webhook Payment] Activating subscription via RPC...`)
      const { error: activateError } = await supabase.rpc('activate_subscription', {
        p_user_id: userId,
        p_subscription_id: newSubscription.id,
      })

      if (activateError) {
        console.error(`[MP Webhook Payment] Error activating subscription via RPC (${Date.now() - startTime}ms):`, activateError)
      } else {
        console.log(`[MP Webhook Payment] Subscription activated via RPC (${Date.now() - startTime}ms)`)
      }

      const nowIso = new Date().toISOString()
      const { data: updatedProfile, error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          plan_type: 'pro',
          subscription_status: 'active',
          subscription_expires_at: expiresAtIso,
          updated_at: nowIso,
        })
        .eq('id', userId)
        .select('plan_type, subscription_status, subscription_expires_at')
        .maybeSingle()

      if (profileUpdateError) {
        console.error('[MP Webhook Payment] Error updating profile after PIX payment:', profileUpdateError)
        return
      }

      if (!updatedProfile) {
        console.error('[MP Webhook Payment] Profile not found after update for user:', userId)
        return
      }

      // Get user email and name for sending confirmation email
      console.log(`[MP Webhook Payment] Fetching user details to send payment confirmation email...`)
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .maybeSingle()

      if (userProfileError) {
        console.error('[MP Webhook Payment] Error fetching user profile for email:', userProfileError)
        // Continue anyway - email is not critical for activation
      } else if (userProfile && userProfile.email) {
        // Send payment approved email
        try {
          const appUrl = getPublicConfig().APP_URL
          const dashboardLink = `${appUrl}/dashboard`

          console.log(`[MP Webhook Payment] Sending payment approved email to: ${userProfile.email}`)

          await sendPaymentApprovedEmail({
            to: {
              email: userProfile.email,
              name: userProfile.full_name || 'Usuário',
            },
            name: userProfile.full_name || 'Usuário',
            amount: payment.transaction_amount,
            planType: planType,
            activationLink: dashboardLink,
          })

          console.log(`[MP Webhook Payment] ✉️ Payment approved email sent successfully to ${userProfile.email}`)
        } catch (emailError) {
          console.error('[MP Webhook Payment] Error sending payment approved email:', emailError)
          // Don't fail the webhook if email fails - activation is already complete
        }
      } else {
        console.warn('[MP Webhook Payment] User profile has no email - skipping payment confirmation email')
      }

      // Mark payment as consumed (benefit applied)
      const { error: consumeError } = await supabase
        .from('pix_payments')
        .update({
          status: 'consumed',
        })
        .eq('payment_intent_id', payment.id.toString())

      if (consumeError) {
        console.error('[MP Webhook Payment] Error marking payment as consumed:', consumeError)
        // Not critical - subscription already created
      }

      const duration = Date.now() - startTime
      console.log(`[MP Webhook Payment] ✅ PIX payment processed successfully in ${duration}ms:`, {
        userId,
        paymentId: payment.id,
        plan_type: updatedProfile?.plan_type,
        subscription_status: updatedProfile?.subscription_status,
        subscription_expires_at: updatedProfile?.subscription_expires_at,
        rpcActivated: !activateError,
        paymentConsumed: !consumeError,
        processing_time_ms: duration,
      })
      return
    }

    // Handle regular subscription payments (non-PIX)
    // Find subscription by payer email or external reference
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, user_id, mp_subscription_id')
      .eq('mp_payer_id', payment.payer.id)
      .maybeSingle()

    if (subscriptionError) {
      console.error('[MP Webhook Payment] Error finding subscription:', subscriptionError)
      return
    }

    if (!subscription) {
      console.warn(`[MP Webhook Payment] No subscription found for payer ${payment.payer.id}`)
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
    console.error('[MP Webhook Payment] ❌ Error handling payment event:', {
      paymentId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime
    })
    // Don't throw - let main handler catch and return 200
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
    const { data: subscription, error: subFindError } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('mp_subscription_id', subscriptionId)
      .maybeSingle()

    if (subFindError) {
      console.error('[MP Webhook Subscription] Error finding subscription:', subFindError)
      return
    }

    if (!subscription) {
      console.warn(`[MP Webhook Subscription] Subscription not found in database: ${subscriptionId}`)
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
        console.error('[MP Webhook Subscription] Error canceling subscription:', cancelError)
        return
      }

      console.log('[MP Webhook Subscription] Subscription cancelled for user:', subscription.user_id)
    }
  } catch (error) {
    console.error('[MP Webhook Subscription] ❌ Error handling subscription event:', {
      subscriptionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    // Don't throw - let main handler catch and return 200
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

// Disable body size limit for webhooks
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
