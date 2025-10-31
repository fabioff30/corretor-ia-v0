/**
 * Callback de autenticação do Supabase
 * Processa o retorno do OAuth (Google) e confirmação de email
 * Suporta PKCE flow (code) usando @supabase/ssr
 *
 * IMPORTANT: This must be a Route Handler (route.ts), not a Page (page.tsx)
 * to properly set cookies before redirect
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

function getSafeRedirectUrl(next: string | null, origin: string): URL {
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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
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
    const cookieStore = await cookies()

    // ✅ Create Supabase client with explicit cookie handlers
    // This ensures cookies are properly set in the response
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, {
                  ...options,
                  httpOnly: false,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  path: '/',
                  maxAge: 60 * 60 * 24 * 7,
                })
              })
            } catch (error) {
              // Cookies may have already been set
              console.warn('[Auth Callback] Cookie set error (may be expected):', error)
            }
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Exchange failed:', exchangeError.message)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Erro ao autenticar. Tente novamente.')}`, requestUrl.origin)
      )
    }

    // Success - redirect
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
