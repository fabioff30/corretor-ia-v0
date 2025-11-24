import DOMPurify from 'isomorphic-dompurify'

/**
 * HTML Sanitization Utility
 * Provides secure HTML sanitization for user-generated and external content
 * Uses isomorphic-dompurify which works on both client and server
 */

/**
 * Configuration for different sanitization levels
 */
export const SANITIZE_CONFIG = {
  // Strict: Only basic formatting allowed
  STRICT: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
    ALLOWED_ATTR: [] as string[],
    KEEP_CONTENT: true,
  },

  // Blog content: More permissive for blog posts
  BLOG: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div',
      'figure', 'figcaption', 'iframe', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'pre', 'code'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'target', 'rel'],
    KEEP_CONTENT: true,
  },

  // Default: Balanced security and functionality
  DEFAULT: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href'],
    KEEP_CONTENT: true,
  }
}

// Initialize hooks once
let hooksInitialized = false

const initializeHooks = () => {
  if (hooksInitialized) return

  // Remove dangerous attributes
  DOMPurify.addHook('beforeSanitizeElements', (node: Element) => {
    if (node.attributes) {
      const attrs = node.attributes
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attr = attrs[i]
        if (attr.name.startsWith('data-') || attr.name.startsWith('on')) {
          node.removeAttribute(attr.name)
        }
      }
    }
  })

  hooksInitialized = true
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
    initializeHooks()
    const sanitizeConfig = SANITIZE_CONFIG[config]
    return DOMPurify.sanitize(html, sanitizeConfig)
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
    const stripped = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
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
