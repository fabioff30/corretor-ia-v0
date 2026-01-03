import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { FREE_WEEKLY_LIMIT } from "@/utils/constants"

/**
 * Free User Weekly Rate Limiter
 * Limits free users to a fixed number of operations (corrections + rewrites) per week
 * Uses Supabase for storage, aggregating daily usage into weekly totals
 */

/**
 * Get the start of the current week (Monday 00:00 UTC)
 */
function getWeekStart(): Date {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  // Adjust to Monday (0 = Sunday, 1 = Monday, etc.)
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const weekStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysToSubtract,
    0, 0, 0, 0
  ))

  return weekStart
}

/**
 * Get the start of next week (next Monday 00:00 UTC)
 */
function getWeeklyResetTime(): Date {
  const weekStart = getWeekStart()
  const nextWeek = new Date(weekStart)
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7)
  return nextWeek
}

export interface WeeklyUsageResult {
  allowed: boolean
  used: number
  remaining: number
  limit: number
  resetAt: string
  reason?: string
}

/**
 * Get weekly usage for a free user by summing daily records
 */
async function getWeeklyUsage(userId: string): Promise<{ used: number; error?: string }> {
  const supabase = createServiceRoleClient()
  const weekStart = getWeekStart()
  const weekStartStr = weekStart.toISOString().split('T')[0]

  try {
    // Sum corrections_used and rewrites_used for all days in the current week
    const { data, error } = await supabase
      .from('usage_limits')
      .select('corrections_used, rewrites_used')
      .eq('user_id', userId)
      .gte('date', weekStartStr)

    if (error) {
      console.error('Error fetching weekly usage:', error)
      return { used: 0, error: error.message }
    }

    // Sum all corrections and rewrites for the week
    const totalUsed = (data || []).reduce((sum, record) => {
      return sum + (record.corrections_used || 0) + (record.rewrites_used || 0)
    }, 0)

    return { used: totalUsed }
  } catch (error) {
    console.error('Error calculating weekly usage:', error)
    return { used: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check if free user has remaining weekly operations
 * Returns null if allowed, NextResponse with 429 if limit exceeded
 */
export async function checkFreeWeeklyLimit(
  req: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  try {
    const { used, error } = await getWeeklyUsage(userId)

    if (error) {
      console.error('Error checking free weekly limit:', error)
      // Fail open - allow request if we can't check the limit
      return null
    }

    if (used >= FREE_WEEKLY_LIMIT) {
      const resetTime = getWeeklyResetTime()
      const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000)

      console.warn(`Free user weekly limit exceeded for ${userId} (${used}/${FREE_WEEKLY_LIMIT})`)

      return NextResponse.json(
        {
          error: "Limite semanal excedido",
          message: "Você atingiu o limite de usos desta semana.",
          details: [
            `Limite: ${FREE_WEEKLY_LIMIT} usos por semana (correções + reescritas)`,
            "Faça upgrade para o plano Pro para uso ilimitado",
            `Seu limite será renovado na segunda-feira`
          ],
          remaining: 0,
          used,
          limit: FREE_WEEKLY_LIMIT,
          resetAt: resetTime.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': FREE_WEEKLY_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.getTime().toString(),
          }
        }
      )
    }

    return null // Allow request
  } catch (error) {
    console.error('Free weekly rate limiter error:', error)
    return null // Allow in case of error (fail open)
  }
}

/**
 * Get free user's current weekly usage without incrementing
 * Useful for displaying remaining uses to the user
 */
export async function getFreeWeeklyUsage(userId: string): Promise<WeeklyUsageResult> {
  try {
    const { used, error } = await getWeeklyUsage(userId)
    const resetTime = getWeeklyResetTime()

    if (error) {
      return {
        allowed: true,
        used: 0,
        remaining: FREE_WEEKLY_LIMIT,
        limit: FREE_WEEKLY_LIMIT,
        resetAt: resetTime.toISOString(),
        reason: error,
      }
    }

    return {
      allowed: used < FREE_WEEKLY_LIMIT,
      used,
      remaining: Math.max(0, FREE_WEEKLY_LIMIT - used),
      limit: FREE_WEEKLY_LIMIT,
      resetAt: resetTime.toISOString(),
    }
  } catch (error) {
    console.error('Error getting free weekly usage:', error)
    return {
      allowed: true,
      used: 0,
      remaining: FREE_WEEKLY_LIMIT,
      limit: FREE_WEEKLY_LIMIT,
      resetAt: getWeeklyResetTime().toISOString(),
      reason: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
