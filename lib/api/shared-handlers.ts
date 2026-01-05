// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/middleware/rate-limit"
import { validateInput } from "@/middleware/input-validation"
import { logRequest } from "@/utils/logger"

/**
 * Applies rate limiting to the request
 * @returns NextResponse if rate limit exceeded, null otherwise
 */
export async function applyRateLimit(request: NextRequest, requestId: string): Promise<NextResponse | null> {
  const rateLimitResponse = await rateLimiter(request)
  if (rateLimitResponse) {
    logRequest(requestId, {
      status: 429,
      message: "Rate limit exceeded",
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    })
  }
  return rateLimitResponse
}

/**
 * Sanitizes text by removing excessive whitespace and problematic characters (frontend-api.md spec)
 * Enhanced to prevent JSON parsing errors from documents with special characters
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  return text
    // Remove control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove zero-width spaces and other invisible characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Replace line/paragraph separators with newlines
    .replace(/[\u2028\u2029]/g, '\n')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Replace multiple spaces/tabs with single space
    .replace(/[ \t]+/g, ' ')
    // Replace 3+ newlines with 2 newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim()
}

/**
 * Validates and sanitizes request input
 * @returns Validated input or NextResponse if validation fails
 */
export async function validateAndSanitizeInput(
  request: NextRequest,
  requestBody: any,
  requestId: string
) {
  // Sanitize text field if present (frontend-api.md spec line 45)
  const sanitizedBody = { ...requestBody }
  if (typeof sanitizedBody.text === 'string') {
    sanitizedBody.text = sanitizeText(sanitizedBody.text)
  }

  // Pass sanitizedBody directly to avoid double JSON parsing
  const validatedInput = await validateInput(request, sanitizedBody)
  if (validatedInput instanceof NextResponse) {
    logRequest(requestId, {
      status: 400,
      message: "Input validation failed",
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    })
  }
  return validatedInput
}

/**
 * Parses JSON request body with error handling
 * @returns Parsed body or error response
 */
export async function parseRequestBody(request: NextRequest, requestId: string) {
  try {
    const body = await request.json()
    return { body, error: null }
  } catch (parseError) {
    logRequest(requestId, {
      status: 400,
      message: "Invalid JSON in request body",
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    })
    return {
      body: null,
      error: NextResponse.json(
        {
          error: "Formato JSON inválido",
          message: "Corpo da requisição deve ser um JSON válido",
          details: ["Certifique-se de que o corpo da requisição está em formato JSON válido"]
        },
        { status: 400 }
      ),
    }
  }
}

/**
 * Validates text length
 * @returns Error response if text is too large, null otherwise
 */
export function validateTextLength(text: string, maxLength: number, requestId: string, ip: string): NextResponse | null {
  if (text.length > maxLength) {
    logRequest(requestId, {
      status: 413,
      message: "Text too large",
      textLength: text.length,
      ip,
    })
    return NextResponse.json(
      {
        error: "Texto muito grande",
        message: `O texto não pode exceder ${maxLength} caracteres`,
        details: [
          `Tamanho atual: ${text.length} caracteres`,
          `Limite: ${maxLength} caracteres`,
          `Considere usar um plano Premium para textos maiores`
        ]
      },
      { status: 413 }
    )
  }
  return null
}
// @ts-nocheck
