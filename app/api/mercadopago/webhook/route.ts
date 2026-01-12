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
import { sendPaymentApprovedEmail, sendGiftInvitationEmail, sendGiftBuyerRewardEmail, sendBundleActivationEmail } from '@/lib/email/send'
import { getPublicConfig } from '@/utils/env-config'
import { CHRISTMAS_GIFT_CONFIG, getGiftPlan } from '@/lib/gift/config'
import type { GiftPlanId } from '@/lib/gift/types'
import { activateJulinhoSubscription, sendJulinhoTemplateMessage } from '@/lib/julinho/client'

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

      case 'merchant_order':
        // Merchant order webhooks are informational (sent when PIX QR is generated)
        // We don't need to process them - the payment webhook will come when user pays
        console.log('[MP Webhook] Merchant order notification (informational):', {
          id: webhookData.id,
          action: webhookData.action,
          status: body.data?.status || body.status,
        })
        break

      default:
        console.log(`[MP Webhook] Unhandled webhook type: ${webhookData.type}`)
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
      const externalReference = payment.external_reference // Can be userId, guest_email, or gift_{id}

      if (!externalReference) {
        console.error('PIX payment missing external_reference')
        return
      }

      // Check if this is a GIFT payment (starts with "gift_")
      if (externalReference.startsWith('gift_')) {
        await handleGiftPayment(payment, externalReference, supabase)
        return
      }

      // Check if this is a BUYER REWARD payment (starts with "buyer_reward_")
      if (externalReference.startsWith('buyer_reward_')) {
        await handleBuyerRewardPayment(payment, externalReference, supabase)
        return
      }

      // Check if this is a BUNDLE payment (CorretorIA + Julinho)
      if (externalReference.startsWith('bundle_')) {
        await handleBundlePayment(payment, externalReference, supabase)
        return
      }

      // Check if this is a guest payment (starts with "guest_")
      const isGuestPayment = externalReference.startsWith('guest_')

      // Update PIX payment record
      console.log(`[MP Webhook Payment] Updating PIX payment record in database...`)

      // First, get the payment to check if it's a guest payment
      const { data: pixPaymentCheck, error: pixCheckError } = await supabase
        .from('pix_payments')
        .select('user_id, email, plan_type, paid_at, fbc, fbp, event_id')
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
        .select('user_id, email, plan_type, paid_at')
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

      // =============================
      // SEND PURCHASE EVENT TO META CAPI
      // =============================
      try {
        const { sendPurchaseEvent } = await import('@/lib/meta-capi')
        const contentId = `premium_${planType}`
        const contentName = planType === 'monthly' ? 'CorretorIA Premium Mensal' : 'CorretorIA Premium Anual'

        await sendPurchaseEvent({
          eventId: pixPaymentCheck.event_id || `purchase_${payment.id}_${Date.now()}`,
          eventSourceUrl: 'https://www.corretordetextoonline.com.br/premium',
          value: payment.transaction_amount,
          currency: payment.currency_id || 'BRL',
          contentId,
          contentName,
          userData: {
            email: userProfile?.email || undefined,
            userId: userId,
            fbc: pixPaymentCheck.fbc || undefined,
            fbp: pixPaymentCheck.fbp || undefined,
          },
        })

        console.log('[MP Webhook Payment] Meta CAPI Purchase event sent')
      } catch (capiError) {
        // Non-blocking: log error but don't fail the payment
        console.error('[MP Webhook Payment] Meta CAPI Purchase error (non-blocking):', capiError)
      }

      // =============================
      // JULINHO ACTIVATION (if WhatsApp provided)
      // For regular premium plans, activate Julinho as a bonus
      // =============================
      let julinhoActivated = false
      const { data: pixPaymentForJulinho } = await supabase
        .from('pix_payments')
        .select('whatsapp_phone, julinho_activated')
        .eq('payment_intent_id', payment.id.toString())
        .maybeSingle()

      if (pixPaymentForJulinho?.whatsapp_phone && !pixPaymentForJulinho.julinho_activated) {
        const whatsappPhone = pixPaymentForJulinho.whatsapp_phone
        console.log('[MP Webhook Payment] Activating Julinho for premium subscriber:', whatsappPhone.slice(0, 4) + '****')

        try {
          // 1. Send template message "pagamento_aprovado"
          const templateResult = await sendJulinhoTemplateMessage(whatsappPhone, 'pagamento_aprovado')
          if (templateResult.success) {
            console.log('[MP Webhook Payment] Template "pagamento_aprovado" sent to:', whatsappPhone.slice(0, 4) + '****')
          } else {
            console.error('[MP Webhook Payment] Failed to send template:', templateResult.error)
          }

          // 2. Activate Julinho subscription for 30 days
          const julinhoResult = await activateJulinhoSubscription(whatsappPhone, 30)
          if (julinhoResult.success) {
            julinhoActivated = true
            console.log('[MP Webhook Payment] Julinho activated for:', whatsappPhone.slice(0, 4) + '****')

            // Update julinho_activated status
            await supabase
              .from('pix_payments')
              .update({ julinho_activated: true })
              .eq('payment_intent_id', payment.id.toString())
          } else {
            console.error('[MP Webhook Payment] Julinho activation failed:', julinhoResult.error)
            // Non-critical - don't fail the payment processing
          }
        } catch (julinhoError) {
          console.error('[MP Webhook Payment] Error activating Julinho:', julinhoError)
          // Non-critical - subscription is already active
        }
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
        julinhoActivated,
        processing_time_ms: duration,
      })
      return
    }

    // For PIX payments that are not approved yet, just return
    // We'll process them when they become approved
    if (payment.payment_method_id === 'pix') {
      console.log('[MP Webhook Payment] PIX payment not yet approved, skipping:', {
        paymentId: payment.id,
        status: payment.status,
      })
      return
    }

    // Handle regular subscription payments (non-PIX, e.g., credit card)
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
      if (!subscription.user_id) {
        console.warn('[MP Webhook Payment] Subscription missing user_id, skipping activation')
        return
      }
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
      if (!subscription.user_id) {
        console.warn('[MP Webhook Subscription] Subscription missing user_id, skipping cancel RPC')
        return
      }
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

