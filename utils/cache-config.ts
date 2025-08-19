/**
 * Cache Configuration
 * Optimized caching strategy for better performance and security
 */

export const CACHE_CONFIG = {
  // Blog content caching (increased from 5 minutes to optimize performance)
  BLOG_POSTS: {
    revalidate: 15 * 60, // 15 minutes for better performance vs freshness balance
    staleWhileRevalidate: 30 * 60, // 30 minutes stale-while-revalidate
  },
  
  // WordPress API caching
  WORDPRESS_API: {
    revalidate: 10 * 60, // 10 minutes (reduced from 5 for better performance)
    maxAge: 20 * 60, // 20 minutes browser cache
  },
  
  // Static assets caching
  STATIC_ASSETS: {
    images: 24 * 60 * 60, // 24 hours for images
    fonts: 7 * 24 * 60 * 60, // 7 days for fonts
    scripts: 24 * 60 * 60, // 24 hours for scripts
  },
  
  // API responses caching
  API_RESPONSES: {
    correction: 0, // No cache for corrections (dynamic content)
    stats: 5 * 60, // 5 minutes for stats
    ratingStats: 15 * 60, // 15 minutes for rating stats
  },
  
  // Sitemap caching
  SITEMAP: {
    revalidate: 60 * 60, // 1 hour (more frequent than before)
    maxAge: 2 * 60 * 60, // 2 hours browser cache
  },
}

/**
 * Get cache headers for API responses
 */
export function getCacheHeaders(type: keyof typeof CACHE_CONFIG.API_RESPONSES): Record<string, string> {
  const maxAge = CACHE_CONFIG.API_RESPONSES[type]
  
  if (maxAge === 0) {
    return {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  }
  
  return {
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    'Expires': new Date(Date.now() + maxAge * 1000).toUTCString(),
  }
}

/**
 * Get optimized revalidation time based on content type
 */
export function getRevalidationTime(contentType: string): number {
  switch (contentType) {
    case 'blog-post':
      return CACHE_CONFIG.BLOG_POSTS.revalidate
    case 'wordpress-api':
      return CACHE_CONFIG.WORDPRESS_API.revalidate
    case 'sitemap':
      return CACHE_CONFIG.SITEMAP.revalidate
    case 'rating-stats':
      return CACHE_CONFIG.API_RESPONSES.ratingStats
    default:
      return 5 * 60 // 5 minutes default
  }
}

/**
 * Cache warming strategy for critical content
 */
export const CACHE_WARMING = {
  // Critical pages to warm on deployment
  criticalPages: [
    '/',
    '/blog',
    '/recursos',
    '/sobre',
  ],
  
  // API endpoints to warm
  criticalAPIs: [
    '/api/rating-stats',
  ],
  
  // Warm cache interval (for scheduled jobs)
  warmingInterval: 30 * 60 * 1000, // 30 minutes
}

/**
 * Performance optimizations for different environments
 */
export const PERFORMANCE_CONFIG = {
  // Timeout configurations (already optimized in constants.ts)
  timeouts: {
    api: 30000, // 30 seconds (reduced from 60s)
    fetch: 25000, // 25 seconds (reduced from 55s)
    database: 10000, // 10 seconds for DB operations
  },
  
  // Pagination limits
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    blogPostsPerPage: 12,
  },
  
  // Content limits
  limits: {
    textCorrection: 5000, // characters
    blogPostExcerpt: 300, // characters
    searchResults: 50, // items
  },
  
  // Compression settings
  compression: {
    enabled: true,
    threshold: 1024, // bytes
    level: 6, // compression level
  },
}

/**
 * CDN and static asset optimization
 */
export const CDN_CONFIG = {
  // Image optimization
  images: {
    formats: ['webp', 'avif', 'jpeg'],
    sizes: [640, 768, 1024, 1280, 1920],
    quality: 85,
  },
  
  // Font optimization
  fonts: {
    display: 'swap',
    preload: ['Inter-Regular.woff2'],
  },
  
  // External resources
  external: {
    googleFonts: 'https://fonts.googleapis.com',
    googleAnalytics: 'https://www.google-analytics.com',
    mercadoPago: 'https://www.mercadopago.com',
  },
}