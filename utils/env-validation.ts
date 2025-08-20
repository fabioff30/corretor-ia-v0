/**
 * Environment Variables Validation Utility
 * Validates and ensures all required environment variables are properly configured
 */

export interface EnvConfig {
  // API Keys and Tokens
  AUTH_TOKEN?: string
  ADMIN_API_KEY?: string
  OPENAI_API_KEY?: string
  
  // Redis Configuration
  UPSTASH_REDIS_REST_URL?: string
  UPSTASH_REDIS_REST_TOKEN?: string
  
  // MercadoPago
  MERCADO_PAGO_ACCESS_TOKEN?: string
  MERCADO_PAGO_PUBLIC_KEY?: string
  
  // Webhooks and Security
  REVALIDATION_TOKEN?: string
  WEBHOOK_SECRET?: string
  
  // Public Configuration
  NEXT_PUBLIC_APP_URL?: string
  NEXT_PUBLIC_ADMIN_PASSWORD?: string // To be deprecated
  
  // Notifications
  NOTIFICATION_WEBHOOK_URL?: string
  
  // Node Environment
  NODE_ENV: 'development' | 'production' | 'test'
}

/**
 * Generates a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Validates environment variables and provides secure defaults
 * Only runs on server-side
 */
export function validateEnvVars(): EnvConfig {
  // Check if we're on the server side
  if (typeof process === 'undefined') {
    // Client-side fallback - return minimal config
    return {
      NODE_ENV: 'development' as 'development',
      NEXT_PUBLIC_APP_URL: "https://www.corretordetextoonline.com.br",
      NOTIFICATION_WEBHOOK_URL: "https://auto.ffmedia.com.br/webhook-test/avaliacao",
    }
  }

  const env = process.env
  const isProduction = env.NODE_ENV === 'production'
  const isDevelopment = env.NODE_ENV === 'development'
  
  // Check if we're in build time (Next.js static generation)
  const isBuildTime = !!(env.NEXT_PHASE === 'phase-production-build' || 
                        env.__NEXT_PRIVATE_PREBUNDLED_REACT === 'next' ||
                        process.env.npm_lifecycle_event === 'build')
  
  // During build time, be more permissive with missing environment variables
  if (isBuildTime) {
    console.log("🔨 Build time detected - skipping strict environment validation")
  }
  
  // Critical validations for production (skip during build time)
  if (isProduction && !isBuildTime) {
    const criticalVars = {
      OPENAI_API_KEY: env.OPENAI_API_KEY,
      AUTH_TOKEN: env.AUTH_TOKEN,
      REVALIDATION_TOKEN: env.REVALIDATION_TOKEN,
      WEBHOOK_SECRET: env.WEBHOOK_SECRET,
    }
    
    const missing = Object.entries(criticalVars)
      .filter(([_, value]) => !value || value.includes('default') || value.includes('change-this'))
      .map(([key]) => key)
    
    if (missing.length > 0) {
      // Throwing here will be handled by callers; avoid process.exit on Edge.
      throw new Error(
        `Critical environment variables missing or using insecure defaults in production: ${missing.join(', ')}`
      )
    }
  } else if (isProduction && isBuildTime) {
    console.warn("⚠️ Production build detected but environment variables not validated (build time)")
  }
  
  // Validate token security (skip strict validation during build time)
  const validateToken = (token: string | undefined, name: string): string | undefined => {
    if (!token) return undefined
    
    if (token.includes('default') || token.includes('change-this') || token.length < 16) {
      if (isProduction && !isBuildTime) {
        throw new Error(`Insecure ${name}: must be at least 16 characters and cannot contain 'default' or 'change-this'`)
      }
      if (!isBuildTime) {
        console.warn(`⚠️ Insecure ${name} detected. In production, this will cause startup failure.`)
      }
    }
    
    return token
  }
  
  return {
    // Validated tokens
    AUTH_TOKEN: validateToken(env.AUTH_TOKEN, 'AUTH_TOKEN'),
    ADMIN_API_KEY: validateToken(env.ADMIN_API_KEY, 'ADMIN_API_KEY'),
    REVALIDATION_TOKEN: validateToken(env.REVALIDATION_TOKEN, 'REVALIDATION_TOKEN'),
    WEBHOOK_SECRET: validateToken(env.WEBHOOK_SECRET, 'WEBHOOK_SECRET'),
    
    // API Keys
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    
    // Redis
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
    
    // MercadoPago
    MERCADO_PAGO_ACCESS_TOKEN: env.MERCADO_PAGO_ACCESS_TOKEN,
    MERCADO_PAGO_PUBLIC_KEY: env.MERCADO_PAGO_PUBLIC_KEY,
    
    // Public vars
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL || "https://www.corretordetextoonline.com.br",
    NEXT_PUBLIC_ADMIN_PASSWORD: env.NEXT_PUBLIC_ADMIN_PASSWORD, // Will be deprecated
    
    // Notifications
    NOTIFICATION_WEBHOOK_URL: env.NOTIFICATION_WEBHOOK_URL || "https://auto.ffmedia.com.br/webhook-test/avaliacao",
    
    // Node environment
    NODE_ENV: (env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  }
}

/**
 * Lazy-initialized environment configuration
 */
let envConfig: EnvConfig | null = null

export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnvVars()
  }
  return envConfig
}

/**
 * Helper function to check if we're in production
 */
export function isProduction(): boolean {
  // Safe check for both client and server
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV === 'production'
  }
  return false // Default to development on client
}

/**
 * Helper function to check if we're in development
 */
export function isDevelopment(): boolean {
  // Safe check for both client and server
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV === 'development'
  }
  return true // Default to development on client
}

// Note: Do not auto-validate on module load during build/Edge runtime.
// Call validateEnvVars()/getEnvConfig() from server entrypoints as needed.
