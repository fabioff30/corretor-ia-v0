import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Admin Authentication Middleware
 * Protects admin routes with Supabase authentication and plan verification
 */

export async function adminAuthMiddleware(request: NextRequest) {
  try {
    // Check if this is an admin route
    const pathname = request.nextUrl.pathname

    if (!pathname.startsWith('/admin')) {
      return NextResponse.next()
    }

    // Allow access to old login page (for backward compatibility)
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Create Supabase client for middleware
    const response = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Redirect to main login page
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('message', 'Admin access requires authentication')

      return NextResponse.redirect(loginUrl)
    }

    // Get user profile to check plan type
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      // Redirect to login if profile not found
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('message', 'Profile not found')

      return NextResponse.redirect(loginUrl)
    }

    // Check if user has admin plan
    if (profile.plan_type !== 'admin') {
      // Redirect to dashboard for non-admin users
      const dashboardUrl = new URL('/dashboard', request.url)
      dashboardUrl.searchParams.set('message', 'Admin access required')

      return NextResponse.redirect(dashboardUrl)
    }

    // User is authenticated and has admin plan - allow access
    return response
  } catch (error) {
    console.error('Admin auth middleware error:', error)

    // Redirect to login on error
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('message', 'Authentication error')

    return NextResponse.redirect(loginUrl)
  }
}

/**
 * API Route Protection for Admin Endpoints
 * Note: API routes should use getCurrentUserWithProfile from auth-helpers.ts instead
 * This function is kept for backward compatibility
 */
export async function protectedAdminApiHandler(
  handler: (request: NextRequest, session: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // This is deprecated - API routes should use auth-helpers.ts instead
      console.warn('protectedAdminApiHandler is deprecated. Use getCurrentUserWithProfile from auth-helpers.ts')

      return NextResponse.json(
        { error: 'This endpoint is deprecated. Please use Supabase authentication.' },
        { status: 500 }
      )
    } catch (error) {
      console.error('Protected API handler error:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}
