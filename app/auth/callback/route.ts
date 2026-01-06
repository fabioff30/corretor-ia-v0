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
import { createClient } from '@/lib/supabase/server'

function getSafeRedirectUrl(next: string | null, origin: string): URL {
  // Redirecionar para /dashboard por padrão após login
  const fallback = new URL("/dashboard", origin)

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

    // Success - redirect para home (o TextCorrectionForm detecta automaticamente o plano)
    const redirectUrl = getSafeRedirectUrl(next, requestUrl.origin)
    console.log('[Auth Callback] Login successful! Redirecting to:', redirectUrl.toString())

    return NextResponse.redirect(redirectUrl)
  }

  // If we get here, something went wrong
  console.error('[Auth Callback] No code provided')
  return NextResponse.redirect(
    new URL('/login?error=Código de autenticação não fornecido', requestUrl.origin)
  )
}
