/**
 * Tests for constants configuration
 * Validates timeout values per frontend-api.md spec (line 10)
 */

import {
  API_REQUEST_TIMEOUT,
  FETCH_TIMEOUT,
  AI_DETECTOR_TIMEOUT,
  FREE_CHARACTER_LIMIT,
  PREMIUM_CHARACTER_LIMIT,
  AI_DETECTOR_CHARACTER_LIMIT,
  AI_DETECTOR_DAILY_LIMIT,
} from '@/utils/constants'

describe('Timeout Configuration', () => {
  describe('API Timeouts (60s requirement)', () => {
    it('should have API_REQUEST_TIMEOUT set to 60 seconds', () => {
      expect(API_REQUEST_TIMEOUT).toBe(60000) // 60 seconds in ms
    })

    it('should have FETCH_TIMEOUT slightly less than API timeout', () => {
      expect(FETCH_TIMEOUT).toBe(55000) // 55 seconds
      expect(FETCH_TIMEOUT).toBeLessThan(API_REQUEST_TIMEOUT)
    })

    it('should have AI_DETECTOR_TIMEOUT set to 60 seconds', () => {
      expect(AI_DETECTOR_TIMEOUT).toBe(60000) // 60 seconds
    })

    it('should have timeouts in milliseconds', () => {
      expect(API_REQUEST_TIMEOUT).toBeGreaterThan(1000) // At least 1 second
      expect(FETCH_TIMEOUT).toBeGreaterThan(1000)
      expect(AI_DETECTOR_TIMEOUT).toBeGreaterThan(1000)
    })
  })

  describe('Timeout Relationship', () => {
    it('should have FETCH_TIMEOUT less than API_REQUEST_TIMEOUT', () => {
      // FETCH_TIMEOUT should be less to allow for response processing
      expect(FETCH_TIMEOUT).toBeLessThan(API_REQUEST_TIMEOUT)
    })

    it('should have reasonable timeout values for Gemini 2.5 thinking mode', () => {
      // Per frontend-api.md: "60s timeout sugerido para evitar abortos prematuros"
      const minRecommendedTimeout = 60000 // 60 seconds

      expect(API_REQUEST_TIMEOUT).toBeGreaterThanOrEqual(minRecommendedTimeout)
      expect(AI_DETECTOR_TIMEOUT).toBeGreaterThanOrEqual(minRecommendedTimeout)
    })
  })
})

describe('Character Limits', () => {
  describe('Free Tier Limits', () => {
    it('should have FREE_CHARACTER_LIMIT set to 1500', () => {
      expect(FREE_CHARACTER_LIMIT).toBe(1500)
    })

    it('should have AI_DETECTOR_CHARACTER_LIMIT set to 10000', () => {
      expect(AI_DETECTOR_CHARACTER_LIMIT).toBe(10000)
    })
  })

  describe('Premium Tier Limits', () => {
    it('should have PREMIUM_CHARACTER_LIMIT set to 5000', () => {
      expect(PREMIUM_CHARACTER_LIMIT).toBe(5000)
    })

    it('should have premium limit greater than free limit', () => {
      expect(PREMIUM_CHARACTER_LIMIT).toBeGreaterThan(FREE_CHARACTER_LIMIT)
    })
  })

  describe('AI Detector Limits', () => {
    it('should have AI_DETECTOR_CHARACTER_LIMIT greater than premium', () => {
      expect(AI_DETECTOR_CHARACTER_LIMIT).toBeGreaterThan(PREMIUM_CHARACTER_LIMIT)
    })

    it('should have AI_DETECTOR_DAILY_LIMIT set to 2', () => {
      expect(AI_DETECTOR_DAILY_LIMIT).toBe(2)
    })
  })

  describe('Limit Hierarchy', () => {
    it('should maintain proper limit hierarchy', () => {
      // Free < Premium < AI Detector
      expect(FREE_CHARACTER_LIMIT).toBeLessThan(PREMIUM_CHARACTER_LIMIT)
      expect(PREMIUM_CHARACTER_LIMIT).toBeLessThan(AI_DETECTOR_CHARACTER_LIMIT)
    })
  })
})

describe('Configuration Compliance', () => {
  it('should match frontend-api.md specifications', () => {
    // Timeout: 60s (line 10 of frontend-api.md)
    expect(API_REQUEST_TIMEOUT).toBe(60000)

    // Character limits (implicit from spec)
    expect(FREE_CHARACTER_LIMIT).toBe(1500)
    expect(PREMIUM_CHARACTER_LIMIT).toBe(5000)
    expect(AI_DETECTOR_CHARACTER_LIMIT).toBe(10000)

    // Daily limit for AI detector
    expect(AI_DETECTOR_DAILY_LIMIT).toBe(2)
  })
})
