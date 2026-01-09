import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, isRedisAvailable } from "@/utils/redis-client"
import { GUEST_DAILY_LIMIT } from "@/utils/constants"

/**
 * Guest Daily Rate Limiter
 * Limits guest (unauthenticated) users to a fixed number of operations per day
 * Uses IP address as identifier with Redis storage and in-memory fallback
 */

interface DailyRateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store as fallback when Redis is unavailable
const memoryStore = new Map<string, DailyRateLimitEntry>()

// Cleanup interval for memory store (every hour)
const CLEANUP_INTERVAL = 60 * 60 * 1000

if (typeof setInterval !== 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime) {
        memoryStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

/**
 * Calculate reset time (next day at 00:00 UTC)
 */
function getDailyResetTime(): number {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))
  return tomorrow.getTime()
}

/**
 * Get current day key suffix (YYYY-MM-DD format)
 */
function getDayKey(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * In-memory daily rate limiter fallback
 */
async function memoryDailyRateLimit(key: string, limit: number): Promise<{
  allowed: boolean
  remaining: number
  used: number
  resetTime: number
}> {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    const resetTime = getDailyResetTime()
    memoryStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, used: 1, resetTime }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, used: entry.count, resetTime: entry.resetTime }
  }

  // Increment count
  entry.count++
  return { allowed: true, remaining: limit - entry.count, used: entry.count, resetTime: entry.resetTime }
}

/**
 * Redis-based daily rate limiter
 */
async function redisDailyRateLimit(key: string, limit: number): Promise<{
  allowed: boolean
  remaining: number
  used: number
  resetTime: number
}> {
  const redis = getRedisClient()
  if (!redis) {
    return memoryDailyRateLimit(key, limit)
  }

  try {
    const resetTime = getDailyResetTime()
    const ttl = Math.ceil((resetTime - Date.now()) / 1000)

    const current = await redis.incr(key)

    if (current === 1) {
      // First request of the day, set expiration
      await redis.expire(key, ttl)
    }

    const allowed = current <= limit
    const remaining = Math.max(0, limit - current)

    return { allowed, remaining, used: current, resetTime }
  } catch (error) {
    console.error('Redis daily rate limit error:', error)
    return memoryDailyRateLimit(key, limit)
  }
}

/**
 * Check if guest has remaining daily operations
 * Returns null if allowed, NextResponse with 429 if limit exceeded
 */
export async function checkGuestDailyLimit(
  req: NextRequest
): Promise<NextResponse | null> {
  try {
    // Get client IP
    const ip = req.ip || req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"
    const dayKey = getDayKey()
    const key = `guest-daily:${ip}:${dayKey}`

    // Check rate limit
    const result = isRedisAvailable()
      ? await redisDailyRateLimit(key, GUEST_DAILY_LIMIT)
      : await memoryDailyRateLimit(key, GUEST_DAILY_LIMIT)

    if (!result.allowed) {
      const resetDate = new Date(result.resetTime)
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)

      console.warn(`Guest daily limit exceeded for IP ${ip} (${result.used}/${GUEST_DAILY_LIMIT})`)

      return NextResponse.json(
        {
          error: "Limite diário excedido",
          message: "Você atingiu o limite de usos gratuitos hoje.",
          details: [
            `Limite: ${GUEST_DAILY_LIMIT} usos por dia`,
            "Crie uma conta gratuita para 3 usos por dia",
            "Ou faça upgrade para o plano Pro para uso ilimitado"
          ],
          remaining: 0,
          limit: GUEST_DAILY_LIMIT,
          resetAt: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': GUEST_DAILY_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          }
        }
      )
    }

    return null // Allow request
  } catch (error) {
    console.error('Guest daily rate limiter error:', error)
    return null // Allow in case of error (fail open)
  }
}

/**
 * Get guest's current daily usage without incrementing
 * Useful for displaying remaining uses to the user
 */
export async function getGuestDailyUsage(
  req: NextRequest
): Promise<{ used: number; remaining: number; limit: number; resetAt: string }> {
  try {
    const ip = req.ip || req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"
    const dayKey = getDayKey()
    const key = `guest-daily:${ip}:${dayKey}`
    const resetTime = getDailyResetTime()

    const redis = getRedisClient()
    let used = 0

    if (redis && isRedisAvailable()) {
      const current = await redis.get(key)
      used = typeof current === 'number' ? current : parseInt(current as string) || 0
    } else {
      const entry = memoryStore.get(key)
      used = entry?.count || 0
    }

    return {
      used,
      remaining: Math.max(0, GUEST_DAILY_LIMIT - used),
      limit: GUEST_DAILY_LIMIT,
      resetAt: new Date(resetTime).toISOString(),
    }
  } catch (error) {
    console.error('Error getting guest daily usage:', error)
    return {
      used: 0,
      remaining: GUEST_DAILY_LIMIT,
      limit: GUEST_DAILY_LIMIT,
      resetAt: new Date(getDailyResetTime()).toISOString(),
    }
  }
}
