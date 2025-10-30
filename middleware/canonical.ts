import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCanonicalUrl, CANONICAL_DOMAIN } from "@/utils/canonical-url"

export function canonicalMiddleware(request: NextRequest, response?: NextResponse) {
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
    const redirectResponse = NextResponse.redirect(url, 308)

    if (response) {
      response.cookies.getAll().forEach(cookie => {
        const { name, value, ...options } = cookie
        redirectResponse.cookies.set(name, value, options)
      })
    }

    return redirectResponse
  }

  const targetResponse = response ?? NextResponse.next()

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
  targetResponse.headers.set("Link", `<${canonicalHref}>; rel="canonical"`)

  return targetResponse
}
