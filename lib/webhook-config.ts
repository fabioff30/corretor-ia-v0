import { redis } from "@/utils/redis-client"
import {
  WEBHOOK_URL,
  PREMIUM_WEBHOOK_URL,
  REWRITE_WEBHOOK_URL,
  PREMIUM_REWRITE_WEBHOOK_URL,
  ANALYSIS_WEBHOOK_URL,
  HUMANIZAR_WEBHOOK_URL,
  EXTERNAL_FALLBACK_WEBHOOK_URL,
  WEBHOOK_URL_FALLBACK_EXTERNAL,
  WEBHOOK_URL_FALLBACK_EXTERNAL_2,
} from "@/utils/constants"

// Cache local with TTL to reduce Redis calls
const localCache: Record<string, { value: string; timestamp: number }> = {}
const CACHE_TTL = 10000 // 10 seconds

export enum WebhookType {
  CORRECT = "correct",
  PREMIUM_CORRECT = "premium-correct",
  REWRITE = "rewrite",
  PREMIUM_REWRITE = "premium-rewrite",
  ANALYSIS = "analysis",
  HUMANIZAR = "humanizar",
}

interface WebhookConfig {
  primary: string
  fallback?: string
  secondary?: string
}

const defaultConfigs: Record<WebhookType, WebhookConfig> = {
  [WebhookType.CORRECT]: {
    primary: WEBHOOK_URL,
    fallback: WEBHOOK_URL_FALLBACK_EXTERNAL,
    secondary: WEBHOOK_URL_FALLBACK_EXTERNAL_2,
  },
  [WebhookType.PREMIUM_CORRECT]: {
    primary: PREMIUM_WEBHOOK_URL,
    fallback: WEBHOOK_URL_FALLBACK_EXTERNAL,
    secondary: WEBHOOK_URL_FALLBACK_EXTERNAL_2,
  },
  [WebhookType.REWRITE]: {
    primary: REWRITE_WEBHOOK_URL,
    fallback: WEBHOOK_URL_FALLBACK_EXTERNAL,
    secondary: WEBHOOK_URL_FALLBACK_EXTERNAL_2,
  },
  [WebhookType.PREMIUM_REWRITE]: {
    primary: PREMIUM_REWRITE_WEBHOOK_URL,
    fallback: WEBHOOK_URL_FALLBACK_EXTERNAL,
    secondary: WEBHOOK_URL_FALLBACK_EXTERNAL_2,
  },
  [WebhookType.ANALYSIS]: {
    primary: ANALYSIS_WEBHOOK_URL,
    fallback: WEBHOOK_URL_FALLBACK_EXTERNAL,
    secondary: WEBHOOK_URL_FALLBACK_EXTERNAL_2,
  },
  [WebhookType.HUMANIZAR]: {
    primary: HUMANIZAR_WEBHOOK_URL,
    fallback: WEBHOOK_URL_FALLBACK_EXTERNAL,
    secondary: WEBHOOK_URL_FALLBACK_EXTERNAL_2,
  },
}

/**
 * Get the primary webhook URL for a given type
 * Checks Redis first, then falls back to environment variables or hardcoded values
 */
export async function getWebhookUrl(
  type: WebhookType,
  requestId?: string
): Promise<string> {
  const cacheKey = `webhook-${type}-primary`

  // Check local cache first
  const cachedValue = localCache[cacheKey]
  if (cachedValue && Date.now() - cachedValue.timestamp < CACHE_TTL) {
    console.log(`Webhook: Using cached URL for ${type}`, requestId)
    return cachedValue.value
  }

  try {
    // Try to get from Redis
    if (redis) {
      const redisValue = await redis.get(cacheKey)
      if (redisValue) {
        console.log(`Webhook: Using Redis-configured URL for ${type}`, requestId)
        localCache[cacheKey] = { value: redisValue, timestamp: Date.now() }
        return redisValue
      }
    }
  } catch (error) {
    console.warn(`Webhook: Redis unavailable, using fallback for ${type}`, requestId, error)
  }

  // Fall back to default configuration
  const defaultUrl = defaultConfigs[type]?.primary || WEBHOOK_URL
  console.log(`Webhook: Using default URL for ${type}: ${defaultUrl}`, requestId)
  localCache[cacheKey] = { value: defaultUrl, timestamp: Date.now() }
  return defaultUrl
}

/**
 * Get the fallback webhook URL for a given type
 */
