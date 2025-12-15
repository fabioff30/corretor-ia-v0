/**
 * Markdown Parser for Worker Responses
 *
 * Parses structured Markdown responses from Cloudflare Workers
 * and extracts evaluation data into typed objects.
 *
 * Supports both:
 * - Legacy format with <<<CORRIGIDO>>> markers + JSON evaluation
 * - New Markdown format with ## sections for evaluation
 */

export interface ParsedEvaluation {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  score: number
  toneChanges?: string[]
  toneApplied?: string
  styleApplied?: string
  changes?: string[]
  improvements?: string[]
  analysis?: string
  model?: string
}

export interface ParsedCorrectionResponse {
  correctedText: string
  evaluation: ParsedEvaluation
}

export interface ParsedRewriteResponse {
  rewrittenText: string
  evaluation: ParsedEvaluation
}

export interface ParsedToneResponse {
  adjustedText: string
  evaluation: ParsedEvaluation
}

export interface ParsedAIDetectorResponse {
  result: {
    verdict: 'human' | 'ai' | 'mixed' | 'uncertain'
    probability: number
    confidence: 'high' | 'medium' | 'low'
    explanation: string
    signals: string[]
  }
  textStats: {
    words: number
    characters: number
    sentences: number
  }
  linguisticAnalysis?: {
    brazilianisms: string[]
    grammarSummary: string
  }
}

// Default evaluation for fallback
const DEFAULT_EVALUATION: ParsedEvaluation = {
  strengths: ['Texto processado com sucesso'],
  weaknesses: [],
  suggestions: [],
  score: 7,
}

/**
 * Detects if the response is in Markdown format (new) or JSON format (legacy)
 */
export function isMarkdownResponse(raw: string): boolean {
  // Check for new Markdown format indicators
  const markdownIndicators = [
    /^#\s+TEXTO_CORRIGIDO/m,
    /^#\s+AVALIACAO/m,
    /^##\s+Nota\b/m,
    /^##\s+Pontos Fortes\b/m,
  ]

  return markdownIndicators.some(pattern => pattern.test(raw))
}

/**
 * Detects if the response uses legacy markers (<<<CORRIGIDO>>> etc)
 */
export function hasLegacyMarkers(raw: string): boolean {
  return raw.includes('<<<CORRIGIDO>>>') || raw.includes('<<<AVALIACAO>>>')
}

/**
 * Extracts text between legacy markers
 */
export function extractBetweenMarkers(raw: string, startMarker: string, endMarker: string): string | null {
  const startIndex = raw.indexOf(startMarker)
  if (startIndex === -1) return null

  const contentStart = startIndex + startMarker.length
  const endIndex = raw.indexOf(endMarker, contentStart)

  if (endIndex === -1) {
    // If end marker not found, try to extract until next section or end
    const nextSection = raw.indexOf('<<<', contentStart)
    if (nextSection !== -1) {
      return raw.substring(contentStart, nextSection).trim()
    }
    return raw.substring(contentStart).trim()
  }

  return raw.substring(contentStart, endIndex).trim()
}

/**
 * Extracts a Markdown section by header name
 * Supports both # and ## headers
 */
export function extractMarkdownSection(raw: string, sectionName: string): string | null {
  const lines = raw.split('\n')
  let capturing = false
  let capturedLines: string[] = []
  let headerLevel = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Check if this line is a header
    const h2Match = trimmed.match(/^##\s+(.+)$/)
    const h1Match = trimmed.match(/^#\s+(.+)$/)

    if (capturing) {
      // Stop capturing when we hit another header of same or higher level
      if (h1Match) {
        // Any # header stops capture
        break
      }
      if (h2Match && headerLevel === 2) {
        // ## header stops capture if we were capturing a ## section
        break
      }
      capturedLines.push(line)
    } else {
      // Check if this is the section we're looking for
      if (h2Match && h2Match[1].trim() === sectionName) {
        capturing = true
        headerLevel = 2
      } else if (h1Match && h1Match[1].trim() === sectionName) {
        capturing = true
        headerLevel = 1
      }
    }
  }

  if (capturedLines.length === 0) {
    return null
  }

  return capturedLines.join('\n').trim()
}

/**
 * Extracts list items from a Markdown section
 * Handles both `- item` and `* item` formats
 */
export function extractListItems(section: string): string[] {
  if (!section) return []

  const items: string[] = []
  const lines = section.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    // Match lines starting with - or *
    if (/^[-*]\s+/.test(trimmed)) {
      const item = trimmed.replace(/^[-*]\s+/, '').trim()
      if (item) {
        items.push(item)
      }
    }
  }

  return items
}

