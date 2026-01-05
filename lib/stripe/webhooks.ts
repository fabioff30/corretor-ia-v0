// @ts-nocheck
/**
 * Stripe Webhook Handlers
 * Process Stripe webhook events and update database
 */

import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendCancellationEmail, sendPremiumUpgradeEmail, sendBundleActivationEmail } from '@/lib/email/send'
import { activateJulinhoSubscription, sendJulinhoTemplateMessage } from '@/lib/julinho/client'

/**
 * Handle checkout.session.completed event
 * Called when customer completes checkout
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  console.log('[Stripe Webhook] checkout.session.completed', session.id)

  // Check if this is a lifetime purchase (Black Friday)
  const purchaseType = session.metadata?.purchaseType
  if (purchaseType === 'lifetime') {
    return handleLifetimePaymentCompleted(session)
  }

  // Check if this is a bundle purchase (CorretorIA + Julinho)
  const isBundle = session.metadata?.isBundle === 'true'
  const whatsappPhone = session.metadata?.whatsappPhone

  const supabase = createServiceRoleClient()
  const userId = session.metadata?.userId
  const guestEmail = session.metadata?.guestEmail
  const isGuestCheckout = session.metadata?.isGuestCheckout === 'true'
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!subscriptionId) {
    console.error('[Stripe Webhook] Missing subscriptionId')
    return
  }

  // Get subscription details
  const stripe = (await import('./server')).stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Check if subscription already exists
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (existingSubscription) {
    console.log('[Stripe Webhook] Subscription already exists, skipping insert')
    return
  }

  // If this is a guest checkout, save to pending_stripe_subscriptions table
  if (isGuestCheckout && guestEmail && !userId) {
    console.log('[Stripe Webhook] Guest checkout detected, saving to pending table:', guestEmail)

    const { error: insertError } = await supabase
      .from('pending_stripe_subscriptions')
      .insert({
        email: guestEmail,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        stripe_price_id: subscription.items.data[0].price.id,
        status: subscription.status === 'active' ? 'authorized' : 'pending',
        start_date: new Date(subscription.created * 1000).toISOString(),
        next_payment_date: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        amount: (subscription.items.data[0].price.unit_amount || 0) / 100,
        currency: subscription.currency.toUpperCase(),
        payment_status: session.payment_status,
        is_bundle: isBundle || false,
        whatsapp_phone: whatsappPhone || null,
      })

    if (insertError) {
      console.error('[Stripe Webhook] Error inserting pending subscription:', insertError)
      // Continue anyway - subscription is in Stripe
    }

    // For bundle guest checkouts, activate Julinho immediately (it's phone-based, doesn't need account)
    if (isBundle && whatsappPhone) {
      console.log('[Stripe Webhook] Guest bundle purchase, activating Julinho for:', whatsappPhone)

      try {
        const julinhoResult = await activateJulinhoSubscription(whatsappPhone, 30)

        if (julinhoResult.success) {
          console.log('[Stripe Webhook] Julinho activated for guest:', whatsappPhone)

          // Send WhatsApp template message "pagamento_aprovado"
          const templateResult = await sendJulinhoTemplateMessage(whatsappPhone, 'pagamento_aprovado')
          if (templateResult.success) {
            console.log('[Stripe Webhook] Template message "pagamento_aprovado" sent to:', whatsappPhone)
          } else {
            console.error('[Stripe Webhook] Failed to send template message:', templateResult.error)
          }
        } else {
          console.error('[Stripe Webhook] Failed to activate Julinho for guest:', julinhoResult.error)
        }
      } catch (julinhoError) {
        console.error('[Stripe Webhook] Error calling Julinho API for guest:', julinhoError)
      }
    }

    console.log('[Stripe Webhook] Guest subscription saved. Will be linked when user logs in.')
    return
  }

  // Authenticated user checkout - proceed normally
  if (!userId) {
    console.error('[Stripe Webhook] Missing userId for authenticated checkout')
    return
  }

  // Save subscription to database
  const { error: insertError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: subscription.items.data[0].price.id,
      status: subscription.status === 'active' ? 'authorized' : 'pending',
      start_date: new Date(subscription.created * 1000).toISOString(),
      next_payment_date: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      amount: (subscription.items.data[0].price.unit_amount || 0) / 100,
      currency: subscription.currency.toUpperCase(),
    })

  if (insertError) {
    console.error('[Stripe Webhook] Error inserting subscription:', insertError)
    throw insertError
  }

  console.log('[Stripe Webhook] Subscription created successfully')

  // Get the created subscription ID
  const { data: createdSubscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!createdSubscription) {
    console.error('[Stripe Webhook] Could not find created subscription')
    return
  }

  // Activate subscription immediately if payment was successful
  if (session.payment_status === 'paid') {
    const { error: activateError } = await supabase.rpc('activate_subscription', {
      p_user_id: userId,
      p_subscription_id: createdSubscription.id,
    })

    if (activateError) {
      console.error('[Stripe Webhook] Error activating subscription:', activateError)
      throw activateError
    }

    console.log('[Stripe Webhook] Subscription activated for user:', userId)

    // If this is a bundle purchase, also activate Julinho and send activation email
    if (isBundle && whatsappPhone) {
      console.log('[Stripe Webhook] Bundle purchase detected, activating Julinho for:', whatsappPhone)

      try {
        const julinhoResult = await activateJulinhoSubscription(whatsappPhone, 30)

        if (julinhoResult.success) {
          console.log('[Stripe Webhook] Julinho activated successfully for:', whatsappPhone)

          // Send WhatsApp template message "pagamento_aprovado"
          const templateResult = await sendJulinhoTemplateMessage(whatsappPhone, 'pagamento_aprovado')
          if (templateResult.success) {
            console.log('[Stripe Webhook] Template message "pagamento_aprovado" sent to:', whatsappPhone)
          } else {
            console.error('[Stripe Webhook] Failed to send template message:', templateResult.error)
          }
        } else {
          console.error('[Stripe Webhook] Failed to activate Julinho:', julinhoResult.error)
          // Note: We don't throw here - CorretorIA is activated, Julinho failure is logged
        }
      } catch (julinhoError) {
        console.error('[Stripe Webhook] Error calling Julinho API:', julinhoError)
        // CorretorIA is still activated - don't block the user
      }

      // Send bundle activation email with Julinho CTA
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single()

        if (profile?.email) {
          await sendBundleActivationEmail({
            to: { email: profile.email, name: profile.full_name },
            name: profile.full_name,
            whatsappPhone,
          })
          console.log('[Stripe Webhook] Bundle activation email sent to:', profile.email)
        }
      } catch (emailError) {
        console.error('[Stripe Webhook] Failed to send bundle activation email:', emailError)
      }
    }
  }
}

/**
 * Handle invoice.paid event
 * Called when invoice is successfully paid
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('[Stripe Webhook] invoice.paid', invoice.id)

  const supabase = createServiceRoleClient()
  const subscriptionId = invoice.subscription as string
  const customerId = invoice.customer as string

  if (!subscriptionId) {
    console.log('[Stripe Webhook] Invoice is not for a subscription')
    return
  }

  // Get subscription from database
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!subscription) {
    console.error('[Stripe Webhook] Subscription not found:', subscriptionId)
    return
  }

  // Save payment transaction
  const { error: insertError } = await supabase
    .from('payment_transactions')
    .insert({
      subscription_id: subscription.id,
      user_id: subscription.user_id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_invoice_id: invoice.id,
      stripe_charge_id: invoice.charge as string,
      status: 'approved',
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency.toUpperCase(),
      payment_method: 'card',
      payment_type: 'subscription',
      paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
      webhook_data: invoice as any,
    })

  if (insertError) {
    console.error('[Stripe Webhook] Error inserting transaction:', insertError)
    throw insertError
  }

  // Activate subscription if first payment
  if (invoice.billing_reason === 'subscription_create') {
    const { error: activateError } = await supabase.rpc('activate_subscription', {
      p_user_id: subscription.user_id,
      p_subscription_id: subscription.id,
    })

    if (activateError) {
      console.error('[Stripe Webhook] Error activating subscription:', activateError)
      throw activateError
    }

    console.log('[Stripe Webhook] Subscription activated for user:', subscription.user_id)

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', subscription.user_id)
        .single()

      if (profile?.email) {
        await sendPremiumUpgradeEmail({
          to: { email: profile.email, name: profile.full_name },
          name: profile.full_name,
        })
      }
    } catch (emailError) {
      console.error('[Stripe Webhook] Failed to send premium upgrade email:', emailError)
    }
  }

  console.log('[Stripe Webhook] Invoice payment processed successfully')
}

/**
 * Handle invoice.payment_failed event
 * Called when invoice payment fails
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Stripe Webhook] invoice.payment_failed', invoice.id)

  const supabase = createServiceRoleClient()
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    return
  }

  // Get subscription from database
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!subscription) {
    console.error('[Stripe Webhook] Subscription not found:', subscriptionId)
    return
  }

  // Update profile to past_due
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.user_id)

  console.log('[Stripe Webhook] Subscription marked as past_due')
}

/**
 * Handle customer.subscription.updated event
 * Called when subscription is updated
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  console.log('[Stripe Webhook] customer.subscription.updated', subscription.id)

  const supabase = createServiceRoleClient()

  // Update subscription in database
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status as 'pending' | 'authorized' | 'paused' | 'canceled',
      next_payment_date: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (updateError) {
    console.error('[Stripe Webhook] Error updating subscription:', updateError)
    throw updateError
  }

  console.log('[Stripe Webhook] Subscription updated successfully')
}

/**
 * Handle customer.subscription.deleted event
 * Called when subscription is canceled
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  console.log('[Stripe Webhook] customer.subscription.deleted', subscription.id)

  const supabase = createServiceRoleClient()

  // Get subscription from database
  const { data: dbSubscription } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!dbSubscription) {
    console.error('[Stripe Webhook] Subscription not found:', subscription.id)
    return
  }

  // Cancel subscription
  const { error: cancelError } = await supabase.rpc('cancel_subscription', {
    p_user_id: dbSubscription.user_id,
    p_subscription_id: dbSubscription.id,
  })

  if (cancelError) {
    console.error('[Stripe Webhook] Error canceling subscription:', cancelError)
    throw cancelError
  }

  console.log('[Stripe Webhook] Subscription canceled for user:', dbSubscription.user_id)

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', dbSubscription.user_id)
      .single()

    if (profile?.email) {
      await sendCancellationEmail({
        to: { email: profile.email, name: profile.full_name },
        name: profile.full_name,
      })
    }
  } catch (emailError) {
    console.error('[Stripe Webhook] Failed to send cancellation email:', emailError)
  }
}

/**
 * Handle payment_intent.succeeded event for PIX payments
 * Called when PIX payment is confirmed
 */
