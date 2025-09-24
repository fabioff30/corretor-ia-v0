import { Redis } from "@upstash/redis"
import { getServerConfig, isServer } from "./env-config"

/**
 * Shared Redis Client Utility
 * Centralized Redis connection management for the application
 */

let redis: Redis | null = null
let redisAvailable = false

/**
 * Initialize Redis client
 */
export function initRedis(): void {
  if (!isServer() || redis) return

  try {
    const config = getServerConfig()
    
    if (config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: config.UPSTASH_REDIS_REST_URL,
        token: config.UPSTASH_REDIS_REST_TOKEN,
      })
      redisAvailable = true
    }
  } catch (error) {
    console.error("Redis connection failed:", error)
    redisAvailable = false
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  if (!redis && isServer()) {
    initRedis()
  }
  return redis
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  if (!redis) return false

  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error("Redis ping failed:", error)
    redisAvailable = false
    return false
  }
}

/**
 * Set Redis availability status
 */
export function setRedisAvailable(available: boolean): void {
  redisAvailable = available
}

// Initialize Redis on module load
initRedis()
