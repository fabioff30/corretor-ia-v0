import { type NextRequest, NextResponse } from "next/server"
import { getUserFeatureUsage, getUserPlanDetails } from "@/utils/feature-limits"
import { cookies } from "next/headers"
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Function to get user ID from headers/cookies
const getUserId = (request: NextRequest): string | null => {
  // Try to get from header first
  const userId = request.headers.get("x-user-id")
  if (userId) return userId

  // Try to get from cookie if not in header
  const cookieStore = cookies()
  const userCookie = cookieStore.get('user-id')
  return userCookie?.value || null
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      )
    }

    // Get user's feature usage
    const usage = await getUserFeatureUsage(userId)

    // Get user's plan details
    const planDetails = await getUserPlanDetails(userId)

    // Get user's subscription info
    let subscriptionInfo = null
    if (supabaseServiceKey) {
      const supabaseAdmin = createClient<Database>(
        supabaseUrl,
        supabaseServiceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          subscription_plans!plan_id (
            name,
            display_name,
            description
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (subscription && subscription.subscription_plans) {
        subscriptionInfo = {
          planName: subscription.subscription_plans.display_name,
          planId: subscription.plan_id,
          billingPeriod: subscription.billing_period,
          status: subscription.status
        }
      }
    }

    // If no subscription, default to free plan
    if (!subscriptionInfo) {
      subscriptionInfo = {
        planName: 'Grátis',
        planId: null,
        billingPeriod: 'monthly',
        status: 'active'
      }
    }

    return NextResponse.json({
      usage,
      planDetails,
      subscription: subscriptionInfo
    })
  } catch (error) {
    console.error('Error fetching user usage:', error)
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    )
  }
}