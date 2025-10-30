import { NextRequest, NextResponse } from 'next/server'

/**
 * Security Headers Middleware
 * Implements Content Security Policy and other security headers
 */

export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Content Security Policy
  const csp = [
    // Default source remains scoped to our origin
    "default-src 'self'",

    // Allow all script, style, image, font and frame sources while keeping inline allowances
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *",
    "style-src 'self' 'unsafe-inline' *",
    "img-src 'self' data: blob: *",
    "font-src 'self' data: *",
    "frame-src 'self' *",

    // Permit any outbound connections (fetch, websockets, etc.)
    "connect-src 'self' *",

    // Worker sources for service workers
    "worker-src 'self' blob:",

    // Maintain critical protections
    "object-src 'none'",
    "base-uri 'self'",
    "form-action *",
    "frame-ancestors 'none'",

    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
  ].join('; ')
  
  // Set CSP header
  response.headers.set('Content-Security-Policy', csp)
  
  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Strict Transport Security for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  return response
}

/**
 * Relaxed CSP for development environment
 */
export function developmentCSP(request: NextRequest) {
  const response = NextResponse.next()
  
  // More permissive CSP for development
  const devCsp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *",
    "style-src 'self' 'unsafe-inline' *",
    "img-src 'self' data: blob: *",
    "font-src 'self' data: *",
    "connect-src 'self' *",
    "frame-src 'self' *",
    "worker-src 'self' blob:",
    "object-src 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', devCsp)
  
  return response
}
