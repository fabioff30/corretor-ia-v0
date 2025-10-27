/**
 * Supabase Client para uso no Middleware
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'
import { withNormalizedCookieOptions } from '@/lib/supabase/server'

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
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          const normalized = withNormalizedCookieOptions(options)
          request.cookies.set({
            name,
            value,
            ...normalized,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
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

  // Refresh session se expirado - importante para sessões de longa duração
  await supabase.auth.getUser()

  return response
}
