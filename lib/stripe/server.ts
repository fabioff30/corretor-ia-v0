/**
 * Stripe Server Library
 * Server-side Stripe SDK and helper functions
 */

import Stripe from 'stripe'
import { getServerConfig } from '@/utils/env-config'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Initialize Stripe SDK
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

// Price IDs from Stripe Dashboard (Production Mode)
export const STRIPE_PRICES = {
  MONTHLY: 'price_1SKPXfAaDWyHAlqlOF5UHXPK', // R$ 29,90/mês (Production)
  ANNUAL: 'price_1SKPXfAaDWyHAlqlcmk9Zcfx',  // R$ 299/ano (Production)
  LIFETIME: 'price_1SX9iCAaDWyHAlqlcLPoTjZy', // R$ 99,90 Black Friday (Production)
} as const

// Lifetime (Black Friday) product configuration
export const STRIPE_LIFETIME = {
  PRODUCT_ID: 'prod_TU7ypXVwPaSvkH',
  PRICE_ID: 'price_1SX9iCAaDWyHAlqlcLPoTjZy',
  AMOUNT: 9990, // R$ 99,90 in cents
} as const

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string | null,
  email: string
): Promise<string> {
  const supabase = createServiceRoleClient()

  // For authenticated users, check if customer already exists
  if (userId) {
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (existingCustomer?.stripe_customer_id) {
      return existingCustomer.stripe_customer_id
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: userId ? { userId } : { guestEmail: email },
  })

  // Save to database only if userId exists
  if (userId) {
    await supabase
      .from('stripe_customers')
      .insert({
        user_id: userId,
        stripe_customer_id: customer.id,
        email,
      })
  }

  return customer.id
}

/**
 * Create a Checkout Session for subscription
 */
export async function createCheckoutSession(
  userId: string | null,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  isGuestCheckout: boolean = false,
  couponCode?: string
): Promise<Stripe.Checkout.Session> {
  // Get or create customer
  const customerId = await getOrCreateStripeCustomer(userId, email)

  // Prepare metadata
  const metadata = userId
    ? { userId }
    : { guestEmail: email, isGuestCheckout: 'true' }

  // Create checkout session
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: customerId, // Customer already has email associated, so don't pass customer_email
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
    allow_promotion_codes: !couponCode, // Disable if coupon is provided directly
    billing_address_collection: 'auto',
  }

  // Add coupon if provided
  if (couponCode) {
    sessionConfig.discounts = [{
      coupon: couponCode,
    }]
  }

  const session = await stripe.checkout.sessions.create(sessionConfig)

  console.log('[Stripe] Checkout session created:', {
    sessionId: session.id,
    isGuest: isGuestCheckout,
    email,
  })

  return session
}

/**
 * Create a Customer Portal session for self-service
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    return null
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Get customer's active subscriptions
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 100,
  })

  return subscriptions.data
}

/**
 * Create a Payment Intent for PIX payment
 */
export async function createPixPaymentIntent(
  customerId: string,
  amount: number,
  planType: 'monthly' | 'annual',
  userId: string,
  userEmail: string
): Promise<Stripe.PaymentIntent> {
  const description = planType === 'monthly'
    ? 'CorretorIA Premium - Plano Mensal'
    : 'CorretorIA Premium - Plano Anual'

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

  return paymentIntent
}

/**
 * Get PIX payment details (QR Code and PIX Code)
 */
export async function getPixPaymentDetails(
  paymentIntentId: string
): Promise<{ qrCode: string; pixCode: string } | null> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      {
        expand: ['payment_method'],
      }
    )

    if (paymentIntent.next_action?.type === 'display_pix_qr_code') {
      const pixData = paymentIntent.next_action.display_pix_qr_code
      return {
        qrCode: pixData.qr_code, // Base64 encoded QR code image
        pixCode: pixData.text,    // PIX copy-paste code
      }
    }

    return null
  } catch (error) {
    console.error('Error getting PIX details:', error)
    return null
  }
}

/**
 * Check if a payment intent was paid
 */
export async function checkPaymentIntentStatus(
  paymentIntentId: string
): Promise<{ status: string; paid: boolean }> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  return {
    status: paymentIntent.status,
    paid: paymentIntent.status === 'succeeded',
  }
}

/**
 * Create subscription after PIX payment confirmation
 */
export async function createSubscriptionAfterPixPayment(
  customerId: string,
  priceId: string,
  userId: string
): Promise<Stripe.Subscription> {
  // Create subscription with immediate payment (already paid via PIX)
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      payment_method_types: ['card', 'pix'],
      save_default_payment_method: 'on_subscription',
    },
    metadata: {
      userId,
      paidVia: 'pix',
    },
  })

  return subscription
}

/**
 * Create a Checkout Session for lifetime purchase (one-time payment)
 * Used for Black Friday promotion
 */
export async function createLifetimeCheckoutSession(
  userId: string | null,
  email: string,
  successUrl: string,
  cancelUrl: string,
  isGuestCheckout: boolean = false
): Promise<Stripe.Checkout.Session> {
  // Get or create customer
  const customerId = await getOrCreateStripeCustomer(userId, email)

  // Prepare metadata
  const metadata = userId
    ? { userId, purchaseType: 'lifetime', promoCode: 'BLACKFRIDAY2024' }
    : { guestEmail: email, isGuestCheckout: 'true', purchaseType: 'lifetime', promoCode: 'BLACKFRIDAY2024' }

  // Create checkout session for one-time payment
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'payment', // One-time payment, not subscription
    payment_method_types: ['card'],
    line_items: [
      {
        price: STRIPE_LIFETIME.PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: {
      metadata,
    },
    billing_address_collection: 'auto',
    // Enable installments for Brazilian cards
    payment_method_options: {
      card: {
        installments: {
          enabled: true,
        },
      },
    },
  }

  const session = await stripe.checkout.sessions.create(sessionConfig)

  console.log('[Stripe] Lifetime checkout session created:', {
    sessionId: session.id,
    isGuest: isGuestCheckout,
    email,
  })

  return session
}
