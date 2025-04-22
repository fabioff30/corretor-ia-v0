import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function canonicalMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const response = NextResponse.next()

  // Determine the canonical URL
  let canonicalUrl = `https://www.corretordetextoonline.com.br${url.pathname}`

  // Add search params for paginated pages
  if (url.pathname === "/blog" && url.searchParams.has("page")) {
    canonicalUrl += `?page=${url.searchParams.get("page")}`
  }

  // Add the canonical URL as a Link header
  response.headers.set("Link", `<${canonicalUrl}>; rel="canonical"`)

  return response
}
