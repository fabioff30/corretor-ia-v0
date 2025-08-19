import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'

/**
 * Admin Authentication Middleware
 * Protects admin routes with server-side session verification
 */

export async function adminAuthMiddleware(request: NextRequest) {
  try {
    // Check if this is an admin route
    const pathname = request.nextUrl.pathname
    
    if (!pathname.startsWith('/admin')) {
      return NextResponse.next()
    }
    
    // Allow access to login page
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }
    
    // Verify admin session
    const session = await getAdminSession()
    
    if (!session) {
      // Redirect to login page
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      
      return NextResponse.redirect(loginUrl)
    }
    
    // Add session info to headers for use in components
    const response = NextResponse.next()
    response.headers.set('x-admin-session', JSON.stringify(session))
    
    return response
  } catch (error) {
    console.error('Admin auth middleware error:', error)
    
    // Redirect to login on error
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * API Route Protection for Admin Endpoints
 */
export async function protectedAdminApiHandler(
  handler: (request: NextRequest, session: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // Verify admin session for API routes
      const session = await getAdminSession()
      
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required' },
          { status: 401 }
        )
      }
      
      // Call the protected handler with session
      return await handler(request, session)
    } catch (error) {
      console.error('Protected API handler error:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}