/**
 * Handle bundle payment - CorretorIA + Julinho Premium bundle
 * external_reference format: bundle_{userId}_{phone} or bundle_guest_{email}_{phone}
 */
async function handleBundlePayment(payment: any, externalReference: string, supabase: any) {
  const startTime = Date.now()

  console.log('[MP Webhook Bundle] Processing bundle payment:', {
    paymentId: payment.id,
    externalReference,
    amount: payment.transaction_amount,
    status: payment.status,
  })

  try {
    // Parse external_reference to get phone number
    // Format: bundle_{userId}_{phone} or bundle_guest_{email}_{phone}
    const parts = externalReference.split('_')
    const phone = parts[parts.length - 1] // Phone is always the last part

    const isGuestBundle = externalReference.startsWith('bundle_guest_')

    // =============================
    // ATOMIC IDEMPOTENCY - Claim payment with UPDATE + WHERE
    // This prevents race conditions when MP sends multiple webhooks simultaneously
    // =============================
    console.log('[MP Webhook Bundle] Attempting atomic claim for payment:', payment.id.toString())

    const { data: claimedPayment, error: claimError } = await supabase
      .from('pix_payments')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', payment.id.toString())
      .in('status', ['pending', 'created']) // Only claim if NOT already processing/consumed
      .is('julinho_activated', false) // Only if not yet activated (handles NULL and false)
      .select('id, user_id, email, plan_type, whatsapp_phone, is_bundle')
      .maybeSingle()

    // Log claim result for debugging
    console.log('[MP Webhook Bundle] Claim result:', {
      paymentId: payment.id,
      claimed: !!claimedPayment,
      error: claimError?.message || null,
      errorCode: claimError?.code || null,
    })

    // If we couldn't claim, check why and retry if needed
    let pixPayment = claimedPayment

    if (!claimedPayment) {
      // Check if it's already processed or just doesn't exist
      const { data: existingPayment } = await supabase
        .from('pix_payments')
        .select('status, julinho_activated')
        .eq('payment_intent_id', payment.id.toString())
        .maybeSingle()

      if (existingPayment) {
        // If status is still pending but claim failed, something is wrong - try simpler query
        if (existingPayment.status === 'pending' && existingPayment.julinho_activated !== true) {
          console.warn('[MP Webhook Bundle] Claim failed but payment is eligible, retrying with simpler query...')

          const { data: retryClaimedPayment, error: retryError } = await supabase
            .from('pix_payments')
            .update({
              status: 'processing',
              processing_started_at: new Date().toISOString(),
            })
            .eq('payment_intent_id', payment.id.toString())
            .eq('status', 'pending')
            .select('id, user_id, email, plan_type, whatsapp_phone, is_bundle')
            .maybeSingle()

          if (retryClaimedPayment) {
            console.log('[MP Webhook Bundle] Retry claim successful!')
            pixPayment = retryClaimedPayment
            // Continue processing below
          } else {
            console.error('[MP Webhook Bundle] Retry claim also failed:', retryError?.message)
            console.log('[MP Webhook Bundle] Payment already claimed by another webhook (atomic check):', {
              paymentId: payment.id,
              currentStatus: existingPayment.status,
              julinho_activated: existingPayment.julinho_activated,
            })
            return
          }
        } else {
          console.log('[MP Webhook Bundle] Payment already claimed by another webhook (atomic check):', {
            paymentId: payment.id,
            currentStatus: existingPayment.status,
            julinho_activated: existingPayment.julinho_activated,
          })
          return
        }
      } else {
        console.error('[MP Webhook Bundle] PIX payment not found:', payment.id)
        return
      }
    } else {
      console.log('[MP Webhook Bundle] Successfully claimed payment for processing:', {
        paymentId: payment.id,
        claimedAt: new Date().toISOString(),
      })
    }

    // Verify this is a bundle payment
    if (!pixPayment.is_bundle) {
      console.warn('[MP Webhook Bundle] Payment is not marked as bundle:', payment.id)
    }

    const whatsappPhone = pixPayment.whatsapp_phone || phone

    // For guest payments: mark as approved (will be linked on registration)
    const isGuestPayment = !pixPayment.user_id
    const targetStatus = isGuestPayment ? 'approved' : 'paid'

    // Update PIX payment status to target status
    const { error: updateError } = await supabase
      .from('pix_payments')
      .update({
        status: targetStatus,
        paid_at: payment.date_approved || new Date().toISOString(),
      })
      .eq('payment_intent_id', payment.id.toString())

    if (updateError) {
      console.error('[MP Webhook Bundle] Error updating PIX payment:', updateError)
    }

    // =============================
    // STEP 1: Activate Julinho Premium
    // =============================
    console.log('[MP Webhook Bundle] Activating Julinho subscription for phone:', whatsappPhone)

    const julinhoResult = await activateJulinhoSubscription(whatsappPhone, 30)

    // Update julinho activation status in database IMMEDIATELY to prevent duplicates
    const { error: julinhoUpdateError } = await supabase
      .from('pix_payments')
      .update({
        julinho_activated: julinhoResult.success,
        julinho_activation_error: julinhoResult.error || null,
      })
      .eq('payment_intent_id', payment.id.toString())

    if (julinhoUpdateError) {
      console.error('[MP Webhook Bundle] Error updating julinho activation status:', julinhoUpdateError)
    }

    if (julinhoResult.success) {
      console.log('[MP Webhook Bundle] Julinho activation successful:', {
        phone: whatsappPhone,
        end_date: julinhoResult.data?.subscription_end_date,
      })

      // Send WhatsApp template message "pagamento_aprovado" - ONLY ONCE due to idempotency check above
      const templateResult = await sendJulinhoTemplateMessage(whatsappPhone, 'pagamento_aprovado')
      if (templateResult.success) {
        console.log('[MP Webhook Bundle] Template message "pagamento_aprovado" sent to:', whatsappPhone)
      } else {
        console.error('[MP Webhook Bundle] Failed to send template message:', templateResult.error)
      }
    } else {
      console.error('[MP Webhook Bundle] Julinho activation failed (will retry later):', {
        phone: whatsappPhone,
        error: julinhoResult.error,
      })
      // Don't block CorretorIA activation if Julinho fails
    }

    // =============================
    // STEP 2: Activate CorretorIA Premium
    // =============================
    let userId = pixPayment.user_id

    // If guest payment, check if user with that email already exists
    if (isGuestPayment && pixPayment.email) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', pixPayment.email)
        .maybeSingle()

      if (existingUser) {
        // User exists! Link payment and activate premium
        userId = existingUser.id
        console.log('[MP Webhook Bundle] Guest has existing account, linking payment:', {
          email: pixPayment.email,
          userId,
        })

        // Update pix_payment to link to user
        await supabase
          .from('pix_payments')
          .update({ user_id: userId })
          .eq('payment_intent_id', payment.id.toString())
      } else {
        // Truly a new guest - will activate on registration
        console.log('[MP Webhook Bundle] Guest bundle payment - will activate CorretorIA on registration:', {
          email: pixPayment.email,
          phone: whatsappPhone,
          julinhoActivated: julinhoResult.success,
        })
        return
      }
    }

    // For authenticated users (or guests with existing accounts), activate CorretorIA Premium
    const paidAtIso = payment.date_approved || new Date().toISOString()
    const { startDateIso, expiresAtIso } = calculateSubscriptionWindow('monthly', paidAtIso)

    // Check for idempotency - if subscription with this payment ID already exists
    const mpSubscriptionId = `bundle_${payment.id}`
    const { data: existingByPayment } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('mp_subscription_id', mpSubscriptionId)
      .maybeSingle()

    if (existingByPayment) {
      console.log('[MP Webhook Bundle] Subscription already exists for this payment (idempotency check):', mpSubscriptionId)
      // Already processed, just ensure profile is updated
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          plan_type: 'pro',
          subscription_status: 'active',
          subscription_expires_at: expiresAtIso,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (profileError) {
        console.error('[MP Webhook Bundle] Error updating profile (idempotency):', profileError)
      }
      return
    }

    // Check if user already has an active subscription (different payment)
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['authorized', 'active'])
      .maybeSingle()

    if (existingSubscription) {
      console.log('[MP Webhook Bundle] User already has active subscription, extending...')
    }

    // Create subscription record
    const { data: newSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        mp_subscription_id: mpSubscriptionId,
        mp_payer_id: payment.payer?.id,
        status: 'authorized',
        start_date: startDateIso,
        next_payment_date: expiresAtIso,
        amount: payment.transaction_amount,
        currency: payment.currency_id || 'BRL',
        payment_method_id: 'pix',
      })
      .select()
      .single()

    if (insertError) {
      // Double-check for race condition
      if (insertError.code === '23505') {
        console.log('[MP Webhook Bundle] Subscription already exists (race condition), skipping:', mpSubscriptionId)
        return
      }
      console.error('[MP Webhook Bundle] Error creating subscription:', insertError)
      return
    }

    // Activate subscription via RPC
    const { error: activateError } = await supabase.rpc('activate_subscription', {
      p_user_id: userId,
      p_subscription_id: newSubscription.id,
    })

    if (activateError) {
      console.error('[MP Webhook Bundle] Error activating subscription:', activateError)
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan_type: 'pro',
        subscription_status: 'active',
        subscription_expires_at: expiresAtIso,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileError) {
      console.error('[MP Webhook Bundle] Error updating profile:', profileError)
    }

    // Mark payment as consumed
    await supabase
      .from('pix_payments')
      .update({ status: 'consumed' })
      .eq('payment_intent_id', payment.id.toString())

    // Send bundle activation email with Julinho CTA
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (userProfile?.email) {
      try {
        await sendBundleActivationEmail({
          to: { email: userProfile.email, name: userProfile.full_name || 'Usuário' },
          name: userProfile.full_name,
          whatsappPhone,
        })
        console.log('[MP Webhook Bundle] Bundle activation email sent to:', userProfile.email)
      } catch (emailError) {
        console.error('[MP Webhook Bundle] Error sending bundle activation email:', emailError)
      }
    }

    const duration = Date.now() - startTime
    console.log(`[MP Webhook Bundle] Bundle processed successfully in ${duration}ms:`, {
      paymentId: payment.id,
      userId,
      whatsappPhone,
      corretoraActivated: !activateError && !profileError,
      julinhoActivated: julinhoResult.success,
      expiresAt: expiresAtIso,
    })
  } catch (error) {
    console.error('[MP Webhook Bundle] Error processing bundle payment:', {
      paymentId: payment.id,
      externalReference,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime,
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

/**
 * Handle gift payment - send invitation email to recipient
 */
async function handleGiftPayment(payment: any, externalReference: string, supabase: any) {
  const startTime = Date.now()
  const giftId = externalReference.replace('gift_', '')

  console.log(`[MP Webhook Gift] Processing gift payment ${payment.id} for gift ${giftId}`)

  try {
    // Get gift purchase details
    const { data: gift, error: giftError } = await supabase
      .from('gift_purchases')
      .select('*')
      .eq('id', giftId)
      .single()

    if (giftError || !gift) {
      console.error('[MP Webhook Gift] Gift not found:', giftId, giftError)
      return
    }

    // Check if already processed
    if (gift.status !== 'pending_payment') {
      console.log('[MP Webhook Gift] Gift already processed:', gift.status)
      return
    }

    // Update gift status to paid
    const { error: updateError } = await supabase
      .from('gift_purchases')
      .update({
        status: 'paid',
        payment_id: payment.id.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', giftId)

    if (updateError) {
      console.error('[MP Webhook Gift] Error updating gift status:', updateError)
      return
    }

    console.log('[MP Webhook Gift] Gift marked as paid, sending email to recipient...')

    // Get plan name from config
    const planConfig = gift.plan_type ? getGiftPlan(gift.plan_type as GiftPlanId) : undefined
    const planName = planConfig?.name || 'Premium'

    // Send gift invitation email to recipient
    try {
      await sendGiftInvitationEmail({
        to: {
          email: gift.recipient_email,
          name: gift.recipient_name,
        },
        recipientName: gift.recipient_name,
        buyerName: gift.buyer_name,
        planName: planName,
        giftCode: gift.gift_code,
        giftMessage: gift.gift_message,
        expiresAt: new Date(gift.expires_at),
      })

      // Update status to email_sent
      await supabase
        .from('gift_purchases')
        .update({
          status: 'email_sent',
          email_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', giftId)

      console.log(`[MP Webhook Gift] Gift email sent to recipient: ${gift.recipient_email}`)

      // Create TWO PIX payments with 50% discount for the buyer (Monthly and Annual)
      const monthlyOriginalPrice = 29.90
      const monthlyDiscountedPrice = monthlyOriginalPrice * 0.5 // 50% off = R$ 14.95
      const annualOriginalPrice = 238.80
      const annualDiscountedPrice = annualOriginalPrice * 0.5 // 50% off = R$ 119.40
      const discountExpiresAt = new Date()
      discountExpiresAt.setDate(discountExpiresAt.getDate() + 7) // PIX valid for 7 days

      try {
        const mpClient = getMercadoPagoClient()

        // Create Monthly PIX payment
        const monthlyPixPayment = await mpClient.createPixPayment(
          monthlyDiscountedPrice,
          gift.buyer_email,
          `buyer_reward_monthly_${giftId}`,
          'CorretorIA Premium Mensal - 50% OFF',
          60 * 24 * 7 // 7 days in minutes
        )

        // Create Annual PIX payment
        const annualPixPayment = await mpClient.createPixPayment(
          annualDiscountedPrice,
          gift.buyer_email,
          `buyer_reward_annual_${giftId}`,
          'CorretorIA Premium Anual - 50% OFF',
          60 * 24 * 7 // 7 days in minutes
        )

        const monthlyQrCode = monthlyPixPayment.point_of_interaction?.transaction_data?.qr_code_base64
        const monthlyPixCopy = monthlyPixPayment.point_of_interaction?.transaction_data?.qr_code
        const annualQrCode = annualPixPayment.point_of_interaction?.transaction_data?.qr_code_base64
        const annualPixCopy = annualPixPayment.point_of_interaction?.transaction_data?.qr_code

        if (!monthlyQrCode || !annualQrCode || !monthlyPixCopy || !annualPixCopy) {
          console.error('[MP Webhook Gift] PIX QR codes not generated for buyer reward')
        } else {
          // Send reward email to buyer with both PIX options
          await sendGiftBuyerRewardEmail({
            to: {
              email: gift.buyer_email,
              name: gift.buyer_name,
            },
            buyerName: gift.buyer_name,
            recipientName: gift.recipient_name,
            giftPlanName: planName,
            monthlyDiscountedPrice,
            monthlyOriginalPrice,
            monthlyPixQrCodeBase64: monthlyQrCode,
            monthlyPixCopyPaste: monthlyPixCopy,
            annualDiscountedPrice,
            annualOriginalPrice,
            annualPixQrCodeBase64: annualQrCode,
            annualPixCopyPaste: annualPixCopy,
            expiresAt: discountExpiresAt,
          })

          console.log(`[MP Webhook Gift] Buyer reward PIX email sent to: ${gift.buyer_email}`, {
            monthlyPixId: monthlyPixPayment.id,
            annualPixId: annualPixPayment.id,
            monthlyDiscountedPrice,
            annualDiscountedPrice,
          })
        }
      } catch (buyerEmailError) {
        console.error('[MP Webhook Gift] Error creating buyer reward PIX:', buyerEmailError)
        // Non-critical - gift was already sent to recipient
      }

      const duration = Date.now() - startTime
      console.log(`[MP Webhook Gift] Gift processed successfully in ${duration}ms:`, {
        giftId,
        recipientEmail: gift.recipient_email,
        buyerEmail: gift.buyer_email,
        giftCode: gift.gift_code,
        planName,
      })
    } catch (emailError) {
      console.error('[MP Webhook Gift] Error sending gift email:', emailError)
      // Keep status as 'paid' - can retry email later
    }
  } catch (error) {
    console.error('[MP Webhook Gift] Error processing gift payment:', {
      giftId,
      paymentId: payment.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime,
    })
  }
}

/**
 * Handle buyer reward payment - when buyer pays the 50% discount PIX
 * external_reference format: buyer_reward_monthly_{giftId} or buyer_reward_annual_{giftId}
 */
async function handleBuyerRewardPayment(payment: any, externalReference: string, supabase: any) {
  const startTime = Date.now()

  // Parse external_reference: buyer_reward_monthly_xxx or buyer_reward_annual_xxx
  const parts = externalReference.split('_')
  const planType = parts[2] as 'monthly' | 'annual' // 'monthly' or 'annual'
  const giftId = parts[3]

  console.log('[MP Webhook BuyerReward] Processing buyer reward payment:', {
    paymentId: payment.id,
    planType,
    giftId,
    amount: payment.transaction_amount,
    status: payment.status,
  })

  // Only process approved payments
  if (payment.status !== 'approved') {
    console.log('[MP Webhook BuyerReward] Payment not approved yet, status:', payment.status)
    return
  }

  try {
    // Get gift purchase to find buyer email
    const { data: gift, error: giftError } = await supabase
      .from('gift_purchases')
      .select('buyer_email, buyer_name')
      .eq('id', giftId)
      .single()

    if (giftError || !gift) {
      console.error('[MP Webhook BuyerReward] Gift not found:', giftId, giftError)
      return
    }

    // Check if user exists with this email
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, plan_type')
      .eq('email', gift.buyer_email)
      .maybeSingle()

    if (profileError) {
      console.error('[MP Webhook BuyerReward] Error checking user profile:', profileError)
    }

    // Create pix_payments record for tracking
    const { error: insertError } = await supabase
      .from('pix_payments')
      .insert({
        user_id: userProfile?.id || null,
        email: gift.buyer_email,
        plan_type: planType,
        amount: payment.transaction_amount,
        payment_intent_id: payment.id.toString(),
        status: userProfile ? 'paid' : 'approved', // 'paid' if user exists, 'approved' if guest
        paid_at: payment.date_approved || new Date().toISOString(),
      })

    if (insertError) {
      console.error('[MP Webhook BuyerReward] Error inserting pix_payment:', insertError)
      // Continue anyway - we want to log this
    }

    // If user exists and doesn't have active subscription, activate it
    if (userProfile && userProfile.plan_type !== 'pro') {
      const paidAtIso = payment.date_approved || new Date().toISOString()
      const { startDateIso, expiresAtIso } = calculateSubscriptionWindow(planType, paidAtIso)

      // Create subscription record
      const { data: newSubscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userProfile.id,
          mp_subscription_id: `buyer_reward_${payment.id}`,
          mp_payer_id: payment.payer?.id || null,
          status: 'authorized',
          start_date: startDateIso,
          next_payment_date: expiresAtIso,
          amount: payment.transaction_amount,
          currency: payment.currency_id || 'BRL',
          payment_method_id: 'pix',
        })
        .select()
        .single()

      if (subError) {
        console.error('[MP Webhook BuyerReward] Error creating subscription:', subError)
      } else if (newSubscription) {
        // Activate subscription
        const { error: activateError } = await supabase.rpc('activate_subscription', {
          p_user_id: userProfile.id,
          p_subscription_id: newSubscription.id,
        })

        if (activateError) {
          console.error('[MP Webhook BuyerReward] Error activating subscription:', activateError)
        }

        // Update profile to pro
        await supabase
          .from('profiles')
          .update({
            plan_type: 'pro',
            subscription_status: 'active',
            subscription_expires_at: expiresAtIso,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userProfile.id)

        // Mark payment as consumed
        await supabase
          .from('pix_payments')
          .update({ status: 'consumed' })
          .eq('payment_intent_id', payment.id.toString())

        console.log('[MP Webhook BuyerReward] Subscription activated for buyer:', {
          userId: userProfile.id,
          email: gift.buyer_email,
          planType,
          expiresAt: expiresAtIso,
        })
      }
    } else if (!userProfile) {
      // User doesn't exist yet - payment is recorded as 'approved'
      // Will be linked when user registers with this email
      console.log('[MP Webhook BuyerReward] Payment recorded for guest buyer (will activate on registration):', {
        email: gift.buyer_email,
        planType,
        amount: payment.transaction_amount,
      })
    } else {
      console.log('[MP Webhook BuyerReward] User already has pro plan, payment recorded:', {
        userId: userProfile.id,
        email: gift.buyer_email,
      })
    }

    const duration = Date.now() - startTime
    console.log(`[MP Webhook BuyerReward] Processed in ${duration}ms:`, {
      paymentId: payment.id,
      buyerEmail: gift.buyer_email,
      planType,
      giftId,
    })
  } catch (error) {
    console.error('[MP Webhook BuyerReward] Error processing:', {
      paymentId: payment.id,
      externalReference,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime,
    })
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
