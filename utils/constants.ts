// Character limits
export const FREE_CHARACTER_LIMIT = 1500
export const PREMIUM_CHARACTER_LIMIT = 5000

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

// API endpoints - URLs atualizadas para nova API
export const WEBHOOK_URL = process.env.CORRECTION_API_URL || "https://my-corretoria-hab2a25sc-fabioff30s-projects.vercel.app/api/corrigir"
export const REWRITE_WEBHOOK_URL = "https://my-corretoria.vercel.app/api/reescrever"
export const FALLBACK_WEBHOOK_URL = "https://auto.ffmedia.com.br/webhook/webapp-tradutor"

// Authentication - Server-side only
export const AUTH_TOKEN = typeof process !== 'undefined' ? (process.env.AUTH_TOKEN || "ex5B31uQHm2rPHsWt1RwUo9ct35qFAjczdKqbCIMZh5D1qovSmotGtQUQaRXJtvg") : ""

// Julinho status
export const JULINHO_DISABLED = false // Reativando o Julinho

// Use env-config.ts for environment configuration
// Import { getPublicConfig, getServerConfig } from './env-config' where needed
