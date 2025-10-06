/**
 * Mercado Pago Webhook Validator
 * Validates webhook signatures using HMAC-SHA256 to ensure authenticity
 */

import crypto from 'crypto'
import { getServerConfig } from '@/utils/env-config'

export interface WebhookValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate Mercado Pago webhook signature
 *
 * MP sends webhooks with the following headers:
 * - x-signature: Contains ts (timestamp) and v1 (HMAC signature)
 * - x-request-id: Unique request identifier
 *
 * Signature format: ts=timestamp,v1=signature
 *
 * Manifest string format: id;request-id;ts
 * Where:
 * - id: data.id from webhook payload
 * - request-id: from x-request-id header
 * - ts: timestamp from x-signature header
 */
export function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  webhookSecret?: string
): WebhookValidationResult {
  try {
    // Get webhook secret from env if not provided
    const secret = webhookSecret || getServerConfig().MERCADO_PAGO_WEBHOOK_SECRET

    if (!secret) {
      return {
        isValid: false,
        error: 'Webhook secret not configured',
      }
    }

    if (!xSignature) {
      return {
        isValid: false,
        error: 'Missing x-signature header',
      }
    }

    if (!xRequestId) {
      return {
        isValid: false,
        error: 'Missing x-request-id header',
      }
    }

    // Parse signature header
    const parts = xSignature.split(',')
    let ts: string | null = null
    let hash: string | null = null

    for (const part of parts) {
      const [key, value] = part.split('=')
      if (key === 'ts') {
        ts = value
      } else if (key === 'v1') {
        hash = value
      }
    }

    if (!ts || !hash) {
      return {
        isValid: false,
        error: 'Invalid x-signature format',
      }
    }

    // Check timestamp (reject if older than 15 minutes to prevent replay attacks)
    const timestamp = parseInt(ts, 10)
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const timeDiff = currentTimestamp - timestamp

    if (timeDiff > 900) {
      // 15 minutes = 900 seconds
      return {
        isValid: false,
        error: 'Webhook signature expired (older than 15 minutes)',
      }
    }

    // Build manifest string
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

    // Generate HMAC signature
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(manifest)
    const generatedHash = hmac.digest('hex')

    // Compare signatures
    const isValid = generatedHash === hash

    if (!isValid) {
      return {
        isValid: false,
        error: 'Signature mismatch - webhook authenticity could not be verified',
      }
    }

    return {
      isValid: true,
    }
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * Validate webhook timestamp only (useful for debugging)
 */
export function validateWebhookTimestamp(
  xSignature: string | null,
  maxAgeSeconds: number = 900
): { isValid: boolean; age?: number; error?: string } {
  try {
    if (!xSignature) {
      return {
        isValid: false,
        error: 'Missing x-signature header',
      }
    }

    const parts = xSignature.split(',')
    let ts: string | null = null

    for (const part of parts) {
      const [key, value] = part.split('=')
      if (key === 'ts') {
        ts = value
        break
      }
    }

    if (!ts) {
      return {
        isValid: false,
        error: 'Timestamp not found in x-signature',
      }
    }

    const timestamp = parseInt(ts, 10)
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const age = currentTimestamp - timestamp

    return {
      isValid: age <= maxAgeSeconds,
      age,
      error: age > maxAgeSeconds ? `Timestamp too old: ${age}s` : undefined,
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Extract data from webhook payload
 */
export interface WebhookData {
  id: string
  type: 'payment' | 'subscription' | 'authorized_payment' | 'plan' | 'invoice' | 'point_integration_wh'
  action: string
  liveMode: boolean
  userId: string
  apiVersion: string
  dateCreated: string
}

export function parseWebhookPayload(body: any): WebhookData | null {
  try {
    if (!body || !body.data || !body.data.id) {
      return null
    }

    return {
      id: body.data.id,
      type: body.type || 'payment',
      action: body.action || 'created',
      liveMode: body.live_mode !== false,
      userId: body.user_id || '',
      apiVersion: body.api_version || '',
      dateCreated: body.date_created || new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error parsing webhook payload:', error)
    return null
  }
}

/**
 * Sanitize webhook data for logging (remove sensitive info)
 */
export function sanitizeWebhookData(data: any): any {
  const sanitized = { ...data }

  // Remove or mask sensitive fields
  const sensitiveFields = [
    'access_token',
    'refresh_token',
    'authorization',
    'secret',
  ]

  function sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj
    }

    const result: any = Array.isArray(obj) ? [] : {}

    for (const key in obj) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        result[key] = '[REDACTED]'
      } else if (typeof obj[key] === 'object') {
        result[key] = sanitizeObject(obj[key])
      } else {
        result[key] = obj[key]
      }
    }

    return result
  }

  return sanitizeObject(sanitized)
}
