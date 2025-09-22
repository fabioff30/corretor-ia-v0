import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, isRedisAvailable } from "@/utils/redis-client"
import { HUMANIZE_LIMITS } from "@/utils/constants"

/**
 * Humanization Rate Limiting
 * Implements specific usage limits for the humanization feature:
 * - Free users: 1 use per month
 * - Premium users: 2 uses per day
 */

interface HumanizeUsageEntry {
  count: number
  resetTime: number
  period: string // YYYY-MM or YYYY-MM-DD
}

// In-memory fallback store
const memoryStore = new Map<string, HumanizeUsageEntry>()

// Cleanup expired entries every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime) {
        memoryStore.delete(key)
      }
    }
  }, 60 * 60 * 1000) // 1 hour
}

/**
 * Get current period string based on user type
 */
function getCurrentPeriod(isPremium: boolean): string {
  const now = new Date()
  if (isPremium) {
    // Daily period for premium users: YYYY-MM-DD
    return now.toISOString().split('T')[0]
  } else {
    // Monthly period for free users: YYYY-MM
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }
}

/**
 * Get reset time for the current period
 */
function getResetTime(isPremium: boolean): number {
  const now = new Date()

  if (isPremium) {
    // Reset at end of day for premium users
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow.getTime()
  } else {
    // Reset at end of month for free users
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return nextMonth.getTime()
  }
}

/**
 * Get user identifier for rate limiting
 */
function getUserIdentifier(request: NextRequest, isPremium: boolean): string {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

  if (isPremium) {
    // For premium users, try to get user ID from headers
    const userId = request.headers.get("x-user-id") || ip
    return userId
  } else {
    // For free users, use IP only
    return ip
  }
}

/**
 * Check if user is premium based on headers
 */
function isPremiumUser(request: NextRequest): boolean {
  const isPremium = request.headers.get("x-user-premium") === "true"
  const userPlan = request.headers.get("x-user-plan")
  return isPremium || userPlan === "premium"
}

/**
 * Memory-based rate limiter fallback
 */
async function memoryHumanizeRateLimit(
  key: string,
  limit: number,
  period: string,
  resetTime: number
): Promise<{ allowed: boolean; usage: number; resetTime: number }> {
  const entry = memoryStore.get(key)
  const now = Date.now()

  if (!entry || entry.period !== period || now > entry.resetTime) {
    // Create new entry or reset for new period
    const newEntry: HumanizeUsageEntry = { count: 1, resetTime, period }
    memoryStore.set(key, newEntry)
    return { allowed: true, usage: 1, resetTime }
  }

  if (entry.count >= limit) {
    return { allowed: false, usage: entry.count, resetTime: entry.resetTime }
  }

  // Increment usage
  entry.count++
  return { allowed: true, usage: entry.count, resetTime: entry.resetTime }
}

/**
 * Redis-based rate limiter
 */
async function redisHumanizeRateLimit(
  key: string,
  limit: number,
  period: string,
  resetTime: number
): Promise<{ allowed: boolean; usage: number; resetTime: number }> {
  const redis = getRedisClient()
  if (!redis) {
    return await memoryHumanizeRateLimit(key, limit, period, resetTime)
  }

  try {
    // Use a hash to store both count and period info
    const hashKey = `humanize:${key}`
    const periodKey = 'period'
    const countKey = 'count'

    // Get current period and count
    const result = await redis.hmget(hashKey, periodKey, countKey)
    const [currentPeriod, currentCount] = Array.isArray(result) ? result : [null, null]

    if (!currentPeriod || currentPeriod !== period) {
      // New period, reset counter
      await redis.hmset(hashKey, periodKey, period, countKey, '1')
      await redis.expire(hashKey, Math.ceil((resetTime - Date.now()) / 1000))
      return { allowed: true, usage: 1, resetTime }
    }

    const count = parseInt(currentCount || '0', 10)

    if (count >= limit) {
      return { allowed: false, usage: count, resetTime }
    }

    // Increment counter
    const newCount = await redis.hincrby(hashKey, countKey, 1)
    return { allowed: true, usage: newCount, resetTime }

  } catch (error) {
    console.error('Redis humanize rate limit error:', error)
    // Fall back to memory-based rate limiting
    return await memoryHumanizeRateLimit(key, limit, period, resetTime)
  }
}

/**
 * Main humanization rate limiter
 */
