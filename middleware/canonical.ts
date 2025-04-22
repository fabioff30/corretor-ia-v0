import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function canonicalMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const response = NextResponse.next()

  // Base canonical domain
  const canonicalDomain = "https://www.corretordetextoonline.com.br"

  // Build the canonical path with query parameters if needed
  let canonicalPath = url.pathname

  // Add search params for paginated pages or other query parameters that should be preserved
  if (url.search) {
    canonicalPath += url.search
  }

  // Construct the full canonical URL
  const canonicalUrl = `${canonicalDomain}${canonicalPath}`

  // Add the canonical URL as a Link header
  response.headers.set("Link", `<${canonicalUrl}>; rel="canonical"`)

  return response
}
