/**
 * Tests for Mercado Pago webhook robustness
 * Ensures that webhook doesn't throw 502 errors on edge cases
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/mercadopago/webhook/route'

// Mock dependencies
jest.mock('@/lib/mercadopago/webhook-validator', () => ({
  validateWebhookSignature: jest.fn().mockReturnValue({ isValid: true }),
  parseWebhookPayload: jest.fn((body) => ({
    type: 'payment',
    action: 'payment.updated',
    id: body.data?.id || '12345'
  })),
  sanitizeWebhookData: jest.fn((data) => data),
}))

jest.mock('@/lib/mercadopago/client', () => ({
  getMercadoPagoClient: jest.fn().mockReturnValue({
    getPayment: jest.fn().mockResolvedValue({
      id: 12345,
      status: 'approved',
      payment_method_id: 'pix',
      transaction_amount: 14.95,
      currency_id: 'BRL',
      date_approved: '2025-10-27T13:13:49.000-04:00',
      date_created: '2025-10-27T13:13:05.000-04:00',
      payer: { id: '123456', email: 'test@test.com' },
      external_reference: 'user-123'
    })
  })
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
    }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  })
}))

describe('Mercado Pago Webhook - Robustness', () => {
  it('should return 200 even when payment record is not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/mercadopago/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-signature': 'test-signature',
        'x-request-id': 'test-request-id',
      },
      body: JSON.stringify({
        type: 'payment',
        data: { id: '12345' }
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
  })

  it('should not throw errors when using maybeSingle()', async () => {
    // This test ensures .maybeSingle() doesn't throw when no record is found
    const request = new NextRequest('http://localhost:3000/api/mercadopago/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-signature': 'test-signature',
        'x-request-id': 'test-request-id',
      },
      body: JSON.stringify({
        type: 'payment',
        data: { id: '99999' }
      })
    })

    // Should not throw
    await expect(POST(request)).resolves.toBeDefined()

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should handle malformed webhook data gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/mercadopago/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        invalid: 'data'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should return 200 on all errors to prevent MP retries', async () => {
    // Mock an error in payment processing
    const mockClient = require('@/lib/mercadopago/client')
    mockClient.getMercadoPagoClient = jest.fn().mockReturnValue({
      getPayment: jest.fn().mockRejectedValue(new Error('MP API Error'))
    })

    const request = new NextRequest('http://localhost:3000/api/mercadopago/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-signature': 'test-signature',
        'x-request-id': 'test-request-id',
      },
      body: JSON.stringify({
        type: 'payment',
        data: { id: '12345' }
      })
    })

    const response = await POST(request)
    const data = await response.json()

    // Should return 200 to prevent MP from retrying
    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    // Error field is optional - webhook may or may not include it
  })
})
