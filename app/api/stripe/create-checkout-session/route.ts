import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_1S9X2yAaDWyHAlqlrzwldZn6',
  pro_annual: 'price_1S9X31AaDWyHAlql6RKNkF1l',
  plus_monthly: 'price_1S9X36AaDWyHAlqlkNtcTERW',
  plus_annual: 'price_1S9X39AaDWyHAlql332ABbLk',
}

export async function POST(request: NextRequest) {
  try {
    const { priceId, billingCycle, planType } = await request.json()

    if (!priceId || !billingCycle || !planType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const cookieStore = cookies()

    // Get user ID from cookie/header
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user data from database
    const { data: user, error: authError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create or retrieve Stripe customer
    let customerId: string

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save Stripe customer ID to database
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/dashboard?success=true`,
      cancel_url: `${request.nextUrl.origin}/precos?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        billing_cycle: billingCycle,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}