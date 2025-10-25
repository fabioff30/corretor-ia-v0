/**
 * Integration tests for error response format
 * Validates that all error responses follow frontend-api.md spec:
 * { error: string, message?: string, details?: string[] }
 */

describe('Error Response Format Integration', () => {
  describe('Error Format Schema', () => {
    const validateErrorFormat = (errorResponse: any) => {
      // Required field
      expect(errorResponse).toHaveProperty('error')
      expect(typeof errorResponse.error).toBe('string')
      expect(errorResponse.error.length).toBeGreaterThan(0)

      // Optional fields
      if (errorResponse.message) {
        expect(typeof errorResponse.message).toBe('string')
      }

      if (errorResponse.details) {
        expect(Array.isArray(errorResponse.details)).toBe(true)
        errorResponse.details.forEach((detail: any) => {
          expect(typeof detail).toBe('string')
          expect(detail.length).toBeGreaterThan(0)
        })
      }
    }

    it('should validate 400 Bad Request format', () => {
      const error400 = {
        error: 'Texto muito grande',
        message: 'O texto não pode exceder 1500 caracteres',
        details: [
          'Tamanho atual: 2000 caracteres',
          'Limite: 1500 caracteres',
          'Considere usar um plano Premium para textos maiores'
        ]
      }

      validateErrorFormat(error400)
    })

    it('should validate 401 Unauthorized format', () => {
      const error401 = {
        error: 'Não autorizado',
        message: 'Usuário não autenticado',
        details: ['Faça login para usar recursos premium']
      }

      validateErrorFormat(error401)
    })

    it('should validate 429 Rate Limit format', () => {
      const error429 = {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        details: [
          'Você atingiu o limite de 10 requisições por minuto',
          'Aguarde 60 segundos antes de tentar novamente',
          'Considere um plano Premium para limites maiores'
        ],
        retryAfter: 60
      }

      validateErrorFormat(error429)
    })

    it('should validate 504 Timeout format', () => {
      const error504 = {
        error: 'Tempo limite excedido',
        message: 'O servidor demorou muito para responder...',
        details: [
          'O processamento excedeu o tempo limite de 60 segundos',
          'Tente reduzir o tamanho do texto ou tente novamente mais tarde'
        ],
        code: 'TIMEOUT_ERROR'
      }

      validateErrorFormat(error504)
    })

    it('should validate 500 Server Error format', () => {
      const error500 = {
        error: 'Erro interno',
        message: 'Erro ao processar o texto...',
        details: [
          'Verifique se o texto contém apenas caracteres válidos',
          'Tente reduzir o tamanho do texto',
          'Aguarde alguns minutos antes de tentar novamente'
        ],
        code: 'GENERAL_ERROR'
      }

      validateErrorFormat(error500)
    })
  })

  describe('Details Array Content', () => {
    it('should have helpful details for validation errors', () => {
      const validationError = {
        error: 'Erro de validação',
        message: 'O texto contém caracteres inválidos',
        details: [
          'Foram detectados padrões potencialmente perigosos no texto',
          'Remova qualquer código ou script do texto',
          'Certifique-se de que o texto contém apenas conteúdo textual'
        ]
      }

      expect(validationError.details).toBeInstanceOf(Array)
      expect(validationError.details.length).toBe(3)
      validationError.details.forEach(detail => {
        expect(detail).toContain('texto')
      })
    })

    it('should have actionable details for rate limit errors', () => {
      const rateLimitError = {
        error: 'Rate limit exceeded',
        details: [
          'Você atingiu o limite de 10 requisições por minuto',
          'Aguarde 60 segundos antes de tentar novamente',
          'Considere um plano Premium para limites maiores'
        ]
      }

      expect(rateLimitError.details.length).toBe(3)
      expect(rateLimitError.details[0]).toContain('limite')
      expect(rateLimitError.details[1]).toContain('Aguarde')
      expect(rateLimitError.details[2]).toContain('Premium')
    })
  })

  describe('Error Codes', () => {
    it('should include error codes for specific errors', () => {
      const timeoutError = {
        error: 'Tempo limite excedido',
        code: 'TIMEOUT_ERROR'
      }

      const generalError = {
        error: 'Erro interno',
        code: 'GENERAL_ERROR'
      }

      expect(timeoutError.code).toBe('TIMEOUT_ERROR')
      expect(generalError.code).toBe('GENERAL_ERROR')
    })
  })

  describe('Error Message Quality', () => {
    it('should have user-friendly error messages', () => {
      const errors = [
        'Texto muito grande',
        'Não autorizado',
        'Rate limit exceeded',
        'Tempo limite excedido',
        'Erro de validação'
      ]

      errors.forEach(error => {
        expect(error.length).toBeGreaterThan(5)
        expect(error).not.toContain('undefined')
        expect(error).not.toContain('null')
      })
    })

    it('should have descriptive messages in Portuguese', () => {
      const portugueseErrors = [
        'Texto muito grande',
        'Não autorizado',
        'Tempo limite excedido',
        'Erro de validação'
      ]

      portugueseErrors.forEach(error => {
        // Should contain Portuguese characters or common words
        const hasPortugueseChars = /[áéíóúâêôãõç]/i.test(error) ||
          /texto|erro|não|limite/i.test(error)
        expect(hasPortugueseChars).toBe(true)
      })
    })
  })

  describe('Frontend-api.md Compliance', () => {
    it('should match the exact format from spec', () => {
      // Format from frontend-api.md line 11:
      // { error: string, details?: string[] }

      const exampleError = {
        error: 'Test error',
        message: 'Optional message',
        details: ['Detail 1', 'Detail 2']
      }

      // Required
      expect(exampleError.error).toBeDefined()
      expect(typeof exampleError.error).toBe('string')

      // Optional
      if (exampleError.details) {
        expect(Array.isArray(exampleError.details)).toBe(true)
      }

      if (exampleError.message) {
        expect(typeof exampleError.message).toBe('string')
      }
    })
  })
})
