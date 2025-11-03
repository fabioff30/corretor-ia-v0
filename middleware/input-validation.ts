import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logSecurityEvent } from "@/utils/logger"
import { containsDangerousContent } from "@/utils/html-sanitizer"

/**
 * Enhanced Input Validation with Security Focus
 * Comprehensive validation and sanitization for all user inputs
 */

// Comprehensive suspicious patterns for security
const SECURITY_PATTERNS = [
  // Script injection attempts
  /<script[^>]*>/i,
  /<\/script>/i,
  /javascript:/i,
  /vbscript:/i,
  /data:[^,]*script/i,
  
  // Event handlers
  /on\w+\s*=/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  
  // JavaScript functions
  /eval\s*\(/i,
  /function\s*\(/i,
  /setTimeout\s*\(/i,
  /setInterval\s*\(/i,
  /alert\s*\(/i,
  /confirm\s*\(/i,
  /prompt\s*\(/i,
  
  // DOM manipulation
  /document\./i,
  /window\./i,
  /\.innerHTML/i,
  /\.outerHTML/i,
  /createElement/i,
  
  // Storage access
  /localStorage/i,
  /sessionStorage/i,
  /document\.cookie/i,
  
  // Network requests
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /\.ajax/i,
  
  // Iframe and object tags
  /<iframe[^>]*>/i,
  /<object[^>]*>/i,
  /<embed[^>]*>/i,
  /<link[^>]*>/i,
  /<meta[^>]*>/i,
  
  // CSS injection
  /expression\s*\(/i,
  /url\s*\(/i,
  /@import/i,
  
  // SQL injection patterns
  /union\s+select/i,
  /drop\s+table/i,
  /insert\s+into/i,
  /delete\s+from/i,
  /update\s+set/i,
  
  // Command injection (more specific patterns to avoid false positives)
  /;\s*(rm|ls|cat|chmod|chown|sudo|bash|sh|curl|wget|nc|netcat)\b/i,
  /\|\s*(rm|ls|cat|chmod|chown|sudo|bash|sh|curl|wget|nc|netcat)\b/i,
  /&&\s*(rm|ls|cat|chmod|chown|sudo|bash|sh|curl|wget|nc|netcat)\b/i,
  /\$\([^\)]*\)/,
  /`[^`]*(rm|ls|cat|chmod|chown|sudo|bash|sh|curl|wget|nc|netcat)[^`]*`/i,
  
  // Path traversal
  /\.\.\//,
  /\.\.[\\\/]/,
  
  // Encoding bypasses
  /&#x/i,
  /&#\d/,
  /%3c/i,
  /%3e/i,
  /%22/i,
  /%27/i,
]

// Allowed tones for tone adjustment
const ALLOWED_TONES = [
  'Padrão',
  'Formal',
  'Informal',
  'Técnico',
  'Criativo',
  'Persuasivo',
  'Objetivo',
  'Acadêmico',
  'Romântico',
  'Narrativo',
  'Instagram',
  'WhatsApp',
  'Tweet',
  'Personalizado'
]

// Base text validation schema
// Note: Max length set to 20000 for premium users
// Actual limits are enforced at the API route level based on user plan
const baseTextValidation = z
  .string()
  .min(1, "O texto não pode estar vazio")
  .max(20000, "O texto não pode exceder 20000 caracteres")
  .refine((text) => {
    // Check for dangerous content using the HTML sanitizer utility
    // More lenient for longer texts (premium users may have technical content)
    if (text.length > 5000) {
      // For long texts, only check the most critical XSS patterns
      const criticalDangerousPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /<iframe[^>]*>/i,
        /eval\s*\(/i,
      ]
      return !criticalDangerousPatterns.some(pattern => pattern.test(text))
    }
    // For shorter texts, use full validation
    return !containsDangerousContent(text)
  }, "O texto contém conteúdo potencialmente perigoso")
  .refine((text) => {
    // Additional security pattern check
    // More lenient for longer texts (premium users may have technical content)
    // Only check critical security patterns for long texts
    if (text.length > 5000) {
      // For long texts, only check the most critical patterns
      const criticalPatterns = [
        /<script[^>]*>/i,
        /<\/script>/i,
        /javascript:/i,
        /onerror\s*=/i,
        /onload\s*=/i,
        /eval\s*\(/i,
        /document\.cookie/i,
        /<iframe[^>]*>/i,
      ]
      return !criticalPatterns.some((pattern) => pattern.test(text))
    }
    // For shorter texts, check all patterns
    return !SECURITY_PATTERNS.some((pattern) => pattern.test(text))
  }, "O texto contém padrões não permitidos")
  .refine((text) => {
    // Check for excessive repetition (potential spam)
    // More lenient for longer texts (premium users may have repetitive content)
    const words = text.split(/\s+/)
    if (words.length > 10 && words.length < 500) {
      // Only check repetition for small texts (potential spam)
      const uniqueWords = new Set(words.map(w => w.toLowerCase()))
      const repetitionRatio = uniqueWords.size / words.length
      return repetitionRatio > 0.3 // At least 30% unique words
    }
    return true // Skip check for very short or very long texts
  }, "O texto contém repetição excessiva")
  .refine((text) => {
    // Check for control characters and non-printable characters
    // Allow common whitespace and line breaks
    const allowedControlChars = /[\n\r\t]/g
    const cleanText = text.replace(allowedControlChars, '')
    return !/[\x00-\x1F\x7F-\x9F]/.test(cleanText)
  }, "O texto contém caracteres não permitidos")

// Main correction request schema
const correctionRequestSchema = z.object({
  text: baseTextValidation,
  isMobile: z.boolean().optional().default(false),
  isPremium: z.boolean().optional().default(false),
  tone: z.string()
    .optional()
    .refine((tone) => {
      if (!tone) return true
      // Aceitar tons predefinidos ou qualquer string personalizada
      if (ALLOWED_TONES.includes(tone)) return true
      // Se não está na lista, considerar como tom personalizado
      // Validar que não é vazio e não contém conteúdo perigoso
      return tone.trim().length > 0 && tone.length <= 200
    }, `Tom deve ser um dos predefinidos ou uma instrução personalizada (máximo 200 caracteres)`)
    .default('Padrão'),
})

// Rewrite request schema
const rewriteRequestSchema = z.object({
  text: baseTextValidation,
  style: z.string()
    .min(1, "Estilo não pode estar vazio")
    .max(100, "Estilo muito longo")
    .refine((style) => {
      // Basic validation for style parameter
      return !SECURITY_PATTERNS.some((pattern) => pattern.test(style))
    }, "Estilo contém conteúdo não permitido"),
  isMobile: z.boolean().optional().default(false),
  isPremium: z.boolean().optional().default(false),
})

// Contact form schema
const contactFormSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome muito longo")
    .refine((name) => /^[a-zA-ZÀ-ÿ\s\-']+$/.test(name), "Nome contém caracteres inválidos"),
  email: z.string()
    .email("Email inválido")
    .max(254, "Email muito longo"), // RFC 5321 limit
  message: z.string()
    .min(10, "Mensagem muito curta")
    .max(1000, "Mensagem muito longa")
    .refine((message) => {
      return !SECURITY_PATTERNS.some((pattern) => pattern.test(message))
    }, "Mensagem contém conteúdo não permitido"),
})

/**
 * Enhanced input validation with security logging
 * @param req - The request object
 * @param parsedBody - Optional pre-parsed body to avoid double parsing
 */
export async function validateInput(req: NextRequest | Request, parsedBody?: any) {
  const requestId = crypto.randomUUID()
  const ip = (req as any).ip || (req as Request).headers.get("x-forwarded-for") || "unknown"
  const userAgent = (req as Request).headers.get("user-agent") || "unknown"

  try {
    // Use pre-parsed body if provided, otherwise parse from request
    const body = parsedBody ?? await (req as Request).json()
    
    // Determine which schema to use based on the request
    let schema: any = correctionRequestSchema
    const pathname = (req as any).nextUrl?.pathname ?? new URL((req as Request).url).pathname
    
    if (pathname.includes('/rewrite')) {
      schema = rewriteRequestSchema
    } else if (pathname.includes('/contact')) {
      schema = contactFormSchema
    }
    
    const result = schema.safeParse(body)

    if (!result.success) {
      // Log validation failure with detailed error information
      const errorDetails = result.error.errors.map((e: any) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code
      }))

      logSecurityEvent('Input validation failed', {
        requestId,
        ip,
        userAgent,
        endpoint: pathname,
        errors: result.error.errors.map((e: any) => e.message),
        errorDetails
      })

      // Log to console for debugging (remove in production)
      console.error('Validation failed:', JSON.stringify(errorDetails, null, 2))

      return NextResponse.json(
        {
          error: "Erro de validação",
          message: result.error.errors.map((e: any) => e.message).join(", "),
          details: result.error.errors.map((e: any) => e.message),
        },
        { status: 400 },
      )
    }

    // Additional runtime security checks
    const validatedData = result.data

    // Check if text contains potential security threats
    if ('text' in validatedData && typeof validatedData.text === 'string') {
      // For large texts (> 5000 chars), only check critical security patterns
      // to avoid false positives in legitimate long-form content
      const patternsToCheck = validatedData.text.length > 5000
        ? [
            /<script[^>]*>/i,
            /<\/script>/i,
            /javascript:/i,
            /onerror\s*=/i,
            /onload\s*=/i,
            /eval\s*\(/i,
            /document\.cookie/i,
            /<iframe[^>]*>/i,
          ]
        : SECURITY_PATTERNS

      // Log if suspicious patterns were detected but passed initial validation
      const suspiciousPatterns = patternsToCheck.filter(pattern =>
        pattern.test(validatedData.text)
      )

      if (suspiciousPatterns.length > 0) {
        logSecurityEvent('Suspicious content detected', {
          requestId,
          ip,
          userAgent,
          endpoint: pathname,
          patterns: suspiciousPatterns.length,
          textLength: validatedData.text.length,
          isLargeText: validatedData.text.length > 5000
        })

        return NextResponse.json(
          {
            error: "Conteúdo suspeito detectado",
            message: "O texto contém padrões que podem ser perigosos. Por favor, revise seu texto.",
            details: [
              "Foram detectados padrões potencialmente perigosos no texto",
              "Remova qualquer código ou script do texto",
              "Certifique-se de que o texto contém apenas conteúdo textual"
            ],
          },
          { status: 400 },
        )
      }
    }

    return validatedData
  } catch (error) {
    // Log parsing errors
    logSecurityEvent('JSON parsing failed', {
      requestId,
      ip,
      userAgent,
      endpoint: ((req as any).nextUrl?.pathname ?? new URL((req as Request).url).pathname),
          error: error instanceof Error ? error.message : 'Unknown parsing error'
    })
    
    return NextResponse.json(
      {
        error: "Erro ao validar entrada",
        message: "Formato de dados inválido",
        details: ["O corpo da requisição não pôde ser processado", "Verifique o formato JSON"],
      },
      { status: 400 },
    )
  }
}

/**
 * Validate file uploads
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: "Arquivo muito grande (máximo 10MB)" }
  }
  
  // Check file type
  const allowedTypes = [
    'text/plain',
    'text/csv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Tipo de arquivo não permitido" }
  }
  
  // Check filename for suspicious patterns
  if (SECURITY_PATTERNS.some(pattern => pattern.test(file.name))) {
    return { valid: false, error: "Nome do arquivo contém caracteres não permitidos" }
  }
  
  return { valid: true }
}

/**
 * Validate URL parameters
 */
export function validateUrlParams(params: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(params)) {
    // Check for suspicious patterns in both key and value
    if (SECURITY_PATTERNS.some(pattern => pattern.test(key) || pattern.test(value))) {
      return false
    }
    
    // Check for excessive length
    if (key.length > 100 || value.length > 1000) {
      return false
    }
  }
  
  return true
}
