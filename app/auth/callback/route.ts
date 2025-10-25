/**
 * Callback de autenticação do Supabase
 * Processa o retorno do OAuth (Google) e confirmação de email
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirecionar para o dashboard ou URL especificada (sanitizada)
      const redirectUrl = getSafeRedirectUrl(next, requestUrl.origin)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Se houver erro, redirecionar para login com mensagem de erro
  return NextResponse.redirect(
    new URL("/login?error=Erro ao autenticar. Tente novamente.", requestUrl.origin)
  )
}
