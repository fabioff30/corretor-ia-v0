/**
 * Supabase Client para uso no lado do cliente (Client Components)
 * Configured to use PKCE flow for OAuth with protection against refresh token loops
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

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

  // Monitor auth state changes to detect and prevent refresh loops
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

  return client
}

// Export singleton instance
export const supabase = createClient()
