/**
 * Tests for /api/verify-pix-activation endpoint
 * Tests the new endpoint that verifies PIX payment AND profile activation
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/verify-pix-activation/route'

// Mock dependencies
jest.mock('@/lib/mercadopago/client')
jest.mock('@/lib/supabase/server')
jest.mock('@/utils/auth-helpers')

const mockMercadoPagoClient = {
  getPixPaymentStatus: jest.fn(),
}

let mockFromReturn: any

const createMockSupabaseClient = () => {
  mockFromReturn = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  }

  return {
    from: jest.fn(() => mockFromReturn),
  }
}

let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

describe('API: /api/verify-pix-activation', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Create new mock instance
    mockSupabaseClient = createMockSupabaseClient()

    // Mock Mercado Pago client
    const mpModule = require('@/lib/mercadopago/client')
    mpModule.getMercadoPagoClient = jest.fn(() => mockMercadoPagoClient)

    // Mock Supabase client
    const supabaseModule = require('@/lib/supabase/server')
    supabaseModule.createServiceRoleClient = jest.fn(() => mockSupabaseClient)
  })

  describe('GET /api/verify-pix-activation', () => {
    it('should return 400 if paymentId is missing', async () => {
      const request = new NextRequest('http://localhost/api/verify-pix-activation')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Payment ID is required')
    })

    it('should return 401 if user is not authenticated', async () => {
      const authModule = require('@/utils/auth-helpers')
      authModule.getCurrentUserWithProfile = jest.fn().mockResolvedValue({
        user: null,
        profile: null,
      })

      const request = new NextRequest('http://localhost/api/verify-pix-activation?paymentId=123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return ready=false if payment not approved', async () => {
      const authModule = require('@/utils/auth-helpers')
      authModule.getCurrentUserWithProfile = jest.fn().mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        profile: null,
      })

      // Payment not approved
      mockMercadoPagoClient.getPixPaymentStatus.mockResolvedValue({
        status: 'pending',
        id: '123',
      })

      // Setup mock responses in sequence
      mockFromReturn.maybeSingle
        // First call: PIX payment record
        .mockResolvedValueOnce({
          data: {
            user_id: 'user-123',
            status: 'pending',
            paid_at: null,
          },
          error: null,
        })
        // Second call: Profile
        .mockResolvedValueOnce({
          data: {
            id: 'user-123',
            plan_type: 'free',
            subscription_status: 'inactive',
          },
          error: null,
        })
        // Third call: Subscription
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      const request = new NextRequest('http://localhost/api/verify-pix-activation?paymentId=123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.paymentApproved).toBe(false)
      expect(data.profileActivated).toBe(false)
      expect(data.ready).toBe(false)
    })

    it('should return ready=false if payment approved but profile not activated', async () => {
      const authModule = require('@/utils/auth-helpers')
      authModule.getCurrentUserWithProfile = jest.fn().mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        profile: null,
      })

      // Payment approved
      mockMercadoPagoClient.getPixPaymentStatus.mockResolvedValue({
        status: 'approved',
        id: '123',
      })

      // Setup mock responses in sequence
      mockFromReturn.maybeSingle
        // First call: PIX payment record
        .mockResolvedValueOnce({
          data: {
            user_id: 'user-123',
            status: 'paid',
            paid_at: new Date().toISOString(),
          },
          error: null,
        })
        // Second call: Profile (still FREE)
        .mockResolvedValueOnce({
          data: {
            id: 'user-123',
            plan_type: 'free',
            subscription_status: 'inactive',
          },
          error: null,
        })
        // Third call: Subscription (none exists)
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      const request = new NextRequest('http://localhost/api/verify-pix-activation?paymentId=123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.paymentApproved).toBe(true)
      expect(data.profileActivated).toBe(false)
      expect(data.subscriptionCreated).toBe(false)
      expect(data.ready).toBe(false)
    })

    it('should return ready=true when payment approved AND profile activated AND subscription created', async () => {
      const authModule = require('@/utils/auth-helpers')
      authModule.getCurrentUserWithProfile = jest.fn().mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        profile: null,
      })

      // Payment approved
      mockMercadoPagoClient.getPixPaymentStatus.mockResolvedValue({
        status: 'approved',
        id: '123',
      })

      // Setup mock responses in sequence
      mockFromReturn.maybeSingle
        // First call: PIX payment record
        .mockResolvedValueOnce({
          data: {
            user_id: 'user-123',
            status: 'paid',
            paid_at: new Date().toISOString(),
          },
          error: null,
        })
        // Second call: Profile (PRO activated)
        .mockResolvedValueOnce({
          data: {
            id: 'user-123',
            plan_type: 'pro',
            subscription_status: 'active',
            email: 'test@example.com',
          },
          error: null,
        })
        // Third call: Subscription (created and active)
        .mockResolvedValueOnce({
          data: {
            id: 'sub-123',
            status: 'authorized',
            user_id: 'user-123',
          },
          error: null,
        })

      const request = new NextRequest('http://localhost/api/verify-pix-activation?paymentId=123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.paymentApproved).toBe(true)
      expect(data.profileActivated).toBe(true)
      expect(data.subscriptionCreated).toBe(true)
      expect(data.ready).toBe(true)
      expect(data.profile).toBeTruthy()
      expect(data.profile.plan_type).toBe('pro')
      expect(data.profile.subscription_status).toBe('active')
    })

    it('should return 403 if payment belongs to different user', async () => {
      const authModule = require('@/utils/auth-helpers')
      authModule.getCurrentUserWithProfile = jest.fn().mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        profile: null,
      })

      mockMercadoPagoClient.getPixPaymentStatus.mockResolvedValue({
        status: 'approved',
        id: '123',
      })

      // Mock PIX payment record (different user)
      mockFromReturn.maybeSingle.mockResolvedValueOnce({
        data: {
          user_id: 'user-999', // Different user!
          status: 'paid',
          paid_at: new Date().toISOString(),
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/verify-pix-activation?paymentId=123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should include debug information in response', async () => {
      const authModule = require('@/utils/auth-helpers')
      authModule.getCurrentUserWithProfile = jest.fn().mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        profile: null,
      })

      mockMercadoPagoClient.getPixPaymentStatus.mockResolvedValue({
        status: 'approved',
        id: '123',
      })

      // Setup mock responses in sequence
      mockFromReturn.maybeSingle
        .mockResolvedValueOnce({
          data: { user_id: 'user-123', status: 'paid' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'user-123',
            plan_type: 'pro',
            subscription_status: 'active',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'sub-123', status: 'authorized' },
          error: null,
        })

      const request = new NextRequest('http://localhost/api/verify-pix-activation?paymentId=123')

      const response = await GET(request)
      const data = await response.json()

      expect(data.debug).toBeDefined()
      expect(data.debug.paymentStatus).toBe('approved')
      expect(data.debug.profilePlanType).toBe('pro')
      expect(data.debug.profileSubscriptionStatus).toBe('active')
      expect(data.debug.timestamp).toBeDefined()
    })
  })
})
