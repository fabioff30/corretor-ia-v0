/**
 * Supabase Client para uso no Middleware
 *
 * IMPORTANTE: Usa o padrao getAll/setAll recomendado pela documentacao do @supabase/ssr
 * Isso evita problemas de double-serialization e race conditions
 *
 * @see https://supabase.com/docs/guides/auth/server-side/advanced-guide
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  // Criar response inicial
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Padrao recomendado: getAll/setAll
        // O SDK lida internamente com chunking e encoding
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Setar cookies no request (para proximas chamadas no mesmo request)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recriar response para incluir os novos cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          // Setar cookies na response (para enviar ao browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificar se existem cookies de auth antes de chamar getUser()
  // Isso evita tentativas desnecessarias de refresh apos logout
  const hasAuthCookies = request.cookies.getAll().some(
    cookie => cookie.name.startsWith('sb-') && cookie.value && cookie.value !== ''
  )

  if (hasAuthCookies) {
    // getUser() faz refresh automatico se o token estiver expirado
    const { error } = await supabase.auth.getUser()

    // Tratamento gracioso do erro de refresh token ja usado
    // Isso acontece em race conditions quando multiplos requests chegam simultaneamente
    if (error) {
      if (error.message?.includes('refresh_token_already_used') ||
          (error as any).code === 'refresh_token_already_used') {
        console.warn('[Middleware] Refresh token ja usado por outro request - ignorando')
        // NAO fazer nada - outro request ja atualizou os cookies
      } else {
        // Outros erros podem ser logados mas nao devem quebrar o fluxo
        console.error('[Middleware] Auth error:', error.message)
      }
    }
  }

  return supabaseResponse
}
