import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define the canonical domain
const CANONICAL_DOMAIN = "https://www.corretordetextoonline.com.br"

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const url = request.nextUrl.clone()

  // Create the canonical URL by combining the canonical domain with the current path
  const canonicalUrl = `${CANONICAL_DOMAIN}${url.pathname}`

  // Set the Link header with rel=canonical
  requestHeaders.set("Link", `<${canonicalUrl}>; rel="canonical"`)

  // Return the response with the updated headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|js|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
}
