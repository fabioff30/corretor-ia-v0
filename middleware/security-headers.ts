import { NextRequest, NextResponse } from 'next/server'

/**
 * Security Headers Middleware
 * Implements Content Security Policy and other security headers
 */

export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
    : '*.supabase.co'

  // Content Security Policy (production-hardened)
  const csp = [
    "default-src 'self'",
    [
      "script-src 'self' 'unsafe-inline'",
      "https://www.googletagmanager.com",
      "https://*.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://analytics.google.com",
      "https://ssl.google-analytics.com",
      "https://www.google.com",
      "https://connect.facebook.net",
      "https://www.clarity.ms",
      "https://static.cloudflareinsights.com",
      "https://js.stripe.com"
    ].join(' '),
    [
      "style-src 'self' 'unsafe-inline'",
      "https://fonts.googleapis.com"
    ].join(' '),
    [
      "img-src 'self' data: blob:",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://analytics.google.com",
      "https://ssl.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://*.googletagmanager.com",
      "https://www.google.com",
      "https://stats.g.doubleclick.net",
      "https://connect.facebook.net",
      "https://www.clarity.ms"
    ].join(' '),
    [
      "font-src 'self' data:",
      "https://fonts.gstatic.com"
    ].join(' '),
    [
      "connect-src 'self'",
      `https://${supabaseHost}`,
      "wss://*.supabase.co",
      "wss://*.supabase.in",
      "https://api.openai.com",
      "https://*.upstash.io",
      "wss://*.upstash.io",
      // Google Analytics & GTM
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://analytics.google.com",
      "https://ssl.google-analytics.com",
      "https://region1.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://*.googletagmanager.com",
      "https://stats.g.doubleclick.net",
      // Facebook & Others
      "https://connect.facebook.net",
      "https://www.clarity.ms",
      // Payment providers
      "https://api.stripe.com",
      "https://js.stripe.com",
      "https://api.mercadopago.com",
      "https://*.stripe.com"
    ].join(' '),
    [
      "frame-src 'self'",
      "https://js.stripe.com",
      "https://hooks.stripe.com",
      "https://www.googletagmanager.com",
      "https://connect.facebook.net"
    ].join(' '),
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'self'",
    ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()')

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

  const devCsp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', devCsp)

  return response
}
