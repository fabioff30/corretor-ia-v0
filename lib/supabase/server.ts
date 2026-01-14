/**
 * Supabase Client para uso no lado do servidor (Server Components, API Routes, Server Actions)
 *
 * IMPORTANTE: Usa o padrao getAll/setAll recomendado pela documentacao do @supabase/ssr
 * O SDK lida internamente com chunking, encoding e serialization de cookies
 *
 * @see https://supabase.com/docs/guides/auth/server-side/advanced-guide
 */

import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

type CookieStore = Awaited<ReturnType<typeof cookies>>

// Resolver dominio do cookie uma vez no startup
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

/**
 * Normaliza opcoes de cookie para garantir configuracao consistente
 */
function withNormalizedCookieOptions(options: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...options,
    // NAO usar httpOnly: true - refresh token precisa ser acessivel pelo client
    httpOnly: false,
    // HTTPS apenas em producao
    secure: process.env.NODE_ENV === 'production',
    // Protege contra CSRF, permite navegacao entre paginas
    sameSite: options.sameSite ?? 'lax',
    // Disponivel em toda aplicacao
    path: options.path ?? '/',
    // 30 dias para sessoes de longa duracao
    maxAge: options.maxAge ?? 60 * 60 * 24 * 30,
    ...(resolvedCookieDomain ? { domain: resolvedCookieDomain } : {}),
  }
}

/**
 * Cria cliente Supabase para uso no servidor
 * Usa padrao getAll/setAll recomendado pela documentacao
 */
export async function createClient(cookieStore?: CookieStore): Promise<SupabaseClient<Database>> {
  const store = cookieStore ?? (await cookies())

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              store.set({
                name,
                value,
                ...withNormalizedCookieOptions(options),
              })
            })
          } catch {
            // O metodo set foi chamado de um Server Component
            // Isso pode ser ignorado se o middleware esta refreshing a sessao
          }
        },
      },
    }
  )
}

// Exportar para uso em outros arquivos
export { withNormalizedCookieOptions }

/**
 * Cliente Supabase com service_role key para operacoes administrativas
 * USAR APENAS NO SERVIDOR - NUNCA NO CLIENTE
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
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
