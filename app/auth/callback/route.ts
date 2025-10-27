/**
 * Callback de autenticação do Supabase
 * Processa o retorno do OAuth (Google) e confirmação de email
 * Suporta PKCE flow (code) e implicit flow (tokens no hash)
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function getSafeRedirectUrl(next: string | null, origin: string): URL {
  const fallback = new URL("/premium", origin) // Redirect to premium page to trigger PIX generation

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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const next = requestUrl.searchParams.get("next")

  console.log('[Auth Callback] Processing callback', {
    code: code ? 'present' : 'missing',
    error,
    error_description,
    searchParams: Array.from(requestUrl.searchParams.entries()),
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
    const supabase = await createClient()

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[Auth Callback] Exchange result', {
      success: !exchangeError,
      error: exchangeError?.message,
      hasSession: !!data.session,
      hasUser: !!data.user,
    })

    if (!exchangeError && data.session) {
      // Success - redirect to premium page (which will auto-generate PIX if pendingPixPlan exists)
      const redirectUrl = getSafeRedirectUrl(next, requestUrl.origin)
      console.log('[Auth Callback] Redirecting to:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    }

    console.error('[Auth Callback] Exchange failed:', exchangeError)
  }

  // If we get here, something went wrong
  console.error('[Auth Callback] No code provided or exchange failed')
  return NextResponse.redirect(
    new URL("/login?error=Erro ao autenticar. Tente novamente.", requestUrl.origin)
  )
}
