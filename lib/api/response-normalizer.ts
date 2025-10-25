/**
 * Normalizes different webhook response formats to a standard format
 */

interface Evaluation {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  score: number
  toneChanges?: string[]
  toneApplied?: string
  styleApplied?: string
  changes?: string[]
}

interface NormalizedResponse {
  text: string
  evaluation: Evaluation
}

/**
 * Tries to extract text and evaluation from various response formats
 */
export function normalizeWebhookResponse(
  data: any,
  requestId: string,
  textFieldNames: string[] = ["correctedText", "rewrittenText", "adjustedText", "text"]
): NormalizedResponse {
  console.log("API: Raw response received:", JSON.stringify(data).substring(0, 500), requestId)

  let extractedText = ""
  let evaluation: any = null

  // Try different response formats
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0].output || data[0]
    const result = extractFromObject(firstItem, textFieldNames)
    if (result) {
      extractedText = result.text
      evaluation = result.evaluation
    }
  } else if (typeof data === "object" && data) {
    const result = extractFromObject(data, textFieldNames)
    if (result) {
      extractedText = result.text
      evaluation = result.evaluation
    }
  } else if (typeof data === "string") {
    try {
      const parsedData = JSON.parse(data)
      const result = extractFromObject(parsedData, textFieldNames)
      if (result) {
        extractedText = result.text
        evaluation = result.evaluation
      }
    } catch {
      throw new Error("Failed to parse string response")
    }
  }

  if (!extractedText) {
    // Try recursive search as last resort
    const foundData = findFieldsRecursively(data, textFieldNames)
    if (foundData) {
      extractedText = foundData.text
      evaluation = foundData.evaluation
    } else {
      throw new Error("Text field not found in response")
    }
  }

  // Ensure evaluation exists and is properly formatted
  if (!evaluation) {
    evaluation = createDefaultEvaluation()
  }

  return {
    text: extractedText,
    evaluation: normalizeEvaluation(evaluation),
  }
}

/**
 * Extracts text and evaluation from an object
 */
function extractFromObject(obj: any, textFieldNames: string[]): { text: string; evaluation: any } | null {
  for (const fieldName of textFieldNames) {
    if (obj[fieldName]) {
      return {
        text: obj[fieldName],
        evaluation: obj.evaluation || null,
      }
    }
  }
  return null
}

/**
 * Recursively searches for text fields in nested objects
 */
function findFieldsRecursively(obj: any, textFieldNames: string[]): { text: string; evaluation: any } | null {
  if (!obj || typeof obj !== "object") return null

  // Check if current object has required fields
  for (const fieldName of textFieldNames) {
    if (obj[fieldName]) {
      return {
        text: obj[fieldName],
        evaluation: obj.evaluation || null,
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
  }
}