/**
 * Extracts a numeric value from a section
 * Handles formats like "8", "8/10", "8.5"
 * @param section The text to extract number from
 * @param clamp Whether to clamp the value to 0-10 range (default: false)
 */
export function extractNumber(section: string | null, clamp: boolean = false): number | null {
  if (!section) return null

  // Try to find a number pattern
  const match = section.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/)
  if (match) {
    const num = parseFloat(match[1])
    if (clamp) {
      // Clamp to 0-10 range
      return Math.min(10, Math.max(0, num))
    }
    return num
  }

  return null
}

/**
 * Extracts plain text content (non-list) from a section
 */
export function extractPlainText(section: string | null): string {
  if (!section) return ''

  // Remove list items and return remaining text
  const lines = section.split('\n')
  const nonListLines = lines.filter(line => !line.trim().match(/^[-*]\s+/))
  return nonListLines.join('\n').trim()
}

/**
 * Parses evaluation from Markdown format
 */
export function parseMarkdownEvaluation(raw: string): ParsedEvaluation {
  const evaluation: ParsedEvaluation = { ...DEFAULT_EVALUATION }

  // Extract Nota/Score (clamp to 0-10)
  const notaSection = extractMarkdownSection(raw, 'Nota')
  const scoreNum = extractNumber(notaSection, true)
  if (scoreNum !== null) {
    evaluation.score = scoreNum
  }

  // Extract Pontos Fortes (Strengths)
  const strengthsSection = extractMarkdownSection(raw, 'Pontos Fortes')
  if (strengthsSection) {
    const items = extractListItems(strengthsSection)
    if (items.length > 0) {
      evaluation.strengths = items
    }
  }

  // Extract Pontos Fracos (Weaknesses)
  const weaknessesSection = extractMarkdownSection(raw, 'Pontos Fracos')
  if (weaknessesSection) {
    const items = extractListItems(weaknessesSection)
    if (items.length > 0) {
      evaluation.weaknesses = items
    }
  }

  // Extract Sugestoes (Suggestions)
  const suggestionsSection = extractMarkdownSection(raw, 'Sugestoes') || extractMarkdownSection(raw, 'Sugestões')
  if (suggestionsSection) {
    const items = extractListItems(suggestionsSection)
    if (items.length > 0) {
      evaluation.suggestions = items
    }
  }

  // Extract Melhorias (Improvements) - Premium
  const improvementsSection = extractMarkdownSection(raw, 'Melhorias')
  if (improvementsSection) {
    const items = extractListItems(improvementsSection)
    if (items.length > 0) {
      evaluation.improvements = items
    }
  }

  // Extract Analise (Analysis) - Premium
  const analysisSection = extractMarkdownSection(raw, 'Analise') || extractMarkdownSection(raw, 'Análise')
  if (analysisSection) {
    const text = extractPlainText(analysisSection)
    if (text) {
      evaluation.analysis = text
    }
  }

  // Extract Modelo (Model)
  const modelSection = extractMarkdownSection(raw, 'Modelo')
  if (modelSection) {
    const text = extractPlainText(modelSection)
    if (text) {
      evaluation.model = text
    }
  }

  // Extract Tom Aplicado (Tone Applied)
  const toneSection = extractMarkdownSection(raw, 'Tom Aplicado')
  if (toneSection) {
    const text = extractPlainText(toneSection)
    if (text) {
      evaluation.toneApplied = text
    }
  }

  // Extract Estilo Aplicado (Style Applied)
  const styleSection = extractMarkdownSection(raw, 'Estilo Aplicado')
  if (styleSection) {
    const text = extractPlainText(styleSection)
    if (text) {
      evaluation.styleApplied = text
    }
  }

  // Extract Mudancas (Changes)
  const changesSection = extractMarkdownSection(raw, 'Mudancas') || extractMarkdownSection(raw, 'Mudanças')
  if (changesSection) {
    const items = extractListItems(changesSection)
    if (items.length > 0) {
      evaluation.changes = items
    }
  }

  // Extract Mudancas de Tom (Tone Changes)
  const toneChangesSection = extractMarkdownSection(raw, 'Mudancas de Tom') || extractMarkdownSection(raw, 'Mudanças de Tom')
  if (toneChangesSection) {
    const items = extractListItems(toneChangesSection)
    if (items.length > 0) {
      evaluation.toneChanges = items
    }
  }

  return evaluation
}

/**
 * Parses a correction response (supports both Markdown and legacy formats)
 */
