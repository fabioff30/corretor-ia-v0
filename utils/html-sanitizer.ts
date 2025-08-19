import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

/**
 * HTML Sanitization Utility
 * Provides secure HTML sanitization for user-generated and external content
 */

// Create a DOM purify instance for server-side use
let purify: any
let hooksInitialized = false

// Initialize DOMPurify based on environment
if (typeof window !== 'undefined') {
  // Client-side: use window
  purify = createDOMPurify(window as any)
} else {
  // Server-side: use JSDOM
  const { window } = new JSDOM('<!DOCTYPE html><p></p>')
  purify = createDOMPurify(window as any)
}

/**
 * Configuration for different sanitization levels
 */
export const SANITIZE_CONFIG = {
  // Strict: Only basic formatting allowed
  STRICT: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM_FRAGMENT: false,
  },
  
  // Blog content: More permissive for blog posts
  BLOG: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id'],
    KEEP_CONTENT: true,
    RETURN_DOM_FRAGMENT: false,
  },
  
  // Default: Balanced security and functionality
  DEFAULT: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href'],
    KEEP_CONTENT: true,
    RETURN_DOM_FRAGMENT: false,
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

    if (!hooksInitialized) {
      purify.addHook('beforeSanitizeElements', (node: Element) => {
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

    const clean = purify.sanitize(html, sanitizeConfig)
    return clean
  } catch (error) {
    console.error('HTML sanitization error:', error)
    // Return empty string on error to be safe
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
    // Use DOMPurify to completely strip HTML
    const stripped = purify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    })
    
    // Clean up whitespace
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
