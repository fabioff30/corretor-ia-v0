/**
 * Supabase Client para uso no Middleware
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'
import { withNormalizedCookieOptions, fixCookieDoubleSerialization, validateCookieBeforeStore } from '@/lib/supabase/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value
          // Aplicar fix de double-serialization para cookies de auth
          if (name.startsWith('sb-') && value) {
            return fixCookieDoubleSerialization(value)
          }
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          const normalized = withNormalizedCookieOptions(options)
          // Validar antes de salvar para cookies de auth
          const validatedValue = name.startsWith('sb-')
            ? validateCookieBeforeStore(value)
            : value
          request.cookies.set({
            name,
            value: validatedValue,
            ...normalized,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: validatedValue,
            ...normalized,
          })
        },
        remove(name: string, options: CookieOptions) {
          const normalized = withNormalizedCookieOptions(options)
          request.cookies.set({
            name,
            value: '',
            ...normalized,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...normalized,
          })
        },
      },
    }
  )

  // Check if Supabase auth cookies exist before calling getUser()
  // This prevents unnecessary refresh attempts after logout
  const hasAuthCookies = request.cookies.getAll().some(cookie =>
    cookie.name.startsWith('sb-') && cookie.value && cookie.value !== ''
  )

  if (hasAuthCookies) {
    // Refresh session se expirado - importante para sessões de longa duração
    await supabase.auth.getUser()
  }

  return response
}
