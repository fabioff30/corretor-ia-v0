/**
 * Supabase Client para uso no lado do servidor (Server Components, API Routes, Server Actions)
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

type CookieStore = Awaited<ReturnType<typeof cookies>>

const resolvedCookieDomain = (() => {
  const configuredDomain =
    process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN || process.env.SUPABASE_COOKIE_DOMAIN

  if (configuredDomain) {
    return configuredDomain
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    return undefined
  }

  try {
    const { hostname } = new URL(appUrl)
    if (!hostname || hostname === 'localhost') {
      return undefined
    }

    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return undefined
    }

    return hostname.startsWith('www.') ? hostname.slice(4) : hostname
  } catch (error) {
    console.warn('[Supabase] Failed to resolve cookie domain from NEXT_PUBLIC_APP_URL', error)
    return undefined
  }
})()

function withNormalizedCookieOptions(options: CookieOptions): CookieOptions {
  return {
    ...options,
    // ⚠️ IMPORTANTE: NÃO usar httpOnly: true
    // O refresh token precisa ser acessível pelo client para manter a sessão
    httpOnly: false,
    // Apenas via HTTPS em produção
    secure: process.env.NODE_ENV === 'production',
    // Protege contra CSRF, permite navegação entre páginas
    sameSite: options.sameSite ?? 'lax',
    // Disponível em toda aplicação
    path: options.path ?? '/',
    // Expira com o refresh token (7 dias)
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7,
    ...(resolvedCookieDomain ? { domain: resolvedCookieDomain } : {}),
  }
}

export async function createClient(cookieStore?: CookieStore) {
  const store = cookieStore ?? (await cookies())

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const normalized = withNormalizedCookieOptions(options)
            store.set({ name, value, ...normalized })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const normalized = withNormalizedCookieOptions(options)
            store.set({ name, value: '', ...normalized })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export { withNormalizedCookieOptions }

/**
 * Cliente Supabase com service_role key para operações administrativas
 * ⚠️ USAR APENAS NO SERVIDOR - NUNCA NO CLIENTE
 */
export function createServiceRoleClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for service role client
        },
      },
    }
  )
}
