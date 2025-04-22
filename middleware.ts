import type { NextRequest } from "next/server"
import { canonicalMiddleware } from "./middleware/canonical"

export function middleware(request: NextRequest) {
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
