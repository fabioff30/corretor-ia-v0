/**
 * Safe JSON parsing and response validation
 * Handles malformed JSON, truncated responses, and structure validation
 */

interface SafeParseResult<T> {
  success: boolean
  data?: T
  error?: string
  rawText?: string
}

/**
 * Safely parse JSON with detailed error handling
 * @param text Raw response text
 * @param maxLength Maximum allowed response length (prevents huge payloads)
 * @returns Parsed data or error details
 */
export function safeJsonParse<T>(text: string, maxLength = 1024 * 1024): SafeParseResult<T> {
  try {
    // Check if response seems truncated
    if (text.length > maxLength) {
      console.error(`Response too large: ${text.length} bytes (max: ${maxLength})`)
      return {
        success: false,
        error: `Response too large: ${text.length} bytes`,
        rawText: text.substring(0, 200),
      }
    }

    // Check for common truncation patterns
    if (
      text.endsWith('...') ||
      (text.endsWith('"') && !text.endsWith('"}')) ||
      (text.endsWith(']') && text.indexOf('[') > text.indexOf('}'))
    ) {
      console.warn("Response appears truncated:", text.substring(0, 100))
    }

    // Try to parse
    const parsed = JSON.parse(text) as T
    return {
      success: true,
      data: parsed,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    // Log detailed error info
    console.error("JSON Parse Error:", {
      message: errorMsg,
      textLength: text.length,
      preview: text.substring(0, 200),
      position: errorMsg.match(/position (\d+)/)?.[1],
    })

    return {
      success: false,
      error: errorMsg,
      rawText: text.substring(0, 500),
    }
  }
}

/**
 * Extract valid JSON from partial response
 * Attempts to fix common truncation issues
 */
export function extractValidJson<T>(text: string): SafeParseResult<T> {
  try {
    // Try direct parse first
    return safeJsonParse<T>(text)
  } catch {
    // Try to find the last complete object/array
    let braceCount = 0
    let bracketCount = 0
    let lastValidPos = 0
    let inString = false
    let escapeNext = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]

      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      if (char === '"' && !escapeNext) {
        inString = !inString
        continue
      }

      if (inString) continue

      if (char === '{') braceCount++
      if (char === '}') braceCount--
      if (char === '[') bracketCount++
      if (char === ']') bracketCount--

      // Mark position as valid when all braces/brackets are closed
      if (braceCount === 0 && bracketCount === 0 && (char === '}' || char === ']')) {
        lastValidPos = i + 1
      }
    }

    if (lastValidPos > 0 && lastValidPos < text.length) {
      const truncatedJson = text.substring(0, lastValidPos)
      console.warn("Extracted partial JSON:", truncatedJson.substring(0, 100))
      return safeJsonParse<T>(truncatedJson)
    }

    return {
      success: false,
      error: "Could not extract valid JSON from response",
      rawText: text.substring(0, 500),
    }
  }
}

/**
 * Response validator helper
 */
export interface ResponseValidator<T> {
  isValid: (data: unknown) => data is T
  getDefaultFallback: () => T
}

/**
 * Validate and normalize API response
 */
export async function fetchAndParseJson<T>(
  url: string,
  options: RequestInit = {},
  validator?: ResponseValidator<T>
): Promise<SafeParseResult<T>> {
  try {
    const response = await fetch(url, options)

    // Check HTTP status
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    // Get response text first
    const text = await response.text()

    if (!text) {
      return {
        success: false,
        error: "Empty response body",
      }
    }

    // Try to parse JSON
    let parseResult = safeJsonParse<T>(text)

    // If parsing fails, try to extract valid JSON
    if (!parseResult.success) {
      console.info("Attempting to extract valid JSON from malformed response...")
      parseResult = extractValidJson<T>(text)
    }

    // If we got data, validate it
    if (parseResult.success && parseResult.data && validator) {
      if (!validator.isValid(parseResult.data)) {
        console.warn("Response failed schema validation:", parseResult.data)

        // Return default fallback if validation fails
        const fallback = validator.getDefaultFallback()
        return {
          success: true,
          data: fallback,
          error: "Response validation failed, using default fallback",
        }
      }
    }

    return parseResult
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("Fetch and parse error:", errorMsg)

    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Create a response validator for text correction responses
 */
export function createCorrectionResponseValidator(): ResponseValidator<any> {
  return {
    isValid: (data: unknown) => {
      if (typeof data !== "object" || data === null) return false

      const obj = data as Record<string, unknown>

      // Require minimum fields
      return (
        "correctedText" in obj &&
        typeof obj.correctedText === "string" &&
        obj.correctedText.length > 0 &&
        obj.correctedText.length < 10000
      )
    },
    getDefaultFallback: () => ({
      correctedText: "",
      evaluation: {
        strengths: [],
        weaknesses: ["Erro ao processar resposta do servidor"],
        suggestions: ["Por favor, tente novamente"],
      },
    }),
  }
}

/**
 * Create a response validator for AI detection responses
 */
export function createAIDetectionResponseValidator(): ResponseValidator<any> {
  return {
    isValid: (data: unknown) => {
      if (typeof data !== "object" || data === null) return false

      const obj = data as Record<string, unknown>

      // Require minimum fields
      return (
        "result" in obj &&
        typeof obj.result === "object" &&
        obj.result !== null &&
        "textStats" in obj &&
        typeof obj.textStats === "object" &&
        obj.textStats !== null
      )
    },
    getDefaultFallback: () => ({
      result: {
        verdict: "uncertain",
        probability: 0,
        confidence: "low",
        explanation: "Erro ao processar resposta do servidor",
        signals: [],
      },
      textStats: {
        words: 0,
        characters: 0,
        sentences: 0,
      },
      metadata: {},
    }),
  }
}
