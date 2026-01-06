import { NextRequest, NextResponse } from 'next/server'

/**
 * Security Headers Middleware
 * Implements Content Security Policy and other security headers
 *
 * CSP Reference:
 * - Google GTM/GA4: https://developers.google.com/tag-platform/security/guides/csp
 * - Google Funding Choices: https://developers.google.com/funding-choices/csp
 * - Stripe: https://docs.stripe.com/security/guide
 * - Mercado Pago: https://github.com/mercadopago/sdk-js/discussions/16
 * - Meta CAPI Gateway: https://developers.facebook.com/docs/marketing-api/conversions-api/guides/gateway
 * - Microsoft Clarity/Bing: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-csp
 * - Brevo: https://developers.brevo.com/docs/getting-started
 */

export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
    : '*.supabase.co'

  // Content Security Policy (production-hardened)
  const csp = [
    "default-src 'self'",

    // Scripts - all JavaScript sources (relaxed for Google ecosystem)
    [
      "script-src 'self' 'unsafe-inline'",
      // Google (all services: GTM, Analytics, Ads, Sign-In, APIs, etc.)
      "https://*.google.com",
      "https://*.google.com.br",
      "https://*.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://*.googlesyndication.com",
      "https://*.googleadservices.com",
      "https://*.doubleclick.net",
      "https://*.adtrafficquality.google",
      "https://accounts.google.com",
      "https://apis.google.com",
      // Meta/Facebook Pixel
      "https://connect.facebook.net",
      // Microsoft Clarity & Bing Ads
      "https://*.clarity.ms",
      "https://*.bing.com",
      // Cloudflare
      "https://static.cloudflareinsights.com",
      // Stripe
      "https://*.stripe.com",
      // Mercado Pago
      "https://*.mercadopago.com",
      "https://*.mlstatic.com",
      // Brevo (email marketing via GTM)
      "https://*.brevo.com",
      "https://sibautomation.com",
      "https://*.sibautomation.com",
      // WonderPush (push notifications via Brevo)
      "https://*.wonderpush.com",
    ].join(' '),

    // Styles (relaxed for Google Sign-In)
    [
      "style-src 'self' 'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://*.google.com",
      "https://accounts.google.com",
    ].join(' '),

    // Images (relaxed for third-party services)
    [
      "img-src 'self' data: blob:",
      // Own blog subdomain
      "https://blog.corretordetextoonline.com.br",
      // Google (all services)
      "https://*.google.com",
      "https://*.google.com.br",
      "https://*.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://*.googlesyndication.com",
      "https://*.googleadservices.com",
      "https://*.doubleclick.net",
      "https://*.gstatic.com",
      // Meta/Facebook
      "https://*.facebook.com",
      "https://*.facebook.net",
      // Microsoft
      "https://*.clarity.ms",
      "https://*.bing.com",
      // Stripe
      "https://*.stripe.com",
      // Mercado Pago
      "https://*.mercadopago.com",
      "https://*.mlstatic.com",
    ].join(' '),

    // Fonts
    [
      "font-src 'self' data:",
      "https://fonts.gstatic.com",
    ].join(' '),

    // API/XHR connections (relaxed for third-party services)
    [
      "connect-src 'self'",
      // Own blog subdomain
      "https://blog.corretordetextoonline.com.br",
      // Supabase
      `https://${supabaseHost}`,
      "wss://*.supabase.co",
      "wss://*.supabase.in",
      // OpenAI
      "https://api.openai.com",
      // Upstash Redis
      "https://*.upstash.io",
      "wss://*.upstash.io",
      // Google (all services: Analytics, GTM, Ads, Sign-In, etc.)
      "https://*.google.com",
      "https://*.google.com.br",
      "https://*.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://*.googlesyndication.com",
      "https://*.googleadservices.com",
      "https://*.doubleclick.net",
      "https://*.adtrafficquality.google",
      "https://accounts.google.com",
      // Meta/Facebook Pixel & CAPI Gateway
      "https://*.facebook.com",
      "https://*.facebook.net",
      "https://*.run.app",
      "https://*.conversionsapigateway.com",
      // Microsoft Clarity & Bing Ads
      "https://*.clarity.ms",
      "https://*.bing.com",
      // Stripe
      "https://*.stripe.com",
      // Mercado Pago
      "https://*.mercadopago.com",
      "https://*.mlstatic.com",
      // Brevo (email marketing)
      "https://*.brevo.com",
      "https://*.sendinblue.com",
      "https://*.sibautomation.com",
      // WonderPush (push notifications via Brevo)
      "https://*.wonderpush.com",
    ].join(' '),

    // Iframes (relaxed for third-party services)
    [
      "frame-src 'self'",
      // Own domain (for www/non-www compatibility)
      "https://corretordetextoonline.com.br",
      "https://www.corretordetextoonline.com.br",
      // Google (all services: GTM, Ads, Sign-In, Funding Choices, SODAR, etc.)
      "https://*.google.com",
      "https://*.googletagmanager.com",
      "https://*.googlesyndication.com",
      "https://*.doubleclick.net",
      "https://*.adtrafficquality.google",
      "https://accounts.google.com",
      // Meta/Facebook
      "https://*.facebook.com",
      "https://*.facebook.net",
      // Stripe
      "https://*.stripe.com",
      // Mercado Pago
      "https://*.mercadopago.com",
    ].join(' '),

    // Workers (Service Workers, Web Workers)
    "worker-src 'self' blob:",

    // Objects (Flash, Java - block all)
    "object-src 'none'",

    // Base URI
    "base-uri 'self'",

    // Form submissions
    [
      "form-action 'self'",
      // Stripe
      "https://js.stripe.com",
      "https://hooks.stripe.com",
      "https://checkout.stripe.com",
      // Mercado Pago
      "https://*.mercadopago.com",
      // Meta/Facebook Pixel
      "https://www.facebook.com",
      "https://connect.facebook.net",
    ].join(' '),

    // Frame ancestors (who can embed us)
    "frame-ancestors 'self'",

    // Upgrade HTTP to HTTPS in production
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
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* https:",
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', devCsp)

  return response
}