export function parseCorrectionResponse(raw: string): ParsedCorrectionResponse {
  let correctedText = ''
  let evaluation: ParsedEvaluation = { ...DEFAULT_EVALUATION }

  // Try legacy markers first (for backwards compatibility)
  if (hasLegacyMarkers(raw)) {
    // Extract corrected text
    correctedText = extractBetweenMarkers(raw, '<<<CORRIGIDO>>>', '<<<FIM>>>') || ''

    // Check if evaluation is in new Markdown format or legacy JSON
    const evalSection = extractBetweenMarkers(raw, '<<<AVALIACAO>>>', '<<<FIM_AVALIACAO>>>')

    if (evalSection) {
      // Try to detect if it's JSON or Markdown
      const trimmed = evalSection.trim()
      if (trimmed.startsWith('{')) {
        // Legacy JSON format - try to parse
        try {
          const parsed = JSON.parse(trimmed)
          evaluation = {
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : DEFAULT_EVALUATION.strengths,
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            score: typeof parsed.score === 'number' ? parsed.score : DEFAULT_EVALUATION.score,
            ...(parsed.toneChanges && { toneChanges: parsed.toneChanges }),
            ...(parsed.improvements && { improvements: parsed.improvements }),
            ...(parsed.analysis && { analysis: parsed.analysis }),
            ...(parsed.model && { model: parsed.model }),
          }
        } catch {
          // JSON parse failed - try Markdown format within the section
          evaluation = parseMarkdownEvaluation(evalSection)
        }
      } else {
        // New Markdown format within markers
        evaluation = parseMarkdownEvaluation(evalSection)
      }
    }
  }
  // Try new pure Markdown format
  else if (isMarkdownResponse(raw)) {
    // Extract corrected text from # TEXTO_CORRIGIDO section
    const textSection = extractMarkdownSection(raw, 'TEXTO_CORRIGIDO')
    if (textSection) {
      correctedText = textSection
    }

    // Parse evaluation from Markdown sections
    evaluation = parseMarkdownEvaluation(raw)
  }
  // Fallback: try to find any text content
  else {
    correctedText = raw.trim()
  }

  return {
    correctedText: correctedText.trim(),
    evaluation,
  }
}

/**
 * Parses a rewrite response
 */
export function parseRewriteResponse(raw: string): ParsedRewriteResponse {
  let rewrittenText = ''
  let evaluation: ParsedEvaluation = { ...DEFAULT_EVALUATION }

  if (hasLegacyMarkers(raw)) {
    // Try REESCRITO marker first, then CORRIGIDO as fallback
    rewrittenText = extractBetweenMarkers(raw, '<<<REESCRITO>>>', '<<<FIM>>>')
      || extractBetweenMarkers(raw, '<<<CORRIGIDO>>>', '<<<FIM>>>')
      || ''

    const evalSection = extractBetweenMarkers(raw, '<<<AVALIACAO>>>', '<<<FIM_AVALIACAO>>>')
    if (evalSection) {
      const trimmed = evalSection.trim()
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed)
          evaluation = {
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : DEFAULT_EVALUATION.strengths,
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            score: typeof parsed.score === 'number' ? parsed.score : DEFAULT_EVALUATION.score,
            ...(parsed.styleApplied && { styleApplied: parsed.styleApplied }),
            ...(parsed.changes && { changes: parsed.changes }),
            ...(parsed.improvements && { improvements: parsed.improvements }),
          }
        } catch {
          evaluation = parseMarkdownEvaluation(evalSection)
        }
      } else {
        evaluation = parseMarkdownEvaluation(evalSection)
      }
    }
  } else if (isMarkdownResponse(raw)) {
    const textSection = extractMarkdownSection(raw, 'TEXTO_REESCRITO')
      || extractMarkdownSection(raw, 'TEXTO_CORRIGIDO')
    if (textSection) {
      rewrittenText = textSection
    }
    evaluation = parseMarkdownEvaluation(raw)
  } else {
    rewrittenText = raw.trim()
  }

  return {
    rewrittenText: rewrittenText.trim(),
    evaluation,
  }
}

/**
 * Parses a tone adjustment response
 */
