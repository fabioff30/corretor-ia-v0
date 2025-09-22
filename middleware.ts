import type { NextRequest } from "next/server"
import { canonicalMiddleware } from "./middleware/canonical"
import { securityHeadersMiddleware, developmentCSP } from "./middleware/security-headers"
import { supabaseAuthMiddleware } from "./middleware/supabase-auth"

export async function middleware(request: NextRequest) {
  // Apply Supabase authentication middleware first
  const authResponse = await supabaseAuthMiddleware(request)
  if (authResponse && authResponse.status !== 200) {
    return authResponse
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
     * - admin (admin pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|admin|_next/static|_next/image|favicon.ico).*)",
  ],
}
