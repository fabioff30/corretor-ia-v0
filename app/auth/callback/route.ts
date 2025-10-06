/**
 * Callback de autenticação do Supabase
 * Processa o retorno do OAuth (Google) e confirmação de email
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirecionar para o dashboard ou URL especificada
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Se houver erro, redirecionar para login com mensagem de erro
  return NextResponse.redirect(
    new URL('/login?error=Erro ao autenticar. Tente novamente.', requestUrl.origin)
  )
}
