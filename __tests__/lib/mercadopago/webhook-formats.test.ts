/**
 * Tests for Mercado Pago webhook format compatibility
 * Ensures both v0 (old) and v1 (new) formats are supported
 */

import { parseWebhookPayload } from '@/lib/mercadopago/webhook-validator'

describe('Mercado Pago Webhook Formats', () => {
  describe('v1 (new) format', () => {
    it('should parse v1 webhook payload correctly', () => {
      const v1Payload = {
        action: 'payment.updated',
        api_version: 'v1',
        data: { id: '131490756966' },
        date_created: '2025-10-27T18:30:27Z',
        id: 125886457286,
        live_mode: true,
        type: 'payment',
        user_id: '130693695',
      }

      const result = parseWebhookPayload(v1Payload)

      expect(result).not.toBeNull()
      expect(result?.id).toBe('131490756966')
      expect(result?.type).toBe('payment')
      expect(result?.action).toBe('payment.updated')
      expect(result?.apiVersion).toBe('v1')
      expect(result?.liveMode).toBe(true)
    })

    it('should handle v1 payload without optional fields', () => {
      const minimalV1 = {
        data: { id: '12345' },
      }

      const result = parseWebhookPayload(minimalV1)

      expect(result).not.toBeNull()
      expect(result?.id).toBe('12345')
      expect(result?.type).toBe('payment') // default
      expect(result?.action).toBe('created') // default
    })
  })

  describe('v0 (old) format', () => {
    it('should parse v0 webhook payload correctly', () => {
      const v0Payload = {
        resource: '/payments/131490756966',
        topic: 'payment',
      }

      const result = parseWebhookPayload(v0Payload)

      expect(result).not.toBeNull()
      expect(result?.id).toBe('131490756966')
      expect(result?.type).toBe('payment')
      expect(result?.action).toBe('updated')
      expect(result?.apiVersion).toBe('v0')
    })

    it('should extract ID from resource path correctly', () => {
      const testCases = [
        { resource: '/payments/123', expectedId: '123' },
        { resource: '/v1/payments/456', expectedId: '456' },
        { resource: 'payments/789', expectedId: '789' },
        { resource: '131490756966', expectedId: '131490756966' },
      ]

      testCases.forEach(({ resource, expectedId }) => {
        const result = parseWebhookPayload({ resource, topic: 'payment' })
        expect(result?.id).toBe(expectedId)
      })
    })

    it('should map topics to types correctly', () => {
      const topicMappings = [
        { topic: 'payment', expectedType: 'payment' },
        { topic: 'merchant_order', expectedType: 'payment' },
        { topic: 'subscription', expectedType: 'subscription' },
      ]

      topicMappings.forEach(({ topic, expectedType }) => {
        const result = parseWebhookPayload({
          resource: '/resource/123',
          topic,
        })
        expect(result?.type).toBe(expectedType)
      })
    })

    it('should handle v0 payload without resource path slashes', () => {
      const v0Payload = {
        resource: '131490756966',
        topic: 'payment',
      }

      const result = parseWebhookPayload(v0Payload)

      expect(result).not.toBeNull()
      expect(result?.id).toBe('131490756966')
    })
  })

  describe('invalid payloads', () => {
    it('should return null for empty payload', () => {
      expect(parseWebhookPayload(null)).toBeNull()
      expect(parseWebhookPayload(undefined)).toBeNull()
      expect(parseWebhookPayload({})).toBeNull()
    })

    it('should return null for v1 payload without data.id', () => {
      const invalid = {
        type: 'payment',
        action: 'payment.updated',
        // Missing data.id
      }

      expect(parseWebhookPayload(invalid)).toBeNull()
    })

    it('should return null for v0 payload without resource', () => {
      const invalid = {
        topic: 'payment',
        // Missing resource
      }

      expect(parseWebhookPayload(invalid)).toBeNull()
    })

    it('should return null for v0 payload with empty resource', () => {
      const invalid = {
        resource: '/',
        topic: 'payment',
      }

      expect(parseWebhookPayload(invalid)).toBeNull()
    })
  })

  describe('real-world examples', () => {
    it('should parse actual v0 payload from logs', () => {
      // From actual logs: { resource: '131490756966', topic: 'payment' }
      const actualV0 = {
        resource: '131490756966',
        topic: 'payment',
      }

      const result = parseWebhookPayload(actualV0)

      expect(result).not.toBeNull()
      expect(result?.id).toBe('131490756966')
      expect(result?.type).toBe('payment')
    })

    it('should parse actual v1 payload from logs', () => {
      // From actual logs
      const actualV1 = {
        action: 'payment.updated',
        api_version: 'v1',
        data: { id: '131490756966' },
        date_created: '2025-10-27T18:30:27Z',
        id: 125886457286,
        live_mode: true,
        type: 'payment',
        user_id: '130693695',
      }

      const result = parseWebhookPayload(actualV1)

      expect(result).not.toBeNull()
      expect(result?.id).toBe('131490756966')
      expect(result?.type).toBe('payment')
      expect(result?.action).toBe('payment.updated')
    })
  })
})
