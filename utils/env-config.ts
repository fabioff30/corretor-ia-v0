/**
 * Safe Environment Configuration
 * Client-safe environment utilities
 */

/**
 * Check if we're on the server side
 */
export function isServer(): boolean {
  // In Next.js, presence of window is the most reliable client check
  return typeof window === 'undefined'
}

/**
 * Check if we're on the client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Safe environment variable getter
 */
export function getEnv(key: string, fallback: string = ''): string {
  if (!isServer()) {
    // Client-side - only return NEXT_PUBLIC_ variables
    if (key.startsWith('NEXT_PUBLIC_')) {
      return (window as any).__ENV__?.[key] || fallback
    }
    return fallback
  }
  
  return process.env[key] || fallback
}

/**
 * Get environment type safely
 */
export function getNodeEnv(): 'development' | 'production' | 'test' {
  if (!isServer()) {
    return 'development'
  }
  
  const env = process.env.NODE_ENV
  if (env === 'production' || env === 'test') {
    return env
  }
  return 'development'
}

/**
 * Environment checks
 */
export function isProduction(): boolean {
  return getNodeEnv() === 'production'
}

export function isDevelopment(): boolean {
  return getNodeEnv() === 'development'
}

/**
 * Get public configuration (safe for client)
 */
export function getPublicConfig() {
  return {
    NODE_ENV: getNodeEnv(),
    APP_URL: getEnv('NEXT_PUBLIC_APP_URL', 'https://www.corretordetextoonline.com.br'),
  }
}

/**
 * Get server-only configuration
 */
export function getServerConfig() {
  if (!isServer()) {
    throw new Error('getServerConfig can only be called on the server side')
  }
  
  return {
    AUTH_TOKEN: process.env.AUTH_TOKEN || '',
    REVALIDATION_TOKEN: process.env.REVALIDATION_TOKEN || '',
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',
    ADMIN_API_KEY: process.env.ADMIN_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    MERCADO_PAGO_PUBLIC_KEY: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
    NOTIFICATION_WEBHOOK_URL: process.env.NOTIFICATION_WEBHOOK_URL || '',
  }
}
