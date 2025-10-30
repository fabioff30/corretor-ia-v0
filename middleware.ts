import type { NextRequest } from "next/server"
import { canonicalMiddleware } from "./middleware/canonical"
import { securityHeadersMiddleware, developmentCSP } from "./middleware/security-headers"
import { adminAuthMiddleware } from "./middleware/admin-auth"
import { updateSession } from "./lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  // 1. Update/refresh Supabase session first (critical for auth)
  // This ensures tokens are refreshed before any auth checks
  const supabaseResponse = await updateSession(request)

  // 2. Apply admin authentication middleware
  const adminAuthResponse = await adminAuthMiddleware(request)
  if (adminAuthResponse && adminAuthResponse.status !== 200) {
    return adminAuthResponse
  }

  // 3. Apply security headers to the response from updateSession
  const responseWithHeaders = process.env.NODE_ENV === 'development'
    ? developmentCSP(request)
    : securityHeadersMiddleware(request)

  // 4. Copy cookies from supabaseResponse to final response
  // This ensures refreshed tokens are sent to the client
  supabaseResponse.cookies.getAll().forEach(cookie => {
    responseWithHeaders.cookies.set(cookie)
  })

  // 5. Apply canonical URL middleware
  return canonicalMiddleware(request, responseWithHeaders)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - auth (OAuth callbacks and auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
