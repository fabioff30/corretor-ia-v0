import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCanonicalUrl } from "@/utils/canonical-url"

export function canonicalMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const response = NextResponse.next()

  // Build the canonical path with query parameters if needed
  let canonicalPath = url.pathname

  // Create search params object if they exist
  let searchParams: Record<string, string> | undefined
  if (url.search) {
    searchParams = Object.fromEntries(url.searchParams.entries())
  }

  // Generate canonical URL using the utility
  const canonicalUrl = getCanonicalUrl(canonicalPath, searchParams)

  // Add the canonical URL as a Link header
  response.headers.set("Link", `<${canonicalUrl}>; rel="canonical"`)

  return response
}
