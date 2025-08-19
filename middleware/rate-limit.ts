import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, isRedisAvailable, setRedisAvailable } from "@/utils/redis-client"
import { isProduction } from "@/utils/env-validation"

/**
 * Enhanced Rate Limiting with In-Memory Fallback
 * Provides robust rate limiting even when Redis is unavailable
 */

// In-memory store as fallback
interface RateLimitEntry {
  count: number
  resetTime: number
}

const memoryStore = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

// Periodic cleanup of expired entries
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

// Using shared Redis client from utils/redis-client.ts

// Rate limiting configuration
const RATE_LIMITS = {
  // Different limits for different endpoints
  default: {
    requests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  auth: {
    requests: 5, // Stricter limit for auth endpoints
    windowMs: 60 * 1000, // 1 minute
  },
  api: {
    requests: 20, // Higher limit for API usage
    windowMs: 60 * 1000, // 1 minute
  },
}

/**
 * Get rate limit configuration based on request path
 */
function getRateLimitConfig(pathname: string) {
  if (pathname.includes('/auth') || pathname.includes('/login')) {
    return RATE_LIMITS.auth
  }
  if (pathname.startsWith('/api/')) {
    return RATE_LIMITS.api
  }
  return RATE_LIMITS.default
}

/**
 * In-memory rate limiter fallback
 */
async function memoryRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now()
  const resetTime = now + windowMs
  
  const entry = memoryStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    memoryStore.set(key, { count: 1, resetTime })
    return true
  }
  
  if (entry.count >= limit) {
    return false // Rate limit exceeded
  }
  
  // Increment count
  entry.count++
  return true
}

/**
 * Redis-based rate limiter
 */
async function redisRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) return true
  
  try {
    const current = await redis.incr(key)
    
    if (current === 1) {
      // First request, set expiration
      await redis.expire(key, Math.ceil(windowMs / 1000))
    }
    
    return current <= limit
  } catch (error) {
    console.error('Redis rate limit error:', error)
    // Fall back to memory-based rate limiting
    setRedisAvailable(false)
    return await memoryRateLimit(key, limit, windowMs)
  }
}

/**
 * Main rate limiter function
 */
export async function rateLimiter(req: NextRequest) {
  try {
    // Get client identifier
    const ip = req.ip || req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"
    const userAgent = req.headers.get("user-agent") || ""
    
    // Create composite key for better tracking
    const key = `rate-limit:${ip}:${Buffer.from(userAgent).toString('base64').substring(0, 16)}`
    
    // Get rate limit config for this request
    const config = getRateLimitConfig(req.nextUrl.pathname)
    
    // Check rate limit
    const allowed = isRedisAvailable() 
      ? await redisRateLimit(key, config.requests, config.windowMs)
      : await memoryRateLimit(key, config.requests, config.windowMs)
    
    if (!allowed) {
      // Log rate limit hit for monitoring
      console.warn(`Rate limit exceeded for ${ip} on ${req.nextUrl.pathname}`)
      
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(config.windowMs / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + config.windowMs).toString(),
          }
        }
      )
    }
    
    return null // Allow request
  } catch (error) {
    console.error('Rate limiter error:', error)
    
    // In case of error, allow request in development, block in production for safety
    if (isProduction()) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      )
    }
    
    return null // Allow in development
  }
}

/**
 * Rate limiter specifically for API routes
 */
export async function apiRateLimiter(req: NextRequest) {
  return rateLimiter(req)
}

/**
 * Strict rate limiter for authentication endpoints
 */
export async function authRateLimiter(req: NextRequest) {
  // Override the path to use auth configuration
  const modifiedReq = {
    ...req,
    nextUrl: { ...req.nextUrl, pathname: '/auth/login' }
  } as NextRequest
  
  return rateLimiter(modifiedReq)
}
