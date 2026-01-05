/**
 * API Route: Cancel Mercado Pago Subscription
 * POST /api/mercadopago/cancel-subscription
 *
 * Cancels a user's subscription in both Mercado Pago and Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Tables, TablesUpdate } from '@/types/supabase'

export const maxDuration = 60

interface CancelSubscriptionRequest {
  userId: string
  subscriptionId?: string // Optional - will find active subscription if not provided
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CancelSubscriptionRequest = await request.json()
    const { userId, subscriptionId } = body

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Initialize clients
    const supabase = createServiceRoleClient()
    const mpClient = getMercadoPagoClient()

    // Find subscription
    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (subscriptionId) {
      query = query.eq('id', subscriptionId)
    } else {
      // Find active subscription
      query = query.in('status', ['pending', 'authorized', 'paused'])
    }

    const { data: subscription, error: findError } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single<Tables<'subscriptions'>>()

    if (findError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found for this user' },
        { status: 404 }
      )
    }

    if (!subscription.mp_subscription_id) {
      return NextResponse.json(
        { error: 'Subscription has no Mercado Pago ID' },
        { status: 400 }
      )
    }

    // Cancel subscription in Mercado Pago
    try {
      await mpClient.cancelSubscription(subscription.mp_subscription_id)
    } catch (mpError) {
      console.error('Error canceling subscription in MP:', mpError)
      // Continue with local cancellation even if MP fails
    }

    // Cancel subscription in database using the function
    const { error: cancelError } = await supabase.rpc('cancel_subscription', {
      p_user_id: userId,
      p_subscription_id: subscription.id,
    })

    if (cancelError) {
      console.error('Error canceling subscription in database:', cancelError)
      return NextResponse.json(
        { error: 'Failed to cancel subscription', details: cancelError.message },
        { status: 500 }
      )
    }

    // Get updated subscription data
    const { data: updatedSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription.id)
      .single<Tables<'subscriptions'>>()

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription canceled successfully',
        subscription: {
          id: updatedSubscription?.id,
          status: updatedSubscription?.status,
          endDate: updatedSubscription?.end_date,
        },
        accessUntil: updatedSubscription?.end_date,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error canceling subscription:', error)

    return NextResponse.json(
      {
        error: 'Failed to cancel subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET method to check if user can cancel
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Find active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('id, status, mp_subscription_id, end_date')
      .eq('user_id', userId)
      .in('status', ['pending', 'authorized', 'paused'])
      .single<Tables<'subscriptions'>>()

    if (error || !subscription) {
      return NextResponse.json(
        {
          canCancel: false,
          reason: 'No active subscription found',
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        canCancel: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          mpSubscriptionId: subscription.mp_subscription_id,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking cancellation eligibility:', error)

    return NextResponse.json(
      { error: 'Failed to check cancellation status' },
      { status: 500 }
    )
  }
}
