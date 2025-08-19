import { NextRequest, NextResponse } from 'next/server'
import { validateAdminPassword, setAdminSession, clearAdminSession, getAdminSession } from '@/lib/auth'
import { rateLimiter } from '@/middleware/rate-limit'

/**
 * Admin Authentication API
 * Secure server-side authentication for admin users
 */

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent brute force attacks
    const rateLimitResponse = await rateLimiter(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { action, password } = await request.json()

    switch (action) {
      case 'login':
        if (!password) {
          return NextResponse.json(
            { error: 'Password is required' },
            { status: 400 }
          )
        }

        if (!validateAdminPassword(password)) {
          // Log failed login attempt
          console.warn('Failed admin login attempt from IP:', 
            request.ip || request.headers.get('x-forwarded-for') || 'unknown'
          )
          
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          )
        }

        // Create secure session
        await setAdminSession()
        
        console.log('Successful admin login from IP:', 
          request.ip || request.headers.get('x-forwarded-for') || 'unknown'
        )

        return NextResponse.json({
          success: true,
          message: 'Authentication successful'
        })

      case 'logout':
        clearAdminSession()
        return NextResponse.json({
          success: true,
          message: 'Logged out successfully'
        })

      case 'verify':
        const session = await getAdminSession()
        return NextResponse.json({
          authenticated: !!session,
          user: session
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check current session
    const session = await getAdminSession()
    
    return NextResponse.json({
      authenticated: !!session,
      user: session
    })
  } catch (error) {
    console.error('Admin session check error:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    )
  }
}