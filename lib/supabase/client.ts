/**
 * Supabase Client para uso no lado do cliente (Client Components)
 * Configured to use PKCE flow for OAuth with protection against refresh token loops
 *
 * Usa um storage adapter personalizado para prevenir o erro:
 * TypeError: Cannot create property 'user' on string
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { safeStorageAdapter, cleanupCorruptedSessions } from './storage-adapter'

// Executar limpeza proativa ANTES de criar qualquer cliente
// Isso detecta e corrige sessões double-serialized imediatamente
if (typeof window !== 'undefined') {
  cleanupCorruptedSessions()
}

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
        // Usar storage adapter seguro que previne double-serialization
        storage: safeStorageAdapter,
        // Explicitly set debug to false to reduce noise
        debug: false,
      },
    }
  )

  return client
}

// Export singleton instance
export const supabase = createClient()
