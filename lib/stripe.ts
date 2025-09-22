import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const getStripe = () => {
  if (typeof window === 'undefined') return null

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'

  if (!window.stripePromise) {
    window.stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) =>
      loadStripe(publishableKey)
    )
  }

  return window.stripePromise
}

declare global {
  interface Window {
    stripePromise?: Promise<any>
  }
}