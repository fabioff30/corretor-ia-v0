/**
 * Supabase Client para uso no lado do servidor (Server Components, API Routes, Server Actions)
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
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
    // Expira com o refresh token (30 dias para sessões de longa duração)
    maxAge: options.maxAge ?? 60 * 60 * 24 * 30,
    ...(resolvedCookieDomain ? { domain: resolvedCookieDomain } : {}),
  }
}

/**
 * Corrige double-serialization em cookies de sessão do Supabase
 * Problema: TypeError: Cannot create property 'user' on string
 * Causa: JSON.stringify aplicado duas vezes resulta em string ao invés de objeto
 *
 * Detecta múltiplos padrões de corrupção:
 * 1. Valor começa com aspas (Firefox tende a fazer isso)
 * 2. Valor parseado é string ao invés de objeto
 */
function fixCookieDoubleSerialization(value: string | null): string | null {
  if (!value) return null

  // Caso 1: Valor começa e termina com aspas (double-quoted)
  // Ex: '"{\"access_token\":\"...\"}"'
  if (value.startsWith('"') && value.endsWith('"') && value.length > 2) {
    try {
      const unquoted = JSON.parse(value)
      if (typeof unquoted === 'string' && (unquoted.startsWith('{') || unquoted.startsWith('['))) {
        try {
          const innerParsed = JSON.parse(unquoted)
          if (innerParsed && typeof innerParsed === 'object') {
            if (innerParsed.access_token || innerParsed.user || innerParsed.refresh_token) {
              console.warn('[Server Cookie] Corrigindo double-quote na leitura')
              return unquoted
            }
          }
        } catch {
          // String interna não é JSON válido
        }
      }
    } catch {
      // Continuar para próximas verificações
    }
  }

  // Caso 2: Valor parseado é uma string (double-serialization padrão)
  try {
    const parsed = JSON.parse(value)

    // Se o valor parseado é uma string, está double-serialized
    if (typeof parsed === 'string') {
      try {
        const innerParsed = JSON.parse(parsed)
        if (innerParsed && typeof innerParsed === 'object') {
          // Verificar se é uma sessão Supabase
          if (innerParsed.access_token || innerParsed.user || innerParsed.refresh_token) {
            console.warn('[Server Cookie] Corrigindo double-serialization na leitura')
            return JSON.stringify(innerParsed)
          }
        }
      } catch {
        // String interna não é JSON válido
        return null
      }
    }

    return value
  } catch {
    // Valor não é JSON, retornar como está
    return value
  }
}

/**
 * Previne double-serialization ao salvar cookies
 * Detecta múltiplos padrões de corrupção que podem ocorrer em diferentes browsers
 */
function validateCookieBeforeStore(value: string): string {
  // Caso 1: Valor já está double-serialized (começa e termina com aspas de string JSON)
  // Isso acontece quando JSON.stringify é chamado em uma string JSON
  // Ex: '"{\"access_token\":\"...\"}"' ao invés de '{"access_token":"..."}'
  if (value.startsWith('"') && value.endsWith('"') && value.length > 2) {
    try {
      const unquoted = JSON.parse(value)
      // Se após parse ainda é string e parece ser JSON de sessão
      if (typeof unquoted === 'string' && (unquoted.startsWith('{') || unquoted.startsWith('['))) {
        try {
          const innerParsed = JSON.parse(unquoted)
          if (innerParsed && typeof innerParsed === 'object') {
            if (innerParsed.access_token || innerParsed.user || innerParsed.refresh_token) {
              console.warn('[Server Cookie] Detectado double-quote na escrita, corrigindo')
              return unquoted // Retorna a string JSON sem as aspas extras
            }
          }
        } catch {
          // String interna não é JSON válido
        }
      }
    } catch {
      // Não é JSON válido, continuar para próximas verificações
    }
  }

  // Caso 2: Valor parseado é uma string (double-serialization padrão)
  try {
    const parsed = JSON.parse(value)

    // Se o valor parseado é uma string, alguém fez JSON.stringify duas vezes
    if (typeof parsed === 'string') {
      try {
        const innerParsed = JSON.parse(parsed)
        if (innerParsed && typeof innerParsed === 'object') {
          if (innerParsed.access_token || innerParsed.user || innerParsed.refresh_token) {
            console.warn('[Server Cookie] Prevenindo double-serialization na escrita')
            return JSON.stringify(innerParsed)
          }
        }
      } catch {
        // Não é JSON válido internamente
      }
    }

    return value
  } catch {
    // Valor não é JSON, retornar como está
    return value
  }
}

export async function createClient(cookieStore?: CookieStore): Promise<SupabaseClient<Database>> {
  const store = cookieStore ?? (await cookies())

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = store.get(name)?.value
          // Aplicar fix de double-serialization para cookies de auth
          if (name.startsWith('sb-') && value) {
            return fixCookieDoubleSerialization(value)
          }
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const normalized = withNormalizedCookieOptions(options)
            // Validar antes de salvar para cookies de auth
            const validatedValue = name.startsWith('sb-')
              ? validateCookieBeforeStore(value)
              : value
            store.set({ name, value: validatedValue, ...normalized })
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

export { withNormalizedCookieOptions, fixCookieDoubleSerialization, validateCookieBeforeStore }

/**
 * Cliente Supabase com service_role key para operações administrativas
 * ⚠️ USAR APENAS NO SERVIDOR - NUNCA NO CLIENTE
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
