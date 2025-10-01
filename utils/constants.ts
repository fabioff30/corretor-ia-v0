// Character limits
export const FREE_CHARACTER_LIMIT = 1500
export const PREMIUM_CHARACTER_LIMIT = 5000
export const AI_DETECTOR_CHARACTER_LIMIT = 10000

// AI Detector limits
export const AI_DETECTOR_DAILY_LIMIT = 2

// API timeouts - Optimized for better performance
export const API_REQUEST_TIMEOUT = 30000 // 30 seconds (reduced from 60s)
export const MIN_REQUEST_INTERVAL = 5000 // 5 seconds
export const FETCH_TIMEOUT = 25000 // 25 seconds (reduced from 55s)

// Z-index values
export const POPUP_OVERLAY_Z_INDEX = 9999
export const POPUP_CONTENT_Z_INDEX = 10000

// Google Analytics and AdSense
export const GOOGLE_ADSENSE_CLIENT = "ca-pub-9690140831352761"
export const GTM_ID = "GTM-5ZNJ85CP"

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

// Use env-config.ts for environment configuration
// Import { getPublicConfig, getServerConfig } from './env-config' where needed