export async function getFallbackWebhookUrl(
  type: WebhookType,
  requestId?: string
): Promise<string | undefined> {
  const cacheKey = `webhook-${type}-fallback`

  // Check local cache first
  const cachedValue = localCache[cacheKey]
  if (cachedValue && Date.now() - cachedValue.timestamp < CACHE_TTL) {
    return cachedValue.value
  }

  try {
    // Try to get from Redis
    if (redis) {
      const redisValue = await redis.get(cacheKey)
      if (redisValue) {
        console.log(`Webhook: Using Redis-configured fallback for ${type}`, requestId)
        localCache[cacheKey] = { value: redisValue, timestamp: Date.now() }
        return redisValue
      }
    }
  } catch (error) {
    console.warn(`Webhook: Redis unavailable for fallback ${type}`, requestId)
  }

  // Fall back to default
  const defaultUrl = defaultConfigs[type]?.fallback
  if (defaultUrl) {
    console.log(`Webhook: Using default fallback for ${type}`, requestId)
    localCache[cacheKey] = { value: defaultUrl, timestamp: Date.now() }
  }
  return defaultUrl
}

/**
 * Get the secondary fallback webhook URL for a given type
 */
export async function getSecondaryFallbackWebhookUrl(
  type: WebhookType,
  requestId?: string
): Promise<string | undefined> {
  const cacheKey = `webhook-${type}-secondary`

  // Check local cache first
  const cachedValue = localCache[cacheKey]
  if (cachedValue && Date.now() - cachedValue.timestamp < CACHE_TTL) {
    return cachedValue.value
  }

  try {
    // Try to get from Redis
    if (redis) {
      const redisValue = await redis.get(cacheKey)
      if (redisValue) {
        console.log(`Webhook: Using Redis-configured secondary fallback for ${type}`, requestId)
        localCache[cacheKey] = { value: redisValue, timestamp: Date.now() }
        return redisValue
      }
    }
  } catch (error) {
    console.warn(`Webhook: Redis unavailable for secondary fallback ${type}`, requestId)
  }

  // Fall back to default
  const defaultUrl = defaultConfigs[type]?.secondary
  if (defaultUrl) {
    console.log(`Webhook: Using default secondary fallback for ${type}`, requestId)
    localCache[cacheKey] = { value: defaultUrl, timestamp: Date.now() }
  }
  return defaultUrl
}

/**
 * Update webhook configuration in Redis
 * Used by admin API to change endpoints in emergencies
 */
export async function updateWebhookConfig(
  type: WebhookType,
  level: "primary" | "fallback" | "secondary",
  url: string,
  requestId?: string
): Promise<boolean> {
  if (!url || !url.startsWith("http")) {
    console.error(`Webhook: Invalid URL format for ${type}/${level}`, requestId)
    return false
  }

  try {
    if (!redis) {
      console.warn(`Webhook: Redis not available, cannot update ${type}/${level}`, requestId)
      return false
    }

    const cacheKey = `webhook-${type}-${level}`

    // Set in Redis with 30 day TTL
    await redis.set(cacheKey, url, { ex: 2592000 })

    // Clear local cache
    delete localCache[cacheKey]

    console.log(
      `Webhook: Updated ${level} URL for ${type} to ${url}`,
      requestId
    )

    // Log the change
    await logWebhookChange(type, level, url, requestId)

    return true
  } catch (error) {
    console.error(
      `Webhook: Failed to update ${type}/${level}`,
      requestId,
      error
    )
    return false
  }
}

/**
 * Get current webhook configuration (for admin dashboard)
 */
export async function getWebhookConfiguration(
  type: WebhookType,
  requestId?: string
): Promise<WebhookConfig> {
  const primary = await getWebhookUrl(type, requestId)
  const fallback = await getFallbackWebhookUrl(type, requestId)
  const secondary = await getSecondaryFallbackWebhookUrl(type, requestId)

  return {
    primary,
    fallback,
    secondary,
  }
}

/**
 * Log webhook configuration changes for audit trail
 */
async function logWebhookChange(
  type: WebhookType,
  level: string,
  url: string,
  requestId?: string
) {
  try {
    const timestamp = new Date().toISOString()
    const logKey = `webhook-changelog:${timestamp}`

    if (redis) {
      await redis.set(logKey, JSON.stringify({ type, level, url }), { ex: 7776000 }) // 90 days
    }

    console.log(`Webhook: Logged change for ${type}/${level}`, requestId)
  } catch (error) {
    console.warn(`Webhook: Failed to log change`, requestId, error)
  }
}

/**
 * Clear cache to force refresh from Redis
 */
export function clearWebhookCache() {
  for (const key in localCache) {
    delete localCache[key]
  }
  console.log(`Webhook: Local cache cleared`)
}
