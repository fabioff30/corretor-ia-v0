/**
 * Stripe Webhook Handlers
 * Process Stripe webhook events and update database
 */

import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendCancellationEmail, sendPremiumUpgradeEmail } from '@/lib/email/send'

/**
 * Handle checkout.session.completed event
 * Called when customer completes checkout
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  console.log('[Stripe Webhook] checkout.session.completed', session.id)

  const supabase = createServiceRoleClient()
  const userId = session.metadata?.userId
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!userId || !subscriptionId) {
    console.error('[Stripe Webhook] Missing userId or subscriptionId')
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
        is_pro: true,
        plan_type: 'premium',
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