export async function handlePixPaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('[Stripe Webhook] payment_intent.succeeded (PIX)', paymentIntent.id)

  const supabase = createServiceRoleClient()
  const userId = paymentIntent.metadata?.userId
  const planType = paymentIntent.metadata?.planType as 'monthly' | 'annual'

  if (!userId || !planType) {
    console.error('[Stripe Webhook] Missing userId or planType in payment intent metadata')
    return
  }

  try {
    // Update PIX payment status
    await supabase
      .from('pix_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id)

    // Create subscription record
    const stripe = (await import('./server')).stripe
    const { STRIPE_PRICES } = await import('./server')
    const priceId = planType === 'monthly' ? STRIPE_PRICES.MONTHLY : STRIPE_PRICES.ANNUAL

    // Create subscription after PIX payment
    const subscription = await stripe.subscriptions.create({
      customer: paymentIntent.customer as string,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card', 'pix'],
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        userId,
        paidVia: 'pix',
        initialPaymentIntentId: paymentIntent.id,
      },
    })

    // Save subscription to database
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: paymentIntent.customer as string,
        status: 'active',
        price_id: priceId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: false,
      })

    if (insertError) {
      console.error('[Stripe Webhook] Failed to insert subscription:', insertError)
      return
    }

    // Update user profile to pro
    await supabase
      .from('profiles')
      .update({
        plan_type: 'pro',
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // Send upgrade email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (profile?.email) {
      await sendPremiumUpgradeEmail({
        to: { email: profile.email, name: profile.full_name },
        name: profile.full_name,
      })
    }

    console.log('[Stripe Webhook] PIX payment processed successfully')
  } catch (error) {
    console.error('[Stripe Webhook] Error processing PIX payment:', error)
    throw error
  }
}

