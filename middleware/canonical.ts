import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCanonicalUrl } from "@/utils/canonical-url"

export function canonicalMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const canonicalUrl = new URL(CANONICAL_DOMAIN)
  const canonicalHost = canonicalUrl.host
  const canonicalProtocol = canonicalUrl.protocol
  const requestHost = url.host

  // Enforce canonical host in production to keep cookies consistent
  const vercelEnv = process.env.VERCEL_ENV
  const isPreview = vercelEnv === 'preview' || requestHost.endsWith('.vercel.app')

  if (
    process.env.NODE_ENV === 'production' &&
    !isPreview &&
    requestHost !== canonicalHost &&
    requestHost !== 'localhost'
  ) {
    url.host = canonicalHost
    url.protocol = canonicalProtocol
    return NextResponse.redirect(url, 308)
  }

  const response = NextResponse.next()

  // Build the canonical path with query parameters if needed
  let canonicalPath = url.pathname

  // Create search params object if they exist
  let searchParams: Record<string, string> | undefined
  if (url.search) {
    searchParams = Object.fromEntries(url.searchParams.entries())
  }

  // Generate canonical URL using the utility
  const canonicalHref = getCanonicalUrl(canonicalPath, searchParams)

  // Add the canonical URL as a Link header
  response.headers.set("Link", `<${canonicalHref}>; rel="canonical"`)

  return response
}
