// Character limits
export const FREE_CHARACTER_LIMIT = 1500
export const PREMIUM_CHARACTER_LIMIT = 200000 // 200k characters for premium users
export const UNLIMITED_CHARACTER_LIMIT = -1 // For Pro/Admin users (no limit)
export const AI_DETECTOR_CHARACTER_LIMIT = 10000

// AI Detector limits
export const AI_DETECTOR_DAILY_LIMIT = 2

// API timeouts - Increased for better handling of long AI processing
export const API_REQUEST_TIMEOUT = 90000 // 90 seconds for standard AI processing
export const PREMIUM_API_TIMEOUT = 120000 // 120 seconds for premium endpoints (ultrathink mode)
export const MIN_REQUEST_INTERVAL = 5000 // 5 seconds
export const FETCH_TIMEOUT = 85000 // 85 seconds (slightly less than API timeout)
export const PREMIUM_FETCH_TIMEOUT = 115000 // 115 seconds for premium endpoints
export const AI_DETECTOR_TIMEOUT = 120000 // 120 seconds for AI detector webhook (ultrathink processing)

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
export const FALLBACK_WEBHOOK_URL = `${WORKERS_API_BASE}/api/corrigir` // Mesmo endpoint como fallback

// Authentication - Server-side only
export const AUTH_TOKEN = typeof process !== 'undefined' ? (process.env.AUTH_TOKEN || "ex5B31uQHm2rPHsWt1RwUo9ct35qFAjczdKqbCIMZh5D1qovSmotGtQUQaRXJtvg") : ""

// Julinho status
export const JULINHO_DISABLED = false // Reativando o Julinho

// Advertisement control (temporarily disabled)
export const DISABLE_ADS = true // Set to true to disable all ads

// Use env-config.ts for environment configuration
// Import { getPublicConfig, getServerConfig } from './env-config' where needed
