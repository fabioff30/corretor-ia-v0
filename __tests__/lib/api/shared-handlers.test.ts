/**
 * Tests for shared API handlers
 * Validates conformity with frontend-api.md specification
 */

import { sanitizeText, validateTextLength } from '@/lib/api/shared-handlers'
import { NextResponse } from 'next/server'

describe('sanitizeText', () => {
  it('should remove leading and trailing whitespace', () => {
    const input = '  Hello World  '
    const expected = 'Hello World'
    expect(sanitizeText(input)).toBe(expected)
  })

  it('should replace multiple spaces with single space', () => {
    const input = 'Hello    World   Test'
    const expected = 'Hello World Test'
    expect(sanitizeText(input)).toBe(expected)
  })

  it('should replace multiple tabs with single space', () => {
    const input = 'Hello\t\t\tWorld'
    const expected = 'Hello World'
    expect(sanitizeText(input)).toBe(expected)
  })

  it('should replace 3+ newlines with 2 newlines', () => {
    const input = 'Line 1\n\n\n\n\nLine 2'
    const expected = 'Line 1\n\nLine 2'
    expect(sanitizeText(input)).toBe(expected)
  })

  it('should preserve single and double newlines', () => {
    const input = 'Line 1\nLine 2\n\nLine 3'
    const expected = 'Line 1\nLine 2\n\nLine 3'
    expect(sanitizeText(input)).toBe(expected)
  })

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('')
  })

  it('should handle string with only whitespace', () => {
    const input = '   \t\n   '
    expect(sanitizeText(input)).toBe('')
  })

  it('should handle mixed whitespace scenarios', () => {
    const input = '  Hello  \t  World  \n\n\n  Test  '
    // After sanitization: trim() removes leading/trailing, spaces normalized, newlines reduced
    const result = sanitizeText(input)

    // Should not have leading/trailing whitespace
    expect(result).toBe(result.trim())

    // Should have single spaces between words
    expect(result).toContain('Hello World')

    // Should have max 2 consecutive newlines
    expect(result).not.toMatch(/\n{3,}/)
  })
})

describe('validateTextLength', () => {
  const mockRequestId = 'test-request-id'
  const mockIp = '127.0.0.1'

  it('should return null when text is within limit', () => {
    const text = 'Hello World'
    const maxLength = 1500
    const result = validateTextLength(text, maxLength, mockRequestId, mockIp)
    expect(result).toBeNull()
  })

  it('should return error response when text exceeds limit', async () => {
    const text = 'a'.repeat(2000)
    const maxLength = 1500
    const result = validateTextLength(text, maxLength, mockRequestId, mockIp)

    expect(result).toBeInstanceOf(NextResponse)

    // Extract JSON from NextResponse
    if (result instanceof NextResponse) {
      const json = await result.json()
      expect(json).toMatchObject({
        error: 'Texto muito grande',
        message: 'O texto não pode exceder 1500 caracteres',
        details: expect.arrayContaining([
          'Tamanho atual: 2000 caracteres',
          'Limite: 1500 caracteres',
          expect.stringContaining('Premium')
        ])
      })
    }
  })

  it('should return error with correct details array format', async () => {
    const text = 'a'.repeat(5000)
    const maxLength = 1500
    const result = validateTextLength(text, maxLength, mockRequestId, mockIp)

    if (result instanceof NextResponse) {
      const json = await result.json()
      expect(Array.isArray(json.details)).toBe(true)
      expect(json.details.length).toBe(3)
      expect(json.details[0]).toContain('Tamanho atual: 5000 caracteres')
      expect(json.details[1]).toContain('Limite: 1500 caracteres')
    }
  })

  it('should handle exact limit boundary', () => {
    const text = 'a'.repeat(1500)
    const maxLength = 1500
    const result = validateTextLength(text, maxLength, mockRequestId, mockIp)
    expect(result).toBeNull()
  })

  it('should handle one character over limit', () => {
    const text = 'a'.repeat(1501)
    const maxLength = 1500
    const result = validateTextLength(text, maxLength, mockRequestId, mockIp)
    expect(result).toBeInstanceOf(NextResponse)
  })
})
