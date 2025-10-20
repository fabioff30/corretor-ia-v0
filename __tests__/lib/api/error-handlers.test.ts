/**
 * Tests for error handlers
 * Validates error response format conformity with frontend-api.md
 */

import { handleTimeoutError, createFallbackResponse } from '@/lib/api/error-handlers'

describe('Error Response Format', () => {
  describe('handleTimeoutError', () => {
    it('should return error response with correct format', async () => {
      const response = handleTimeoutError()
      const json = await response.json()

      expect(json).toHaveProperty('error')
      expect(json).toHaveProperty('message')
      expect(json).toHaveProperty('details')
      expect(json).toHaveProperty('code')
    })

    it('should include details array with helpful information', async () => {
      const response = handleTimeoutError()
      const json = await response.json()

      expect(Array.isArray(json.details)).toBe(true)
      expect(json.details.length).toBeGreaterThan(0)
      expect(json.details[0]).toContain('60 segundos')
    })

    it('should return 504 status code', () => {
      const response = handleTimeoutError()
      expect(response.status).toBe(504)
    })

    it('should have TIMEOUT_ERROR code', async () => {
      const response = handleTimeoutError()
      const json = await response.json()
      expect(json.code).toBe('TIMEOUT_ERROR')
    })
  })

  describe('createFallbackResponse', () => {
    it('should create fallback for correction type', () => {
      const originalText = 'Test text'
      const fallback = createFallbackResponse(originalText, 'correction')

      expect(fallback).toHaveProperty('correctedText', originalText)
      expect(fallback).toHaveProperty('evaluation')
      expect(fallback.evaluation).toHaveProperty('strengths')
      expect(fallback.evaluation).toHaveProperty('weaknesses')
      expect(fallback.evaluation).toHaveProperty('suggestions')
      expect(fallback.evaluation).toHaveProperty('score')
    })

    it('should create fallback for rewrite type', () => {
      const originalText = 'Test text'
      const fallback = createFallbackResponse(originalText, 'rewrite')

      expect(fallback).toHaveProperty('rewrittenText', originalText)
      expect(fallback).toHaveProperty('evaluation')
    })

    it('should have evaluation with reasonable score', () => {
      const originalText = 'Test text'
      const fallback = createFallbackResponse(originalText, 'correction')

      expect(fallback.evaluation.score).toBe(5)
      expect(fallback.evaluation.score).toBeGreaterThanOrEqual(0)
      expect(fallback.evaluation.score).toBeLessThanOrEqual(10)
    })

    it('should include helpful suggestions in evaluation', () => {
      const originalText = 'Test text'
      const fallback = createFallbackResponse(originalText, 'correction')

      expect(Array.isArray(fallback.evaluation.suggestions)).toBe(true)
      expect(fallback.evaluation.suggestions.length).toBeGreaterThan(0)
    })
  })
})

describe('Error Format Compliance', () => {
  it('should match frontend-api.md specification format', async () => {
    const response = handleTimeoutError()
    const json = await response.json()

    // Format: { error: string, message?: string, details?: string[] }
    expect(typeof json.error).toBe('string')
    expect(json.error.length).toBeGreaterThan(0)

    if (json.message) {
      expect(typeof json.message).toBe('string')
    }

    if (json.details) {
      expect(Array.isArray(json.details)).toBe(true)
      json.details.forEach((detail: any) => {
        expect(typeof detail).toBe('string')
      })
    }
  })
})
