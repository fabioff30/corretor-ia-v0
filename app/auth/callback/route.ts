/**
 * Callback de autenticação do Supabase
 * Processa o retorno do OAuth (Google) e confirmação de email
 * Suporta PKCE flow (code) usando @supabase/ssr
 *
 * IMPORTANT: This must be a Route Handler (route.ts), not a Page (page.tsx)
 * to properly set cookies before redirect
 */

import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { createClient, fixCookieDoubleSerialization, withNormalizedCookieOptions } from '@/lib/supabase/server'

/**
 * Detecta se o request vem de um dispositivo mobile via User-Agent
 */
function isMobileUserAgent(request: NextRequest | Request): boolean {
  const ua = request.headers.get('user-agent') || ''
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
}

/**
 * Verifica e corrige cookies de sessão após serem setados
 * Importante para Firefox que pode aplicar double-serialization
 */
async function verifyCookiesAfterLogin(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<void> {
  try {
    const allCookies = cookieStore.getAll()

    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-') && cookie.value) {
        const fixed = fixCookieDoubleSerialization(cookie.value)
        if (fixed && fixed !== cookie.value) {
          console.log('[Auth Callback] Corrigindo cookie double-serialized:', cookie.name)
          const options = withNormalizedCookieOptions({})
          cookieStore.set({
            name: cookie.name,
            value: fixed,
            ...options,
          })
        }
      }
    }
  } catch (error) {
    console.error('[Auth Callback] Erro ao verificar cookies:', error)
  }
}

function getSafeRedirectUrl(next: string | null, origin: string, defaultPath: string = "/dashboard"): URL {
  // Redirecionar para o defaultPath por padrão após login
  const fallback = new URL(defaultPath, origin)

  if (!next) {
    return fallback
  }

  const trimmed = next.trim()

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback
  }

  try {
    const url = new URL(trimmed, origin)

    if (url.origin !== origin) {
      return fallback
    }

    return url
  } catch {
    return fallback
  }
}

export async function GET(request: NextRequest | Request) {
  const requestUrl = request instanceof NextRequest ? request.nextUrl : new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next')

  console.log('[Auth Callback] Processing callback', {
    url: requestUrl.toString(),
    code: code ? 'present' : 'missing',
    error,
    error_description,
    next,
  })

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, error_description)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    )
  }

  // Handle PKCE flow (code exchange)
  if (code) {
    let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null
    try {
      cookieStore = await cookies()
    } catch {
      // In tests or non-Next request contexts, cookies() is unavailable
      cookieStore = {
        getAll: () => [],
        get: () => undefined,
        set: () => {},
        delete: () => {},
        has: () => false,
        clear: () => {},
        toString: () => '',
      } as unknown as Awaited<ReturnType<typeof cookies>>
    }

    // ✅ Create Supabase client with explicit cookie handlers
    // This ensures cookies are properly set in the response
    const supabase = await createClient(cookieStore)

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Exchange failed:', exchangeError.message)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Erro ao autenticar. Tente novamente.')}`, requestUrl.origin)
      )
    }

    // Verificar e corrigir cookies após login (importante para Firefox)
    await verifyCookiesAfterLogin(cookieStore)

    // Success - redirect para home no mobile, dashboard no desktop
    const defaultRedirect = isMobileUserAgent(request) ? "/" : "/dashboard"
    const redirectUrl = getSafeRedirectUrl(next, requestUrl.origin, defaultRedirect)
    console.log('[Auth Callback] Login successful! Redirecting to:', redirectUrl.toString(), '(mobile:', isMobileUserAgent(request), ')')

    return NextResponse.redirect(redirectUrl)
  }

  // If we get here, something went wrong
  console.error('[Auth Callback] No code provided')
  return NextResponse.redirect(
    new URL('/login?error=Código de autenticação não fornecido', requestUrl.origin)
  )
}
