import sanitizeHtmlLib from 'sanitize-html'

/**
 * HTML Sanitization Utility
 * Provides secure HTML sanitization for user-generated and external content
 * Uses sanitize-html which is CommonJS compatible and works on Vercel serverless
 */

/**
 * Configuration for different sanitization levels
 */
export const SANITIZE_CONFIG = {
  // Strict: Only basic formatting allowed
  STRICT: {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
    allowedAttributes: {},
  },

  // Blog content: More permissive for blog posts
  BLOG: {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div',
      'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'pre', 'code'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'class'],
      'div': ['class', 'id'],
      'span': ['class', 'id'],
      'p': ['class'],
      'h1': ['class', 'id'],
      'h2': ['class', 'id'],
      'h3': ['class', 'id'],
      'h4': ['class', 'id'],
      'h5': ['class', 'id'],
      'h6': ['class', 'id'],
      'pre': ['class'],
      'code': ['class'],
      'table': ['class'],
      'figure': ['class'],
      'blockquote': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  },

  // Default: Balanced security and functionality
  DEFAULT: {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      'a': ['href'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  }
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(
  html: string,
  config: keyof typeof SANITIZE_CONFIG = 'DEFAULT'
): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  try {
    const sanitizeConfig = SANITIZE_CONFIG[config]
    return sanitizeHtmlLib(html, sanitizeConfig)
  } catch (error) {
    console.error('HTML sanitization error:', error)
    return ''
  }
}

/**
 * Sanitize HTML content specifically for blog posts
 */
export function sanitizeBlogContent(html: string): string {
  return sanitizeHtml(html, 'BLOG')
}

/**
 * Sanitize user input content (strict)
 */
export function sanitizeUserInput(html: string): string {
  return sanitizeHtml(html, 'STRICT')
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  try {
    const stripped = sanitizeHtmlLib(html, {
      allowedTags: [],
      allowedAttributes: {},
    })
    return stripped.replace(/\s+/g, ' ').trim()
  } catch (error) {
    console.error('HTML stripping error:', error)
    return ''
  }
}

/**
 * Validate if a string contains potentially dangerous content
 */
export function containsDangerousContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }

  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /vbscript:/i,
    /data:[^,]*script/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<link[^>]*>/i,
    /<meta[^>]*>/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ]

  return dangerousPatterns.some(pattern => pattern.test(content))
}

/**
 * Safe HTML renderer hook for React components
 */
export function createSafeHtml(html: string, config?: keyof typeof SANITIZE_CONFIG) {
  const sanitizedHtml = sanitizeHtml(html, config)
  return {
    __html: sanitizedHtml
  }
}
