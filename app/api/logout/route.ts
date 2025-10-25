/**
 * Rota temporária de logout para testes
 * Limpa os cookies de autenticação do Supabase
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()

  // Deletar todos os cookies do Supabase
  const allCookies = cookieStore.getAll()

  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.delete(cookie.name)
    }
  })

  // Redirecionar para home
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'))
}

export async function POST() {
  const cookieStore = await cookies()

  // Deletar todos os cookies do Supabase
  const allCookies = cookieStore.getAll()

  let deleted = 0
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.delete(cookie.name)
      deleted++
    }
  })

  return NextResponse.json({
    success: true,
    message: 'Logout realizado com sucesso',
    cookiesDeleted: deleted
  })
}
