import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, isRedisAvailable } from "@/utils/redis-client"
import { GUEST_MONTHLY_LIMIT } from "@/utils/constants"

/**
 * Guest Monthly Rate Limiter
 * Limits guest (unauthenticated) users to a fixed number of operations per month
 * Uses IP address as identifier with Redis storage and in-memory fallback
 */

interface MonthlyRateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store as fallback when Redis is unavailable
const memoryStore = new Map<string, MonthlyRateLimitEntry>()

// Cleanup interval for memory store (every hour)
const CLEANUP_INTERVAL = 60 * 60 * 1000

if (typeof setInterval !== 'undefined') {
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
 * Calculate reset time (first day of next month at 00:00 UTC)
 */
function getMonthlyResetTime(): number {
  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))
  return nextMonth.getTime()
}

/**
 * Get current month key suffix (YYYY-MM format)
 */
function getMonthKey(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * In-memory monthly rate limiter fallback
 */
async function memoryMonthlyRateLimit(key: string, limit: number): Promise<{
  allowed: boolean
  remaining: number
  used: number
  resetTime: number
}> {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    const resetTime = getMonthlyResetTime()
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
 * Redis-based monthly rate limiter
 */
async function redisMonthlyRateLimit(key: string, limit: number): Promise<{
  allowed: boolean
  remaining: number
  used: number
  resetTime: number
}> {
  const redis = getRedisClient()
  if (!redis) {
    return memoryMonthlyRateLimit(key, limit)
  }

  try {
    const resetTime = getMonthlyResetTime()
    const ttl = Math.ceil((resetTime - Date.now()) / 1000)

    const current = await redis.incr(key)

    if (current === 1) {
      // First request of the month, set expiration
      await redis.expire(key, ttl)
    }

    const allowed = current <= limit
    const remaining = Math.max(0, limit - current)

    return { allowed, remaining, used: current, resetTime }
  } catch (error) {
    console.error('Redis monthly rate limit error:', error)
    return memoryMonthlyRateLimit(key, limit)
  }
}

/**
 * Check if guest has remaining monthly operations
 * Returns null if allowed, NextResponse with 429 if limit exceeded
 */
export async function checkGuestMonthlyLimit(
  req: NextRequest
): Promise<NextResponse | null> {
  try {
    // Get client IP
    const ip = req.ip || req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"
    const monthKey = getMonthKey()
    const key = `guest-monthly:${ip}:${monthKey}`

    // Check rate limit
    const result = isRedisAvailable()
      ? await redisMonthlyRateLimit(key, GUEST_MONTHLY_LIMIT)
      : await memoryMonthlyRateLimit(key, GUEST_MONTHLY_LIMIT)

    if (!result.allowed) {
      const resetDate = new Date(result.resetTime)
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)

      console.warn(`Guest monthly limit exceeded for IP ${ip} (${result.used}/${GUEST_MONTHLY_LIMIT})`)

      return NextResponse.json(
        {
          error: "Limite mensal excedido",
          message: "Você atingiu o limite de usos gratuitos este mês.",
          details: [
            `Limite: ${GUEST_MONTHLY_LIMIT} usos por mês`,
            "Crie uma conta gratuita para 3 usos por semana",
            "Ou faça upgrade para o plano Pro para uso ilimitado"
          ],
          remaining: 0,
          limit: GUEST_MONTHLY_LIMIT,
          resetAt: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': GUEST_MONTHLY_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          }
        }
      )
    }

    return null // Allow request
  } catch (error) {
    console.error('Guest monthly rate limiter error:', error)
    return null // Allow in case of error (fail open)
  }
}

/**
 * Get guest's current monthly usage without incrementing
 * Useful for displaying remaining uses to the user
 */
export async function getGuestMonthlyUsage(
  req: NextRequest
): Promise<{ used: number; remaining: number; limit: number; resetAt: string }> {
  try {
    const ip = req.ip || req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"
    const monthKey = getMonthKey()
    const key = `guest-monthly:${ip}:${monthKey}`
    const resetTime = getMonthlyResetTime()

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
      remaining: Math.max(0, GUEST_MONTHLY_LIMIT - used),
      limit: GUEST_MONTHLY_LIMIT,
      resetAt: new Date(resetTime).toISOString(),
    }
  } catch (error) {
    console.error('Error getting guest monthly usage:', error)
    return {
      used: 0,
      remaining: GUEST_MONTHLY_LIMIT,
      limit: GUEST_MONTHLY_LIMIT,
      resetAt: new Date(getMonthlyResetTime()).toISOString(),
    }
  }
}
