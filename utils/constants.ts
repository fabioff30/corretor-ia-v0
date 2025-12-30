// Character limits
export const FREE_CHARACTER_LIMIT = 1000
export const PREMIUM_CHARACTER_LIMIT = 20000 // 20k characters for premium users
export const UNLIMITED_CHARACTER_LIMIT = -1 // For Pro/Admin users (no limit) - deprecated
export const AI_DETECTOR_CHARACTER_LIMIT = 10000
export const HUMANIZAR_MAX_TEXT_LENGTH = 20000 // 20k characters max for humanization

// Daily usage limits (configured in Supabase plan_limits_config table)
// Free plan: 3 corrections/day, 3 rewrites/day, 1 AI analysis/day
// Pro plan: unlimited (-1) for all operations
// These limits are enforced in /api/correct and /api/rewrite routes
// via canUserPerformOperation() and incrementUserUsage() functions
export const FREE_DAILY_CORRECTIONS_LIMIT = 3 // Hardcoded fallback - MUST match Supabase plan_limits_config
export const FREE_DAILY_REWRITES_LIMIT = 3 // Hardcoded fallback - MUST match Supabase plan_limits_config

// AI Detector limits
export const AI_DETECTOR_DAILY_LIMIT = 2

// API timeouts - Increased for better handling of long AI processing
export const API_REQUEST_TIMEOUT = 90000 // 90 seconds for standard AI processing
export const PREMIUM_API_TIMEOUT = 300000 // 300 seconds (5 min) for premium endpoints - Vercel Pro max
export const MIN_REQUEST_INTERVAL = 5000 // 5 seconds
export const FETCH_TIMEOUT = 85000 // 85 seconds (slightly less than API timeout)
export const PREMIUM_FETCH_TIMEOUT = 295000 // 295 seconds for premium endpoints (slightly less than max)
export const AI_DETECTOR_TIMEOUT = 290000 // 290 seconds for AI detector webhook (10s margin before Vercel timeout)
export const HUMANIZAR_TIMEOUT = 110000 // 110 seconds for humanization processing (10s margin before Vercel timeout)

// Z-index values
export const POPUP_OVERLAY_Z_INDEX = 9999
export const POPUP_CONTENT_Z_INDEX = 10000

// Google Analytics and AdSense
export const GOOGLE_ADSENSE_CLIENT = "ca-pub-9690140831352761"
export const GTM_ID = "GTM-5ZNJ85CP"
export const GA4_MEASUREMENT_ID = "G-ZR7B5DMLER"

// API endpoints - Workers API
const WORKERS_API_BASE = "https://workers-api.fabiofariasf.workers.dev"
export const WEBHOOK_URL = `${WORKERS_API_BASE}/api/corrigir`
export const PREMIUM_WEBHOOK_URL = `${WORKERS_API_BASE}/api/premium-corrigir`
export const REWRITE_WEBHOOK_URL = `${WORKERS_API_BASE}/api/reescrever`
export const PREMIUM_REWRITE_WEBHOOK_URL = `${WORKERS_API_BASE}/api/premium-reescrever`
export const ANALYSIS_WEBHOOK_URL = `${WORKERS_API_BASE}/api/analysis-ai`
export const HUMANIZAR_WEBHOOK_URL = `${WORKERS_API_BASE}/api/humanizar`
export const FALLBACK_WEBHOOK_URL = `${WORKERS_API_BASE}/api/corrigir` // Mesmo endpoint como fallback

// DeepSeek Configuration
export const DEEPSEEK_STREAM_WEBHOOK_URL = `${WORKERS_API_BASE}/api/corrigir-stream`
export const DEEPSEEK_LONG_TEXT_THRESHOLD = 5000 // Usar DeepSeek para textos >= 5k chars
export const DEEPSEEK_CHUNK_THRESHOLD = 80000 // Chunking paralelo para textos >= 80k chars

// Authentication - Server-side only
export const AUTH_TOKEN = typeof process !== 'undefined' ? (process.env.AUTH_TOKEN || "ex5B31uQHm2rPHsWt1RwUo9ct35qFAjczdKqbCIMZh5D1qovSmotGtQUQaRXJtvg") : ""

// Julinho status
export const JULINHO_DISABLED = false // Reativando o Julinho

// Advertisement control (temporarily disabled)
export const DISABLE_ADS = true // Set to true to disable all ads

// Use env-config.ts for environment configuration
// Import { getPublicConfig, getServerConfig } from './env-config' where needed

// Premium Plan
export const PREMIUM_PLAN_PRICE = 19.90 // Preço mensal do plano Premium

// Black Friday Configuration
export const BLACK_FRIDAY_CONFIG = {
  END_DATE: new Date('2025-11-29T02:59:00Z'), // 28/11 23:59 BRT (UTC-3)
  PRICE: 99.90,
  ORIGINAL_PRICE: 299.00, // Preço "de" para mostrar desconto
  INSTALLMENT_PRICE: 9.90,
  INSTALLMENTS: 10,
  STRIPE_PRODUCT_ID: 'prod_TU7ypXVwPaSvkH',
  STRIPE_PRICE_ID: 'price_1SX9iCAaDWyHAlqlcLPoTjZy',
  PROMO_CODE: 'BLACKFRIDAY2024',
}

// Helper function to check if Black Friday is active
export const isBlackFridayActive = (): boolean => {
  return new Date() < BLACK_FRIDAY_CONFIG.END_DATE
}