export async function humanizeRateLimiter(request: NextRequest) {
  try {
    const isPremium = isPremiumUser(request)
    const userIdentifier = getUserIdentifier(request, isPremium)
    const period = getCurrentPeriod(isPremium)
    const resetTime = getResetTime(isPremium)

    // Set limits based on user type
    const limit = isPremium ? HUMANIZE_LIMITS.PREMIUM_USES_PER_DAY : HUMANIZE_LIMITS.FREE_USES_PER_MONTH

    // Create rate limiting key
    const keyPrefix = isPremium ? 'premium' : 'free'
    const key = `${keyPrefix}:${userIdentifier}:${period}`

    // Check rate limit
    const result = isRedisAvailable()
      ? await redisHumanizeRateLimit(key, limit, period, resetTime)
      : await memoryHumanizeRateLimit(key, limit, period, resetTime)

    if (!result.allowed) {
      // Log rate limit hit for monitoring
      console.warn(`Humanize rate limit exceeded for ${isPremium ? 'premium' : 'free'} user: ${userIdentifier}`)

      // Calculate time until reset in a human-readable format
      const timeUntilReset = result.resetTime - Date.now()
      const hoursUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60))
      const daysUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60 * 24))

      const resetMessage = isPremium
        ? `Tente novamente em ${hoursUntilReset} hora(s)`
        : `Tente novamente em ${daysUntilReset} dia(s)`

      return NextResponse.json(
        {
          error: "Limite de uso excedido",
          message: `Você atingiu o limite de ${limit} ${isPremium ? 'uso(s) por dia' : 'uso por mês'} da funcionalidade de humanização. ${resetMessage}`,
          usage: {
            current: result.usage,
            limit,
            resetTime: result.resetTime,
            period: isPremium ? 'daily' : 'monthly',
            isPremium
          },
          upgradeMessage: isPremium ? null : "Upgrade para CorretorIA Pro e tenha 2 usos por dia!"
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(timeUntilReset / 1000).toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': Math.max(0, limit - result.usage).toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'X-RateLimit-Period': isPremium ? 'daily' : 'monthly',
          }
        }
      )
    }

    // Add usage info to request headers for the API route
    const response = NextResponse.next()
    response.headers.set('X-Humanize-Usage', result.usage.toString())
    response.headers.set('X-Humanize-Limit', limit.toString())
    response.headers.set('X-Humanize-Remaining', Math.max(0, limit - result.usage).toString())
    response.headers.set('X-Humanize-Reset', result.resetTime.toString())

    return null // Allow request

  } catch (error) {
    console.error('Humanize rate limiter error:', error)

    // In case of error, allow request in development, be conservative in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error: "Serviço temporariamente indisponível",
          message: "Tente novamente em alguns minutos"
        },
        { status: 503 }
      )
    }

    return null // Allow in development
  }
}

/**
 * Get current usage information for a user
 */
export async function getHumanizeUsage(request: NextRequest): Promise<{
  usage: number;
  limit: number;
  remaining: number;
  resetTime: number;
  period: 'daily' | 'monthly';
  isPremium: boolean;
}> {
  const isPremium = isPremiumUser(request)
  const userIdentifier = getUserIdentifier(request, isPremium)
  const period = getCurrentPeriod(isPremium)
  const resetTime = getResetTime(isPremium)
  const limit = isPremium ? HUMANIZE_LIMITS.PREMIUM_USES_PER_DAY : HUMANIZE_LIMITS.FREE_USES_PER_MONTH

  try {
    if (isRedisAvailable()) {
      const redis = getRedisClient()
      if (redis) {
        const keyPrefix = isPremium ? 'premium' : 'free'
        const key = `${keyPrefix}:${userIdentifier}:${period}`
        const hashKey = `humanize:${key}`

        const result = await redis.hmget(hashKey, 'period', 'count')
        const [currentPeriod, currentCount] = Array.isArray(result) ? result : [null, null]

        if (!currentPeriod || currentPeriod !== period) {
          // New period or no usage yet
          return {
            usage: 0,
            limit,
            remaining: limit,
            resetTime,
            period: isPremium ? 'daily' : 'monthly',
            isPremium
          }
        }

        const usage = parseInt(currentCount || '0', 10)
        return {
          usage,
          limit,
          remaining: Math.max(0, limit - usage),
          resetTime,
          period: isPremium ? 'daily' : 'monthly',
          isPremium
        }
      }
    }

    // Fallback to memory store
    const keyPrefix = isPremium ? 'premium' : 'free'
    const key = `${keyPrefix}:${userIdentifier}:${period}`
    const entry = memoryStore.get(key)

    if (!entry || entry.period !== period || Date.now() > entry.resetTime) {
      return {
        usage: 0,
        limit,
        remaining: limit,
        resetTime,
        period: isPremium ? 'daily' : 'monthly',
        isPremium
      }
    }

    return {
      usage: entry.count,
      limit,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime,
      period: isPremium ? 'daily' : 'monthly',
      isPremium
    }

  } catch (error) {
    console.error('Error getting humanize usage:', error)
    // Return safe defaults
    return {
      usage: 0,
      limit,
      remaining: limit,
      resetTime,
      period: isPremium ? 'daily' : 'monthly',
      isPremium
    }
  }
}