import type { NextRequest } from "next/server"
import { canonicalMiddleware } from "./middleware/canonical"
import { securityHeadersMiddleware, developmentCSP } from "./middleware/security-headers"
import { adminAuthMiddleware } from "./middleware/admin-auth"

export async function middleware(request: NextRequest) {
  // Apply admin authentication middleware first
  const adminAuthResponse = await adminAuthMiddleware(request)
  if (adminAuthResponse && adminAuthResponse.status !== 200) {
    return adminAuthResponse
  }
  
  // Apply security headers
  const securityResponse = process.env.NODE_ENV === 'development' 
    ? await developmentCSP(request) 
    : await securityHeadersMiddleware(request)
  
  // Apply canonical URL middleware
  return canonicalMiddleware(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
