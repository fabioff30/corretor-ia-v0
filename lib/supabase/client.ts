/**
 * Supabase Client para uso no lado do cliente (Client Components)
 * Configured to use PKCE flow for OAuth with protection against refresh token loops
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

/**
 * Corrige sessões corrompidas no localStorage ANTES de criar o cliente Supabase
 * Isso previne o erro: TypeError: Cannot create property 'user' on string
 *
 * O erro ocorre quando a sessão é armazenada como string JSON em vez de objeto,
 * causando falha ao SDK tentar acessar session.user
 */
function fixCorruptedSessionSync(): void {
  if (typeof window === 'undefined') return

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1]
    if (!projectRef) return

    const storageKey = `sb-${projectRef}-auth-token`
    const stored = localStorage.getItem(storageKey)
    if (!stored) return

    // Verificar se o valor armazenado é válido
    try {
      const parsed = JSON.parse(stored)

      // Caso 1: Double serialization - parsed é string em vez de objeto
      if (typeof parsed === 'string') {
        console.warn('[Supabase] Detectada sessão double-serializada, corrigindo...')
        try {
          const session = JSON.parse(parsed)
          if (session && typeof session === 'object' && session.access_token) {
            localStorage.setItem(storageKey, JSON.stringify(session))
            console.log('[Supabase] Sessão corrigida com sucesso')
            return
          }
        } catch {
          // Não conseguiu re-parsear, remover
          console.warn('[Supabase] Sessão inválida, removendo...')
          localStorage.removeItem(storageKey)
          return
        }
      }

      // Caso 2: Objeto válido mas sem access_token
      if (typeof parsed === 'object' && !parsed?.access_token) {
        console.warn('[Supabase] Sessão sem access_token, removendo...')
        localStorage.removeItem(storageKey)
        return
      }

    } catch {
      // JSON inválido no storage
      console.warn('[Supabase] Sessão com JSON inválido, removendo...')
      localStorage.removeItem(storageKey)
    }
  } catch (error) {
    console.error('[Supabase] Erro ao verificar/corrigir sessão:', error)
  }
}

// Executar correção ANTES de criar qualquer cliente
// Isso é crítico para prevenir o erro "Cannot create property 'user' on string"
fixCorruptedSessionSync()

// Protection against infinite refresh token loops
let lastRefreshAttempt = 0
let consecutiveFailures = 0
const REFRESH_COOLDOWN_MS = 5000 // 5 seconds between refresh attempts
const MAX_CONSECUTIVE_FAILURES = 3 // Max failed attempts before stopping auto-refresh

export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        // Explicitly set debug to false to reduce noise
        debug: false,
      },
    }
  )

  // Monitor auth state changes to detect refresh loops
  // NOTE: Disabled to prevent duplicate event handling - UserProvider handles auth events
  // Uncommenting this can cause logout loops due to duplicate SIGNED_OUT events
  /*
  client.auth.onAuthStateChange((event, session) => {
    const now = Date.now()

    // Detect potential refresh loop
    if (event === 'TOKEN_REFRESHED') {
      if (now - lastRefreshAttempt < REFRESH_COOLDOWN_MS) {
        consecutiveFailures++
        console.warn(`[Supabase] Rapid token refresh detected (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`)

        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.error('[Supabase] Too many rapid refresh attempts. Clearing session to prevent loop.')
          // Force clear session to break the loop
          client.auth.signOut({ scope: 'local' }).catch(() => {
            // Ignore errors, just clear local state
          })
          consecutiveFailures = 0
          return
        }
      } else {
        // Reset counter if enough time has passed
        consecutiveFailures = 0
      }
      lastRefreshAttempt = now
    }

    // Reset failure counter on successful sign in
    if (event === 'SIGNED_IN') {
      consecutiveFailures = 0
    }
  })
  */

  return client
}

// Export singleton instance
export const supabase = createClient()
