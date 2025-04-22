import type { NextRequest } from "next/server"
import { canonicalMiddleware } from "./middleware/canonical"

export function middleware(request: NextRequest) {
  // Apply canonical URL headers
  return canonicalMiddleware(request)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|js|css).*)"],
}
