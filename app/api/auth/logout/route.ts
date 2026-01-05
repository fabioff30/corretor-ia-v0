/**
 * API Route: Logout
 * POST /api/auth/logout
 *
 * Handles user logout by:
 * 1. Revoking session in Supabase
 * 2. Clearing ALL Supabase cookies (critical for Next.js App Router)
 * 3. Returning success response
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const maxDuration = 30

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // 1. Revoke session in Supabase
    const { error } = await supabase.auth.signOut()

    // Log error but don't fail if session doesn't exist
    if (error && error.message !== 'Session from session_id claim in JWT does not exist') {
      console.error('[Logout] Supabase signOut error:', error)
    }

    // 2. ✅ CRITICAL: Manually clear ALL Supabase cookies
    // signOut() doesn't clear cookies in Next.js App Router
    const allCookies = cookieStore.getAll()

    // Remove all cookies that start with 'sb-' (Supabase cookies)
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        console.log('[Logout] Deleting cookie:', cookie.name)
        cookieStore.delete({
          name: cookie.name,
          path: '/',
        })
      }
    })

    console.log('[Logout] User logged out successfully, cookies cleared')

    // 3. Return success
    return NextResponse.json(
      { message: 'Logged out successfully' },
      {
        status: 200,
        headers: {
          // Ensure no caching of logout response
          'Cache-Control': 'no-store, must-revalidate',
        }
      }
    )
  } catch (error) {
    console.error('[Logout] Unexpected error:', error)

    // Still return 200 to prevent retries
    // Client will clear local state anyway
    return NextResponse.json(
      {
        message: 'Logout completed with errors',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    )
  }
}

// Allow OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  })
}
