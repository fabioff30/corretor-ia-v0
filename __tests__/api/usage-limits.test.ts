/**
 * Tests for usage limits enforcement in /api/correct and /api/rewrite
 * Tests that free users are limited to 3 corrections and 3 rewrites per day
 * Tests that premium users have unlimited access
 */

import { NextRequest } from 'next/server'
import { POST as correctPost } from '@/app/api/correct/route'
import { POST as rewritePost } from '@/app/api/rewrite/route'

// Mock dependencies
jest.mock('@/lib/api/shared-handlers')
jest.mock('@/lib/api/webhook-client')
jest.mock('@/utils/auth-helpers')
jest.mock('@/utils/limit-checker')

describe('API: Usage Limits', () => {
  let mockAuthHelpers: any
  let mockLimitChecker: any
  let mockSharedHandlers: any
  let mockWebhookClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock auth helpers
    mockAuthHelpers = require('@/utils/auth-helpers')

    // Mock limit checker
    mockLimitChecker = require('@/utils/limit-checker')

    // Mock shared handlers - bypass validation
    mockSharedHandlers = require('@/lib/api/shared-handlers')
    mockSharedHandlers.parseRequestBody = jest.fn().mockResolvedValue({
      body: { text: 'Test text', isMobile: false },
      error: null,
    })
    mockSharedHandlers.applyRateLimit = jest.fn().mockResolvedValue(null)
    mockSharedHandlers.validateAndSanitizeInput = jest.fn().mockResolvedValue({
      text: 'Test text',
      isMobile: false,
    })
    mockSharedHandlers.validateTextLength = jest.fn().mockReturnValue(null)

    // Mock webhook client - return success
    mockWebhookClient = require('@/lib/api/webhook-client')
    const mockResponse = {
      correctedText: 'Corrected text',
      rewrittenText: 'Rewritten text',
      evaluation: {
        strengths: ['Good'],
        weaknesses: [],
        suggestions: [],
        score: 8,
      },
    }

    mockWebhookClient.callWebhook = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(mockResponse)),
      json: jest.fn().mockResolvedValue(mockResponse),
    })
  })

  describe('Free User Limits', () => {
    beforeEach(() => {
      // Mock authenticated free user
      mockAuthHelpers.getCurrentUserWithProfile = jest.fn().mockResolvedValue({
        user: { id: 'free-user-123' },
        profile: { plan_type: 'free' },
      })
    })

    it('should allow correction when user has remaining corrections', async () => {
      // Mock: user has 2/3 corrections used
      mockLimitChecker.canUserPerformOperation = jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 1,
        limit: 3,
      })
      mockLimitChecker.incrementUserUsage = jest.fn().mockResolvedValue({
        success: true,
      })
      mockLimitChecker.saveCorrection = jest.fn().mockResolvedValue({
        success: true,
        id: 'correction-id',
      })

      const request = new NextRequest('http://localhost:3000/api/correct', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text', isMobile: false }),
      })

      const response = await correctPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockLimitChecker.canUserPerformOperation).toHaveBeenCalledWith('free-user-123', 'correct')
      expect(mockLimitChecker.incrementUserUsage).toHaveBeenCalledWith('free-user-123', 'correct')
    })

    it('should deny correction when user reached daily limit', async () => {
      // Mock: user has 3/3 corrections used
      mockLimitChecker.canUserPerformOperation = jest.fn().mockResolvedValue({
        allowed: false,
        reason: 'Limite diário atingido. Você pode fazer até 3 correções por dia.',
        remaining: 0,
        limit: 3,
      })

      const request = new NextRequest('http://localhost:3000/api/correct', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text', isMobile: false }),
      })

      const response = await correctPost(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Limite diário excedido')
      expect(data.details).toContain('Limite: 3 correções por dia')
      expect(mockLimitChecker.incrementUserUsage).not.toHaveBeenCalled()
    })

    it('should allow rewrite when user has remaining rewrites', async () => {
      // Mock: user has 1/3 rewrites used
      mockLimitChecker.canUserPerformOperation = jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 2,
        limit: 3,
      })
      mockLimitChecker.incrementUserUsage = jest.fn().mockResolvedValue({
        success: true,
      })
      mockLimitChecker.saveCorrection = jest.fn().mockResolvedValue({
        success: true,
        id: 'rewrite-id',
      })

      const request = new NextRequest('http://localhost:3000/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text', style: 'formal', isMobile: false }),
      })

      const response = await rewritePost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockLimitChecker.canUserPerformOperation).toHaveBeenCalledWith('free-user-123', 'rewrite')
      expect(mockLimitChecker.incrementUserUsage).toHaveBeenCalledWith('free-user-123', 'rewrite')
    })

    it('should deny rewrite when user reached daily limit', async () => {
      // Mock: user has 3/3 rewrites used
      mockLimitChecker.canUserPerformOperation = jest.fn().mockResolvedValue({
        allowed: false,
        reason: 'Limite diário atingido. Você pode fazer até 3 reescritas por dia.',
        remaining: 0,
        limit: 3,
      })

      const request = new NextRequest('http://localhost:3000/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text', style: 'formal', isMobile: false }),
      })

      const response = await rewritePost(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Limite diário excedido')
      expect(data.details).toContain('Limite: 3 reescritas por dia')
      expect(mockLimitChecker.incrementUserUsage).not.toHaveBeenCalled()
    })
  })

  describe('Premium User Unlimited Access', () => {
    beforeEach(() => {
      // Mock authenticated premium user
      mockAuthHelpers.getCurrentUserWithProfile = jest.fn().mockResolvedValue({
        user: { id: 'premium-user-123' },
        profile: { plan_type: 'pro' },
      })

      mockLimitChecker.saveCorrection = jest.fn().mockResolvedValue({
        success: true,
        id: 'correction-id',
      })
    })

    it('should allow correction without checking limits for premium request', async () => {
      const request = new NextRequest('http://localhost:3000/api/correct', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text', isMobile: false, isPremium: true }),
      })

      const response = await correctPost(request)

      expect(response.status).toBe(200)
      // Premium users should NOT have limits checked
      expect(mockLimitChecker.canUserPerformOperation).not.toHaveBeenCalled()
      expect(mockLimitChecker.incrementUserUsage).not.toHaveBeenCalled()
    })

    it('should allow rewrite without checking limits for premium request', async () => {
      const request = new NextRequest('http://localhost:3000/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text', style: 'formal', isMobile: false, isPremium: true }),
      })

      const response = await rewritePost(request)

      expect(response.status).toBe(200)
      // Premium users should NOT have limits checked
      expect(mockLimitChecker.canUserPerformOperation).not.toHaveBeenCalled()
      expect(mockLimitChecker.incrementUserUsage).not.toHaveBeenCalled()
    })
  })

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      // Mock unauthenticated user (throws error)
      mockAuthHelpers.getCurrentUserWithProfile = jest.fn().mockRejectedValue(
        new Error('Not authenticated')
      )
    })

    it('should allow correction without checking user limits', async () => {
      const request = new NextRequest('http://localhost:3000/api/correct', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text', isMobile: false }),
      })

      const response = await correctPost(request)

      expect(response.status).toBe(200)
      // Unauthenticated users should NOT have user limits checked
      expect(mockLimitChecker.canUserPerformOperation).not.toHaveBeenCalled()
      expect(mockLimitChecker.incrementUserUsage).not.toHaveBeenCalled()
      // But rate limiting should still apply (handled by applyRateLimit)
      expect(mockSharedHandlers.applyRateLimit).toHaveBeenCalled()
    })
  })

  describe('Admin User', () => {
    beforeEach(() => {
      // Mock authenticated admin user
      mockAuthHelpers.getCurrentUserWithProfile = jest.fn().mockResolvedValue({
        user: { id: 'admin-user-123' },
        profile: { plan_type: 'admin' },
      })

      mockLimitChecker.saveCorrection = jest.fn().mockResolvedValue({
        success: true,
        id: 'correction-id',
      })
    })

    it('should allow unlimited corrections for admin via premium flag', async () => {
      const request = new NextRequest('http://localhost:3000/api/correct', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text', isMobile: false, isPremium: true }),
      })

      const response = await correctPost(request)

      expect(response.status).toBe(200)
      expect(mockLimitChecker.canUserPerformOperation).not.toHaveBeenCalled()
      expect(mockLimitChecker.incrementUserUsage).not.toHaveBeenCalled()
    })
  })
})