export function parseToneResponse(raw: string): ParsedToneResponse {
  let adjustedText = ''
  let evaluation: ParsedEvaluation = { ...DEFAULT_EVALUATION }

  if (hasLegacyMarkers(raw)) {
    adjustedText = extractBetweenMarkers(raw, '<<<AJUSTADO>>>', '<<<FIM>>>')
      || extractBetweenMarkers(raw, '<<<CORRIGIDO>>>', '<<<FIM>>>')
      || ''

    const evalSection = extractBetweenMarkers(raw, '<<<AVALIACAO>>>', '<<<FIM_AVALIACAO>>>')
    if (evalSection) {
      const trimmed = evalSection.trim()
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed)
          evaluation = {
            strengths: [],
            weaknesses: [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            score: 0,
            ...(parsed.toneApplied && { toneApplied: parsed.toneApplied }),
            ...(parsed.toneChanges && { toneChanges: parsed.toneChanges }),
            ...(parsed.changes && { changes: parsed.changes }),
          }
        } catch {
          evaluation = parseMarkdownEvaluation(evalSection)
        }
      } else {
        evaluation = parseMarkdownEvaluation(evalSection)
      }
    }
  } else if (isMarkdownResponse(raw)) {
    const textSection = extractMarkdownSection(raw, 'TEXTO_AJUSTADO')
      || extractMarkdownSection(raw, 'TEXTO_CORRIGIDO')
    if (textSection) {
      adjustedText = textSection
    }
    evaluation = parseMarkdownEvaluation(raw)
  } else {
    adjustedText = raw.trim()
  }

  return {
    adjustedText: adjustedText.trim(),
    evaluation,
  }
}

/**
 * Parses an AI detector response
 */
export function parseAIDetectorResponse(raw: string): ParsedAIDetectorResponse | null {
  // Default response structure
  const defaultResponse: ParsedAIDetectorResponse = {
    result: {
      verdict: 'uncertain',
      probability: 0,
      confidence: 'low',
      explanation: '',
      signals: [],
    },
    textStats: {
      words: 0,
      characters: 0,
      sentences: 0,
    },
  }

  // Try to parse as JSON first (AI detector might still use JSON)
  try {
    const parsed = JSON.parse(raw)
    if (parsed.result && parsed.textStats) {
      return parsed as ParsedAIDetectorResponse
    }
  } catch {
    // Not JSON, try Markdown format
  }

  // Try Markdown format
  if (isMarkdownResponse(raw) || raw.includes('# RESULTADO')) {
    const response = { ...defaultResponse }

    // Parse RESULTADO section
    const verdictSection = extractMarkdownSection(raw, 'Veredito')
    if (verdictSection) {
      const verdict = verdictSection.trim().toLowerCase()
      if (['human', 'ai', 'mixed', 'uncertain'].includes(verdict)) {
        response.result.verdict = verdict as 'human' | 'ai' | 'mixed' | 'uncertain'
      }
    }

    const probabilitySection = extractMarkdownSection(raw, 'Probabilidade')
    const prob = extractNumber(probabilitySection)
    if (prob !== null) {
      response.result.probability = prob
    }

    const confidenceSection = extractMarkdownSection(raw, 'Confianca') || extractMarkdownSection(raw, 'Confiança')
    if (confidenceSection) {
      const conf = confidenceSection.trim().toLowerCase()
      if (['high', 'medium', 'low'].includes(conf)) {
        response.result.confidence = conf as 'high' | 'medium' | 'low'
      }
    }

    const explanationSection = extractMarkdownSection(raw, 'Explicacao') || extractMarkdownSection(raw, 'Explicação')
    if (explanationSection) {
      response.result.explanation = extractPlainText(explanationSection)
    }

    const signalsSection = extractMarkdownSection(raw, 'Sinais')
    if (signalsSection) {
      response.result.signals = extractListItems(signalsSection)
    }

    // Parse ESTATISTICAS section
    const wordsSection = extractMarkdownSection(raw, 'Palavras')
    const words = extractNumber(wordsSection)
    if (words !== null) {
      response.textStats.words = words
    }

    const charsSection = extractMarkdownSection(raw, 'Caracteres')
    const chars = extractNumber(charsSection)
    if (chars !== null) {
      response.textStats.characters = chars
    }

    const sentencesSection = extractMarkdownSection(raw, 'Sentencas') || extractMarkdownSection(raw, 'Sentenças')
    const sentences = extractNumber(sentencesSection)
    if (sentences !== null) {
      response.textStats.sentences = sentences
    }

    // Parse ANALISE_LINGUISTICA section (optional)
    const brazilianismsSection = extractMarkdownSection(raw, 'Brazilianismos')
    const grammarSection = extractMarkdownSection(raw, 'Resumo Gramatical')

    if (brazilianismsSection || grammarSection) {
      response.linguisticAnalysis = {
        brazilianisms: brazilianismsSection ? extractListItems(brazilianismsSection) : [],
        grammarSummary: grammarSection ? extractPlainText(grammarSection) : '',
      }
    }

    return response
  }

  return null
}

/**
 * Helper function to escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
