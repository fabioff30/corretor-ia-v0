// Character limits
export const FREE_CHARACTER_LIMIT = 1500
export const PREMIUM_CHARACTER_LIMIT = 10000

// Premium Plan Configuration
export const PREMIUM_PLAN_PRICE = 19.90
export const PREMIUM_PLAN_CURRENCY = "BRL"
export const PREMIUM_PLAN_NAME = "CorretorIA Pro"

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

// API Base URL and endpoints
export const API_BASE_URL = "https://api-test.corretordetextoonline.com.br"

// Free API endpoints
export const WEBHOOK_URL = `${API_BASE_URL}/api/corrigir`
export const REWRITE_WEBHOOK_URL = `${API_BASE_URL}/api/reescrever`
export const FALLBACK_WEBHOOK_URL = "https://auto.ffmedia.com.br/webhook/webapp-tradutor"

// Premium API endpoints
export const PREMIUM_WEBHOOK_URL = `${API_BASE_URL}/api/premium_corrigir`
export const PREMIUM_REWRITE_WEBHOOK_URL = `${API_BASE_URL}/api/premium_reescrever`

// Humanization API endpoints
export const HUMANIZE_ANALYSIS_URL = `${API_BASE_URL}/api/analysis_ai`
export const HUMANIZE_REWRITE_URL = `${API_BASE_URL}/api/humanizar`

// Humanization limits and configuration
export const HUMANIZE_LIMITS = {
  FREE_USES_PER_MONTH: 1,
  PREMIUM_USES_PER_DAY: 2,
  CHARACTER_LIMIT: 50000, // Expanded to ~10k words (avg 5 chars/word)
  TIMEOUT: 90000, // 90 seconds for larger text processing
} as const

// Humanization modes
export const HUMANIZE_MODES = {
  DEFAULT: "default",
  ACADEMIC: "academico",
  JOURNALISTIC: "jornalistico",
  BLOG: "blog",
  LEGAL: "juridico",
} as const

// Humanization mode descriptions
export const HUMANIZE_MODE_DESCRIPTIONS = {
  [HUMANIZE_MODES.DEFAULT]: "Análise geral sem especificações de domínio",
  [HUMANIZE_MODES.ACADEMIC]: "Otimizado para textos acadêmicos e científicos",
  [HUMANIZE_MODES.JOURNALISTIC]: "Focado em textos jornalísticos e notícias",
  [HUMANIZE_MODES.BLOG]: "Adaptado para blogs e conteúdo informal",
  [HUMANIZE_MODES.LEGAL]: "Especializado em textos jurídicos e legais",
} as const

// Authentication - Server-side only
export const AUTH_TOKEN = typeof process !== 'undefined' ? (process.env.AUTH_TOKEN || "ex5B31uQHm2rPHsWt1RwUo9ct35qFAjczdKqbCIMZh5D1qovSmotGtQUQaRXJtvg") : ""

// Julinho status
export const JULINHO_DISABLED = false // Reativando o Julinho

// Use env-config.ts for environment configuration
// Import { getPublicConfig, getServerConfig } from './env-config' where needed
