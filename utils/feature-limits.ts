import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export type FeatureName = 'corrections' | 'rewrites' | 'ai_analysis' | 'humanization' | 'julinho_ai'

export interface FeatureLimitCheck {
  allowed: boolean
  reason: string
  daily_limit?: number | null
  monthly_limit?: number | null
  daily_used: number
  monthly_used: number
  plan_name?: string
}

/**
 * Checks if a user can use a specific feature based on their plan limits
 */
export async function checkFeatureLimit(
  userId: string,
  featureName: FeatureName
): Promise<FeatureLimitCheck> {
  try {
    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return {
        allowed: false,
        reason: 'Configuration error',
        daily_used: 0,
        monthly_used: 0
      }
    }

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

    // Call the database function to check limits
    const { data, error } = await supabaseAdmin.rpc('check_user_feature_limit', {
      p_user_id: userId,
      p_feature_name: featureName
    })

    if (error) {
      console.error('Error checking feature limit:', error)
      return {
        allowed: false,
        reason: 'Error checking limits',
        daily_used: 0,
        monthly_used: 0
      }
    }

    // Parse the JSON response
    const result = data as FeatureLimitCheck
    return result
  } catch (error) {
    console.error('Failed to check feature limit:', error)
    return {
      allowed: false,
      reason: 'System error',
      daily_used: 0,
      monthly_used: 0
    }
  }
}

/**
 * Records usage of a feature for a user
 */
export async function recordFeatureUsage(
  userId: string,
  featureName: FeatureName,
  count: number = 1
): Promise<boolean> {
  try {
    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return false
    }

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

    const { data, error } = await supabaseAdmin.rpc('record_feature_usage', {
      p_user_id: userId,
      p_feature_name: featureName,
      p_count: count
    })

    if (error) {
      console.error('Error recording feature usage:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Failed to record feature usage:', error)
    return false
  }
}

/**
 * Gets the current user's plan details including features and limits
 */
export async function getUserPlanDetails(userId: string) {
  try {
    if (!supabaseServiceKey) {
      return null
    }

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

    // Get user's active subscription with plan details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        subscription_plans!plan_id (
          id,
          name,
          display_name,
          description,
          priority
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (subError || !subscription) {
      // If no active subscription, get free plan details
      const { data: freePlan } = await supabaseAdmin
        .from('plan_summary')
        .select('*')
        .eq('plan_name', 'free')
        .single()

      return freePlan
    }

    // Get plan details from view
    const { data: planDetails } = await supabaseAdmin
      .from('plan_summary')
      .select('*')
      .eq('plan_id', subscription.plan_id)
      .single()

    return planDetails
  } catch (error) {
    console.error('Failed to get user plan details:', error)
    return null
  }
}

/**
 * Gets usage statistics for a user across all features
 */
export async function getUserFeatureUsage(userId: string) {
  try {
    if (!supabaseServiceKey) {
      return {}
    }

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

    const features: FeatureName[] = ['corrections', 'rewrites', 'ai_analysis', 'humanization', 'julinho_ai']
    const usage: Record<string, FeatureLimitCheck> = {}

    // Check limits for each feature
    for (const feature of features) {
      const limitCheck = await checkFeatureLimit(userId, feature)
      usage[feature] = limitCheck
    }

    return usage
  } catch (error) {
    console.error('Failed to get user feature usage:', error)
    return {}
  }
}

/**
 * Checks if user has a premium plan (pro or plus)
 */
export async function isUserPremium(userId: string): Promise<boolean> {
  try {
    if (!supabaseServiceKey) {
      return false
    }

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

    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return data?.plan === 'pro' || data?.plan === 'plus' || data?.plan === 'premium'
  } catch (error) {
    console.error('Error checking premium status:', error)
    return false
  }
}