/**
 * Handle payment_intent.payment_failed event for PIX payments
 * Called when PIX payment fails or expires
 */
export async function handlePixPaymentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('[Stripe Webhook] payment_intent.payment_failed (PIX)', paymentIntent.id)

  const supabase = createServiceRoleClient()

  try {
    // Update PIX payment status
    await supabase
      .from('pix_payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id)

    console.log('[Stripe Webhook] PIX payment marked as failed')
  } catch (error) {
    console.error('[Stripe Webhook] Error updating failed PIX payment:', error)
  }
}

/**
 * Handle lifetime purchase (Black Friday promotion)
 * Called when customer completes one-time lifetime checkout
 */
export async function handleLifetimePaymentCompleted(
  session: Stripe.Checkout.Session
) {
  console.log('[Stripe Webhook] Lifetime payment completed', session.id)

  const supabase = createServiceRoleClient()
  const userId = session.metadata?.userId
  const guestEmail = session.metadata?.guestEmail
  const isGuestCheckout = session.metadata?.isGuestCheckout === 'true'
  const promoCode = session.metadata?.promoCode || 'BLACKFRIDAY2025'
  const paymentIntentId = session.payment_intent as string

  // Check if this payment was already processed (Stripe may retry webhooks)
  const { data: existingPurchase } = await supabase
    .from('lifetime_purchases')
    .select('id, status, user_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (existingPurchase) {
    console.log('[Stripe Webhook] Lifetime purchase already exists:', existingPurchase.id)

    // If already completed, nothing to do
    if (existingPurchase.status === 'completed') {
      console.log('[Stripe Webhook] Purchase already completed, skipping')
      return
    }

    // If pending and has a user, try to activate
    if (existingPurchase.status === 'pending' && existingPurchase.user_id) {
      console.log('[Stripe Webhook] Activating existing pending purchase')
      const { error: activateError } = await supabase.rpc('activate_lifetime_plan', {
        p_user_id: existingPurchase.user_id,
        p_purchase_id: existingPurchase.id,
      })

      if (activateError) {
        console.error('[Stripe Webhook] Error activating lifetime plan:', activateError)
      } else {
        console.log('[Stripe Webhook] Lifetime plan activated for user:', existingPurchase.user_id)
      }
    }
    return
  }

  // For guest checkouts, we need to handle differently
  if (isGuestCheckout && guestEmail && !userId) {
    console.log('[Stripe Webhook] Guest lifetime purchase detected:', guestEmail)

    // Store in a pending state - will be linked when user registers
    const { error: insertError } = await supabase
      .from('lifetime_purchases')
      .insert({
        user_id: null, // Will be linked later
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        amount: (session.amount_total || 9990) / 100,
        currency: session.currency?.toUpperCase() || 'BRL',
        payment_method: 'stripe_card',
        status: 'pending', // Pending until linked to user
        promo_code: promoCode,
      })

    if (insertError) {
      console.error('[Stripe Webhook] Error inserting guest lifetime purchase:', insertError)
    }

    console.log('[Stripe Webhook] Guest lifetime purchase saved. Will be activated when user registers.')
    return
  }

  // Authenticated user checkout
  if (!userId) {
    console.error('[Stripe Webhook] Missing userId for authenticated lifetime checkout')
    return
  }

  try {
    // Create lifetime purchase record
    const { data: purchase, error: insertError } = await supabase
      .from('lifetime_purchases')
      .insert({
        user_id: userId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        amount: (session.amount_total || 9990) / 100,
        currency: session.currency?.toUpperCase() || 'BRL',
        payment_method: 'stripe_card',
        status: 'pending',
        promo_code: promoCode,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Stripe Webhook] Error inserting lifetime purchase:', insertError)
      throw insertError
    }

    // Activate lifetime plan
    const { error: activateError } = await supabase.rpc('activate_lifetime_plan', {
      p_user_id: userId,
      p_purchase_id: purchase.id,
    })

    if (activateError) {
      console.error('[Stripe Webhook] Error activating lifetime plan:', activateError)
      throw activateError
    }

    console.log('[Stripe Webhook] Lifetime plan activated for user:', userId)

    // Send upgrade email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (profile?.email) {
      try {
        await sendPremiumUpgradeEmail({
          to: { email: profile.email, name: profile.full_name },
          name: profile.full_name,
        })
        console.log('[Stripe Webhook] Lifetime upgrade email sent to:', profile.email)
      } catch (emailError) {
        console.error('[Stripe Webhook] Failed to send lifetime upgrade email:', emailError)
      }
    }

    console.log('[Stripe Webhook] Lifetime purchase completed successfully')
  } catch (error) {
    console.error('[Stripe Webhook] Error processing lifetime payment:', error)
    throw error
  }
}
// @ts-nocheck
