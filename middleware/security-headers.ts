import { NextRequest, NextResponse } from 'next/server'

/**
 * Security Headers Middleware
 * Implements Content Security Policy and other security headers
 */

export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Content Security Policy
  const csp = [
    // Default source
    "default-src 'self'",
    
    // Script sources - allow inline scripts for Next.js and specific external scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
    "https://www.googletagmanager.com " +
    "https://www.google-analytics.com " +
    "https://accounts.google.com " +
    "https://www.gstatic.com " +
    "https://connect.facebook.net " +
    "https://static.hotjar.com " +
    "https://pagead2.googlesyndication.com " +
    "https://scripts.cleverwebserver.com " +
    "https://www.mercadopago.com " +
    "https://js.stripe.com",
    
    // Style sources
    "style-src 'self' 'unsafe-inline' " +
    "https://fonts.googleapis.com " +
    "https://www.mercadopago.com",
    
    // Font sources
    "font-src 'self' " +
    "https://fonts.gstatic.com " +
    "data:",
    
    // Image sources
    "img-src 'self' data: blob: " +
    "https://*.vercel-storage.com " +
    "https://www.facebook.com " +
    "https://www.google-analytics.com " +
    "https://pagead2.googlesyndication.com " +
    "https://tpc.googlesyndication.com " +
    "https://*.wordpress.com " +
    "https://*.wp.com " +
    "https://secure.gravatar.com",
    
    // Connect sources for API calls
    "connect-src 'self' " +
    "https://www.google-analytics.com " +
    "https://stats.g.doubleclick.net " +
    "https://www.facebook.com " +
    "https://vitals.vercel-insights.com " +
    "https://api.mercadopago.com " +
    "https://my-corretoria.vercel.app " +
    "https://*.vercel.app " +
    "https://auto.ffmedia.com.br " +
    "https://workers-api.fabiofariasf.workers.dev " +
    "https://*.supabase.co " +
    "wss://www.hotjar.com " +
    "wss://*.supabase.co " +
    "wss://*.vercel.app " +
    "https://*.vercel-insights.com " +
    "https://*.upstash.io",
    
    // Frame sources
    "frame-src 'self' " +
    "https://www.mercadopago.com " +
    "https://js.stripe.com " +
    "https://checkout.stripe.com " +
    "https://accounts.google.com " +
    "https://vars.hotjar.com",
    
    // Worker sources for service workers
    "worker-src 'self' blob:",
    
    // Object sources (disable for security)
    "object-src 'none'",
    
    // Base URI restriction
    "base-uri 'self'",
    
    // Form action restriction
    "form-action 'self' " +
    "https://api.mercadopago.com " +
    "https://checkout.stripe.com",
    
    // Frame ancestors (clickjacking protection)
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
  response.headers.set('Permissions-Policy', 
    'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), ' +
    'cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), ' +
    'execution-while-not-rendered=(), execution-while-out-of-viewport=(), ' +
    'fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), ' +
    'microphone=(), midi=(), navigation-override=(), payment=(self), ' +
    'picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), ' +
    'sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()'
  )
  
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
