/**
 * Normalizes different webhook response formats to a standard format
 * Supports both legacy JSON format and new Markdown format
 */

import {
  isMarkdownResponse,
  hasLegacyMarkers,
  parseCorrectionResponse,
  parseRewriteResponse,
  parseToneResponse,
  type ParsedEvaluation,
} from './markdown-parser'

export type PainBanner = "concordancia" | "virgula" | "muito_formal" | "muito_informal"

export interface PainBannerData {
  id: PainBanner
  title: string
  description: string
  highlight: string
}

interface Evaluation {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  score: number
  toneChanges?: string[]
  toneApplied?: string
  styleApplied?: string
  changes?: string[]
  // Premium fields
  improvements?: string[]
  analysis?: string
  model?: string
  // Pain detection field (for free users)
  painBanner?: PainBannerData
}

interface NormalizedResponse {
  text: string
  evaluation: Evaluation
}

/**
 * Determines the response type based on text field names
 */
type ResponseType = 'correction' | 'rewrite' | 'tone'

function getResponseType(textFieldNames: string[]): ResponseType {
  if (textFieldNames.includes('rewrittenText')) return 'rewrite'
  if (textFieldNames.includes('adjustedText')) return 'tone'
  return 'correction'
}

/**
 * Tries to parse string data as Markdown format
 * Returns null if not Markdown format
 */
function tryParseMarkdown(
  rawString: string,
  responseType: ResponseType,
  requestId: string
): { text: string; evaluation: ParsedEvaluation } | null {
  // Check if the response is in Markdown format (new) or has legacy markers
  if (!isMarkdownResponse(rawString) && !hasLegacyMarkers(rawString)) {
    return null
  }

  console.log(`API: Detected Markdown/markers format, using Markdown parser [${requestId}]`)

  try {
    switch (responseType) {
      case 'rewrite': {
        const result = parseRewriteResponse(rawString)
        if (result.rewrittenText) {
          return { text: result.rewrittenText, evaluation: result.evaluation }
        }
        break
      }
      case 'tone': {
        const result = parseToneResponse(rawString)
        if (result.adjustedText) {
          return { text: result.adjustedText, evaluation: result.evaluation }
        }
        break
      }
      case 'correction':
      default: {
        const result = parseCorrectionResponse(rawString)
        if (result.correctedText) {
          return { text: result.correctedText, evaluation: result.evaluation }
        }
        break
      }
    }
  } catch (error) {
    console.warn(`API: Markdown parsing failed, falling back to JSON [${requestId}]:`, error)
  }

  return null
}

/**
 * Tries to extract text and evaluation from various response formats
 * Supports both legacy JSON format and new Markdown format
 */
export function normalizeWebhookResponse(
  data: any,
  requestId: string,
  textFieldNames: string[] = ["correctedText", "rewrittenText", "adjustedText", "text"]
): NormalizedResponse {
  const dataPreview = typeof data === 'string'
    ? data.substring(0, 500)
    : JSON.stringify(data).substring(0, 500)
  console.log("API: Raw response received:", dataPreview, requestId)

  const responseType = getResponseType(textFieldNames)
  let extractedText = ""
  let evaluation: any = null
  let painBanner: any = null

  // If data is a string, try Markdown parsing first
  if (typeof data === "string") {
    const markdownResult = tryParseMarkdown(data, responseType, requestId)
    if (markdownResult) {
      return {
        text: markdownResult.text,
        evaluation: normalizeEvaluation(markdownResult.evaluation),
      }
    }

    // If not Markdown, try to parse as JSON
    try {
      data = JSON.parse(data)
    } catch {
      // Not valid JSON either - might be plain text, will be handled below
      console.warn(`API: String response is neither Markdown nor valid JSON [${requestId}]`)
    }
  }

  // Try different response formats (JSON objects)
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0].output || data[0]
    const result = extractFromObject(firstItem, textFieldNames)
    if (result) {
      extractedText = result.text
      evaluation = result.evaluation
      painBanner = result.painBanner
    }
  } else if (typeof data === "object" && data) {
    const result = extractFromObject(data, textFieldNames)
    if (result) {
      extractedText = result.text
      evaluation = result.evaluation
      painBanner = result.painBanner
    }
  }

  if (!extractedText) {
    // Try recursive search as last resort
    const foundData = findFieldsRecursively(data, textFieldNames)
    if (foundData) {
      extractedText = foundData.text
      evaluation = foundData.evaluation
      painBanner = foundData.painBanner
    } else {
      throw new Error("Text field not found in response")
    }
  }

  // Ensure evaluation exists and is properly formatted
  if (!evaluation) {
    evaluation = createDefaultEvaluation()
  }

  // Add painBanner to evaluation if it exists
  if (painBanner) {
    evaluation.painBanner = painBanner
  }

  return {
    text: extractedText,
    evaluation: normalizeEvaluation(evaluation),
  }
}

