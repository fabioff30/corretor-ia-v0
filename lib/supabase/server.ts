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
 * Tenta desserializar recursivamente até encontrar um objeto de sessão válido
 * Isso é necessário porque Safari/Firefox podem aplicar múltiplas camadas de serialização
 */
function deepUnserialize(value: string, depth: number = 0): { found: boolean; value: string } {
  // Limitar profundidade para evitar loops infinitos
  if (depth > 5) return { found: false, value }

  try {
    const parsed = JSON.parse(value)

    // Se chegamos em um objeto com dados de sessão, sucesso!
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.access_token || parsed.user || parsed.refresh_token) {
        return { found: true, value: JSON.stringify(parsed) }
      }
    }

    // Se ainda é uma string, continuar desserializando
    if (typeof parsed === 'string') {
      return deepUnserialize(parsed, depth + 1)
    }

    // Não é sessão válida, retornar original
    return { found: false, value }
  } catch {
    // Não é JSON válido
    return { found: false, value }
  }
}

/**
 * Corrige double-serialization em cookies de sessão do Supabase
 * Problema: TypeError: Cannot create property 'user' on string
 * Causa: JSON.stringify aplicado duas vezes (ou mais) resulta em string ao invés de objeto
 *
 * Esta função usa desserialização recursiva para lidar com múltiplas camadas
 * de serialização que podem ocorrer em Safari/Firefox/iOS
 */
function fixCookieDoubleSerialization(value: string | null): string | null {
  if (!value) return null

  // Verificar se parece ser um cookie de sessão (contém access_token em algum lugar)
  if (!value.includes('access_token') && !value.includes('refresh_token')) {
    return value
  }

  // Log para debug em produção (temporário)
  const preview = value.length > 100 ? value.substring(0, 100) + '...' : value
  console.log('[Server Cookie] Verificando valor (primeiros 100 chars):', preview)

  // Tentar desserialização recursiva
  const result = deepUnserialize(value, 0)

  if (result.found && result.value !== value) {
    console.warn('[Server Cookie] Corrigido double-serialization na leitura (detectado via deep parse)')
    return result.value
  }

  // Se não encontrou via deep parse, verificar padrões específicos

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
 * Usa desserialização recursiva para garantir que salvamos sempre o formato correto
 */
function validateCookieBeforeStore(value: string): string {
  // Verificar se parece ser um cookie de sessão
  if (!value.includes('access_token') && !value.includes('refresh_token')) {
    return value
  }

  // Log para debug
  const preview = value.length > 100 ? value.substring(0, 100) + '...' : value
  console.log('[Server Cookie] Validando antes de salvar (primeiros 100 chars):', preview)

  // Usar desserialização recursiva para encontrar o objeto real
  const result = deepUnserialize(value, 0)

  if (result.found && result.value !== value) {
    console.warn('[Server Cookie] Corrigido double-serialization na escrita (detectado via deep parse)')
    return result.value
  }

  // Caso 1: Valor já está double-serialized (começa e termina com aspas de string JSON)
  if (value.startsWith('"') && value.endsWith('"') && value.length > 2) {
    try {
      const unquoted = JSON.parse(value)
      if (typeof unquoted === 'string' && (unquoted.startsWith('{') || unquoted.startsWith('['))) {
        try {
          const innerParsed = JSON.parse(unquoted)
          if (innerParsed && typeof innerParsed === 'object') {
            if (innerParsed.access_token || innerParsed.user || innerParsed.refresh_token) {
              console.warn('[Server Cookie] Detectado double-quote na escrita, corrigindo')
              return unquoted
            }
          }
        } catch {
          // String interna não é JSON válido
        }
      }
    } catch {
      // Não é JSON válido
    }
  }

  // Caso 2: Valor parseado é uma string
  try {
    const parsed = JSON.parse(value)
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
