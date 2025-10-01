import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, isRedisAvailable } from "@/utils/redis-client"

/**
 * Daily Rate Limiter
 * Limits requests to once per 24 hours per identifier
 */

interface DailyRateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store as fallback
const memoryStore = new Map<string, DailyRateLimitEntry>()

/**
 * Calculate reset time (next day at midnight UTC)
 */
function getResetTime(): number {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  return tomorrow.getTime()
}

/**
 * In-memory daily rate limiter fallback
 */
async function memoryDailyRateLimit(key: string, limit: number): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
}> {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    const resetTime = getResetTime()
    memoryStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  // Increment count
  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}

/**
 * Redis-based daily rate limiter
 */
async function redisDailyRateLimit(key: string, limit: number): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
}> {
  const redis = getRedisClient()
  if (!redis) {
    return memoryDailyRateLimit(key, limit)
  }

  try {
    const resetTime = getResetTime()
    const ttl = Math.ceil((resetTime - Date.now()) / 1000)

    const current = await redis.incr(key)

    if (current === 1) {
      // First request, set expiration to end of day
      await redis.expire(key, ttl)
    }

    const allowed = current <= limit
    const remaining = Math.max(0, limit - current)

    return { allowed, remaining, resetTime }
  } catch (error) {
    console.error('Redis daily rate limit error:', error)
    return memoryDailyRateLimit(key, limit)
  }
}

/**
 * Main daily rate limiter function
 */
export async function dailyRateLimiter(
  req: NextRequest,
  identifier: string,
  limit: number = 1
): Promise<NextResponse | null> {
  try {
    // Get client identifier
    const ip = req.ip || req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"
    const key = `daily-rate-limit:${identifier}:${ip}`

    // Check rate limit
    const result = isRedisAvailable()
      ? await redisDailyRateLimit(key, limit)
      : await memoryDailyRateLimit(key, limit)

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
      const resetDate = new Date(result.resetTime)

      console.warn(`Daily rate limit exceeded for ${ip} on ${identifier}`)

      return NextResponse.json(
        {
          error: "Daily limit exceeded",
          message: "Você já utilizou sua análise gratuita hoje. Volte amanhã para uma nova análise.",
          retryAfter,
          resetAt: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          }
        }
      )
    }

    return null // Allow request
  } catch (error) {
    console.error('Daily rate limiter error:', error)
    return null // Allow in case of error
  }
}
