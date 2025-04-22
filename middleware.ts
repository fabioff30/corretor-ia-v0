import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)

  // Get the pathname from the URL
  const { pathname } = request.nextUrl

  // Set the canonical URL based on the current path
  const canonicalUrl = `https://corretordetextoonline.com.br${pathname}`

  // Add the Link header with rel=canonical
  requestHeaders.set("Link", `<${canonicalUrl}>; rel="canonical"`)

  // Return the response with the modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Only run the middleware on these paths
export const config = {
  matcher: [
    "/",
    "/recursos",
    "/blog",
    "/blog/:path*",
    "/sobre",
    "/contato",
    "/apoiar",
    "/privacidade",
    "/termos",
    "/cookies",
  ],
}
