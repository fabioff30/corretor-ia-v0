/**
 * Tests for Markdown Parser
 */

import {
  isMarkdownResponse,
  hasLegacyMarkers,
  extractBetweenMarkers,
  extractMarkdownSection,
  extractListItems,
  extractNumber,
  extractPlainText,
  parseMarkdownEvaluation,
  parseCorrectionResponse,
  parseRewriteResponse,
  parseToneResponse,
  parseAIDetectorResponse,
} from '../markdown-parser'

describe('Markdown Parser', () => {
  describe('isMarkdownResponse', () => {
    it('should detect new Markdown format', () => {
      const markdown = `# TEXTO_CORRIGIDO

Este é o texto corrigido.

# AVALIACAO

## Nota
8

## Pontos Fortes
- Boa estrutura`

      expect(isMarkdownResponse(markdown)).toBe(true)
    })

    it('should not detect legacy format as Markdown', () => {
      const legacy = `<<<CORRIGIDO>>>
Texto corrigido
<<<FIM>>>

<<<AVALIACAO>>>
{"strengths": [], "score": 7}
<<<FIM_AVALIACAO>>>`

      expect(isMarkdownResponse(legacy)).toBe(false)
    })
  })

  describe('hasLegacyMarkers', () => {
    it('should detect legacy markers', () => {
      const legacy = `<<<CORRIGIDO>>>
Texto
<<<FIM>>>`
      expect(hasLegacyMarkers(legacy)).toBe(true)
    })

    it('should not detect Markdown as legacy', () => {
      const markdown = `# TEXTO_CORRIGIDO
Texto`
      expect(hasLegacyMarkers(markdown)).toBe(false)
    })
  })

  describe('extractBetweenMarkers', () => {
    it('should extract content between markers', () => {
      const raw = `<<<CORRIGIDO>>>
Este é o texto corrigido com várias linhas.
Mantendo a formatação.
<<<FIM>>>`

      const result = extractBetweenMarkers(raw, '<<<CORRIGIDO>>>', '<<<FIM>>>')
      expect(result).toBe('Este é o texto corrigido com várias linhas.\nMantendo a formatação.')
    })

    it('should return null if start marker not found', () => {
      const raw = 'Texto sem marcadores'
      expect(extractBetweenMarkers(raw, '<<<START>>>', '<<<END>>>')).toBe(null)
    })

    it('should handle missing end marker', () => {
      const raw = `<<<CORRIGIDO>>>
Texto sem fim`
      const result = extractBetweenMarkers(raw, '<<<CORRIGIDO>>>', '<<<FIM>>>')
      expect(result).toBe('Texto sem fim')
    })
  })

  describe('extractMarkdownSection', () => {
    it('should extract ## section content', () => {
      const markdown = `# AVALIACAO

## Nota
8

## Pontos Fortes
- Item 1
- Item 2

## Pontos Fracos
- Fraqueza 1`

      expect(extractMarkdownSection(markdown, 'Nota')).toBe('8')
      expect(extractMarkdownSection(markdown, 'Pontos Fortes')).toBe('- Item 1\n- Item 2')
    })

    it('should extract # section content', () => {
      const markdown = `# TEXTO_CORRIGIDO

Este é o texto corrigido completo.
Com múltiplas linhas.

# AVALIACAO`

      expect(extractMarkdownSection(markdown, 'TEXTO_CORRIGIDO')).toBe(
        'Este é o texto corrigido completo.\nCom múltiplas linhas.'
      )
    })

    it('should return null for non-existent section', () => {
      const markdown = `## Nota
8`
      expect(extractMarkdownSection(markdown, 'Inexistente')).toBe(null)
    })
  })

  describe('extractListItems', () => {
    it('should extract items with dash prefix', () => {
      const section = `- Item 1
- Item 2
- Item 3`
      expect(extractListItems(section)).toEqual(['Item 1', 'Item 2', 'Item 3'])
    })

    it('should extract items with asterisk prefix', () => {
      const section = `* Item A
* Item B`
      expect(extractListItems(section)).toEqual(['Item A', 'Item B'])
    })

    it('should handle mixed content', () => {
      const section = `Some intro text
- Item 1
More text
- Item 2`
      expect(extractListItems(section)).toEqual(['Item 1', 'Item 2'])
    })

    it('should return empty array for no list items', () => {
      expect(extractListItems('Just plain text')).toEqual([])
    })
  })

  describe('extractNumber', () => {
    it('should extract simple number', () => {
      expect(extractNumber('8')).toBe(8)
    })

    it('should extract number with /10 format', () => {
      expect(extractNumber('8/10')).toBe(8)
    })

    it('should extract decimal number', () => {
      expect(extractNumber('7.5')).toBe(7.5)
    })

    it('should clamp to 0-10 range when clamp=true', () => {
      expect(extractNumber('15', true)).toBe(10)
      expect(extractNumber('15', false)).toBe(15) // without clamp, returns actual value
      expect(extractNumber('-5')).toBe(5) // extracts the 5 from "-5" (- is not part of number pattern)
    })

    it('should return null for non-numeric content', () => {
      expect(extractNumber('texto')).toBe(null)
      expect(extractNumber(null)).toBe(null)
    })
  })

  describe('extractPlainText', () => {
    it('should extract text without list items', () => {
      const section = `Este é o texto principal.
- Item de lista
Mais texto aqui.`
      expect(extractPlainText(section)).toBe('Este é o texto principal.\nMais texto aqui.')
    })

    it('should return empty string for null', () => {
      expect(extractPlainText(null)).toBe('')
    })
  })

  describe('parseMarkdownEvaluation', () => {
    it('should parse complete evaluation', () => {
      const markdown = `## Nota
8

## Pontos Fortes
- Boa estrutura de parágrafos
- Uso adequado de pontuação

## Pontos Fracos
- Algumas concordâncias incorretas

## Sugestoes
- Revisar uso de vírgulas

## Melhorias
- Substituição de termos coloquiais

## Analise
Texto bem escrito com poucas correções necessárias.

## Modelo
deepseek-v3`

      const result = parseMarkdownEvaluation(markdown)

      expect(result.score).toBe(8)
      expect(result.strengths).toEqual([
        'Boa estrutura de parágrafos',
        'Uso adequado de pontuação',
      ])
      expect(result.weaknesses).toEqual(['Algumas concordâncias incorretas'])
      expect(result.suggestions).toEqual(['Revisar uso de vírgulas'])
      expect(result.improvements).toEqual(['Substituição de termos coloquiais'])
      expect(result.analysis).toBe('Texto bem escrito com poucas correções necessárias.')
      expect(result.model).toBe('deepseek-v3')
    })

    it('should handle missing sections with defaults', () => {
      const markdown = `## Nota
7`
      const result = parseMarkdownEvaluation(markdown)

      expect(result.score).toBe(7)
      expect(result.strengths).toEqual(['Texto processado com sucesso'])
      expect(result.weaknesses).toEqual([])
      expect(result.suggestions).toEqual([])
    })
  })

  describe('parseCorrectionResponse', () => {
    it('should parse legacy format with JSON evaluation', () => {
      const legacy = `<<<CORRIGIDO>>>
Este é o texto corrigido.
<<<FIM>>>

<<<AVALIACAO>>>
{
  "strengths": ["Boa escrita"],
  "weaknesses": ["Erro de concordância"],
  "suggestions": ["Revisar"],
  "score": 8
}
<<<FIM_AVALIACAO>>>`

      const result = parseCorrectionResponse(legacy)

      expect(result.correctedText).toBe('Este é o texto corrigido.')
      expect(result.evaluation.score).toBe(8)
      expect(result.evaluation.strengths).toEqual(['Boa escrita'])
      expect(result.evaluation.weaknesses).toEqual(['Erro de concordância'])
    })

    it('should parse legacy format with Markdown evaluation', () => {
      const mixed = `<<<CORRIGIDO>>>
Texto corrigido aqui.
<<<FIM>>>

<<<AVALIACAO>>>
## Nota
9

## Pontos Fortes
- Excelente estrutura
- Clareza na exposição

## Sugestoes
- Nenhuma correção necessária
<<<FIM_AVALIACAO>>>`

      const result = parseCorrectionResponse(mixed)

      expect(result.correctedText).toBe('Texto corrigido aqui.')
      expect(result.evaluation.score).toBe(9)
      expect(result.evaluation.strengths).toEqual(['Excelente estrutura', 'Clareza na exposição'])
    })

    it('should parse new pure Markdown format', () => {
      const markdown = `# TEXTO_CORRIGIDO

Este é o texto completamente corrigido.
Mantendo múltiplas linhas.

# AVALIACAO

## Nota
8

## Pontos Fortes
- Boa coesão textual

## Pontos Fracos
- Pequenos erros de pontuação

## Sugestoes
- Atenção ao uso de vírgulas`

      const result = parseCorrectionResponse(markdown)

      expect(result.correctedText).toBe('Este é o texto completamente corrigido.\nMantendo múltiplas linhas.')
      expect(result.evaluation.score).toBe(8)
      expect(result.evaluation.strengths).toEqual(['Boa coesão textual'])
      expect(result.evaluation.weaknesses).toEqual(['Pequenos erros de pontuação'])
    })

    it('should handle malformed JSON with fallback to Markdown', () => {
      const malformed = `<<<CORRIGIDO>>>
Texto
<<<FIM>>>

<<<AVALIACAO>>>
{
  "strengths": ["Bom"],
  "score": 7
  // JSON inválido
}
<<<FIM_AVALIACAO>>>`

      const result = parseCorrectionResponse(malformed)

      expect(result.correctedText).toBe('Texto')
      // Should fallback to default evaluation when JSON fails
      expect(result.evaluation.score).toBe(7) // Default
    })

    it('should fallback to raw text when no markers found', () => {
      const plain = 'Apenas texto simples sem marcadores.'
      const result = parseCorrectionResponse(plain)

      expect(result.correctedText).toBe('Apenas texto simples sem marcadores.')
    })
  })

  describe('parseRewriteResponse', () => {
    it('should parse rewrite with REESCRITO marker', () => {
      const response = `<<<REESCRITO>>>
Texto reescrito aqui.
<<<FIM>>>

<<<AVALIACAO>>>
{
  "strengths": [],
  "weaknesses": [],
  "suggestions": [],
  "score": 8,
  "styleApplied": "academico",
  "changes": ["Formalização do vocabulário"]
}
<<<FIM_AVALIACAO>>>`

      const result = parseRewriteResponse(response)

      expect(result.rewrittenText).toBe('Texto reescrito aqui.')
      expect(result.evaluation.styleApplied).toBe('academico')
      expect(result.evaluation.changes).toEqual(['Formalização do vocabulário'])
    })

    it('should fallback to CORRIGIDO marker', () => {
      const response = `<<<CORRIGIDO>>>
Texto usando marcador alternativo.
<<<FIM>>>`

      const result = parseRewriteResponse(response)
      expect(result.rewrittenText).toBe('Texto usando marcador alternativo.')
    })
  })

  describe('parseToneResponse', () => {
    it('should parse tone adjustment response', () => {
      const response = `<<<AJUSTADO>>>
Texto com tom formal aplicado.
<<<FIM>>>

<<<AVALIACAO>>>
{
  "suggestions": [],
  "toneApplied": "Formal",
  "changes": ["Substituição de você por o senhor"]
}
<<<FIM_AVALIACAO>>>`

      const result = parseToneResponse(response)

      expect(result.adjustedText).toBe('Texto com tom formal aplicado.')
      expect(result.evaluation.toneApplied).toBe('Formal')
    })
  })

  describe('parseAIDetectorResponse', () => {
    it('should parse JSON format', () => {
      const json = JSON.stringify({
        result: {
          verdict: 'human',
          probability: 15,
          confidence: 'high',
          explanation: 'Texto típico de escrita humana.',
          signals: ['Variação natural', 'Expressões idiomáticas'],
        },
        textStats: {
          words: 250,
          characters: 1500,
          sentences: 15,
        },
      })

      const result = parseAIDetectorResponse(json)

      expect(result).not.toBeNull()
      expect(result!.result.verdict).toBe('human')
      expect(result!.result.probability).toBe(15)
      expect(result!.textStats.words).toBe(250)
    })

    it('should parse Markdown format', () => {
      const markdown = `# RESULTADO

## Veredito
human

## Probabilidade
15

## Confianca
high

## Explicacao
O texto apresenta características de escrita humana.

## Sinais
- Variação natural no comprimento
- Expressões idiomáticas

# ESTATISTICAS

## Palavras
250

## Caracteres
1500

## Sentencas
15

# ANALISE_LINGUISTICA

## Brazilianismos
- "a gente" (informal)
- "né" (confirmativo)

## Resumo Gramatical
Texto com boa estrutura.`

      const result = parseAIDetectorResponse(markdown)

      expect(result).not.toBeNull()
      expect(result!.result.verdict).toBe('human')
      expect(result!.result.probability).toBe(15)
      expect(result!.result.confidence).toBe('high')
      expect(result!.result.signals).toContain('Variação natural no comprimento')
      expect(result!.textStats.words).toBe(250)
      expect(result!.linguisticAnalysis).toBeDefined()
      expect(result!.linguisticAnalysis!.brazilianisms).toContain('"a gente" (informal)')
    })

    it('should return null for invalid input', () => {
      expect(parseAIDetectorResponse('invalid input')).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = parseCorrectionResponse('')
      expect(result.correctedText).toBe('')
    })

    it('should handle special characters in text', () => {
      const response = `<<<CORRIGIDO>>>
Texto com "aspas", 'apóstrofos' e {chaves}.
<<<FIM>>>

<<<AVALIACAO>>>
## Nota
8

## Pontos Fortes
- Uso correto de pontuação: "aspas"
<<<FIM_AVALIACAO>>>`

      const result = parseCorrectionResponse(response)
      expect(result.correctedText).toContain('"aspas"')
      expect(result.evaluation.strengths[0]).toContain('"aspas"')
    })

    it('should handle accented characters', () => {
      const response = `<<<CORRIGIDO>>>
Texto com acentuação: café, coração, ação, além.
<<<FIM>>>

<<<AVALIACAO>>>
{
  "strengths": ["Acentuação correta"],
  "weaknesses": [],
  "suggestions": [],
  "score": 9
}
<<<FIM_AVALIACAO>>>`

      const result = parseCorrectionResponse(response)
      expect(result.correctedText).toContain('café')
      expect(result.correctedText).toContain('coração')
    })

    it('should handle very long text', () => {
      const longText = 'Lorem ipsum '.repeat(1000)
      const response = `<<<CORRIGIDO>>>
${longText}
<<<FIM>>>

<<<AVALIACAO>>>
{"strengths": [], "weaknesses": [], "suggestions": [], "score": 7}
<<<FIM_AVALIACAO>>>`

      const result = parseCorrectionResponse(response)
      expect(result.correctedText.length).toBeGreaterThan(10000)
    })
  })
})