/**
 * Cleans marker tags from text (e.g., <<<CORRIGIDO>>> and <<<FIM>>>)
 * This handles cases where the AI model includes markers inside JSON fields
 */
function cleanMarkersFromText(text: string): string {
  if (!text || typeof text !== 'string') return text

  // Remove various marker patterns
  let cleaned = text
    .replace(/<<<CORRIGIDO>>>\n?/gi, '')
    .replace(/<<<FIM>>>\n?/gi, '')
    .replace(/<<<REESCRITO>>>\n?/gi, '')
    .replace(/<<<AJUSTADO>>>\n?/gi, '')
    .replace(/<<<FIM_AVALIACAO>>>\n?/gi, '')
    .replace(/<<<AVALIACAO>>>\n?/gi, '')
    .trim()

  return cleaned
}

/**
 * Extracts text, evaluation, and painBanner from an object
 */
function extractFromObject(obj: any, textFieldNames: string[]): { text: string; evaluation: any; painBanner?: any } | null {
  for (const fieldName of textFieldNames) {
    if (obj[fieldName]) {
      return {
        text: cleanMarkersFromText(obj[fieldName]),
        evaluation: obj.evaluation || null,
        painBanner: obj.painBanner || null,
      }
    }
  }
  return null
}

/**
 * Recursively searches for text fields in nested objects
 */
function findFieldsRecursively(obj: any, textFieldNames: string[]): { text: string; evaluation: any; painBanner?: any } | null {
  if (!obj || typeof obj !== "object") return null

  // Check if current object has required fields
  for (const fieldName of textFieldNames) {
    if (obj[fieldName]) {
      return {
        text: cleanMarkersFromText(obj[fieldName]),
        evaluation: obj.evaluation || null,
        painBanner: obj.painBanner || null,
      }
    }
  }

  // Search in nested objects
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      const result = findFieldsRecursively(obj[key], textFieldNames)
      if (result) return result
    }
  }

  return null
}

/**
 * Creates a default evaluation when none exists
 */
function createDefaultEvaluation(): Evaluation {
  return {
    strengths: ["Texto processado com sucesso"],
    weaknesses: [],
    suggestions: [],
    score: 7,
  }
}

/**
 * Normalizes evaluation to ensure all required fields exist
 */
function normalizeEvaluation(evaluation: any): Evaluation {
  return {
    strengths: Array.isArray(evaluation?.strengths) ? evaluation.strengths : ["Texto processado com sucesso"],
    weaknesses: Array.isArray(evaluation?.weaknesses) ? evaluation.weaknesses : [],
    suggestions: Array.isArray(evaluation?.suggestions) ? evaluation.suggestions : [],
    score: typeof evaluation?.score === "number" ? evaluation.score : 7,
    ...(evaluation?.toneChanges && { toneChanges: evaluation.toneChanges }),
    ...(evaluation?.toneApplied && { toneApplied: evaluation.toneApplied }),
    ...(evaluation?.styleApplied && { styleApplied: evaluation.styleApplied }),
    ...(evaluation?.changes && { changes: evaluation.changes }),
    // Premium fields
    ...(Array.isArray(evaluation?.improvements) && { improvements: evaluation.improvements }),
    ...(typeof evaluation?.analysis === "string" && { analysis: evaluation.analysis }),
    ...(typeof evaluation?.model === "string" && { model: evaluation.model }),
    // Pain detection field (for free users)
    ...(evaluation?.painBanner &&
      typeof evaluation.painBanner === "object" && {
        painBanner: evaluation.painBanner,
      }),
  }
}
