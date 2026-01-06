/**
 * Meta Conversions API (CAPI) Client
 *
 * Server-side tracking for Meta/Facebook events
 * Complements client-side Meta Pixel for better attribution and deduplication
 *
 * Features:
 * - SHA256 hashing for PII data
 * - Event deduplication via event_id
 * - Support for standard and custom events
 * - Non-blocking error handling
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import type {
  MetaUserData,
  MetaUserDataPayload,
  MetaPurchaseEventData,
  MetaCheckoutEventData,
  MetaPageViewEventData,
  MetaCustomEventData,
  MetaEventPayload,
  MetaCAPIRequestPayload,
  MetaCAPIResponse,
  MetaCAPIResult,
  MetaCAPIConfig,
} from './types'

import {
  hashEmail,
  hashPhone,
  hashName,
  hashExternalId,
  hashGeo,
  splitFullName,
  wrapInArray,
  generateEventId,
} from './hash-utils'

// ============================================================================
// CONFIGURATION
// ============================================================================

const META_API_VERSION = 'v21.0'
const META_API_BASE_URL = 'https://graph.facebook.com'

/**
 * Get Meta CAPI configuration from environment
 */
function getConfig(): MetaCAPIConfig {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  const testEventCode = process.env.META_TEST_EVENT_CODE

  if (!pixelId) {
    throw new Error('[Meta CAPI] META_PIXEL_ID is not configured')
  }

  if (!accessToken) {
    throw new Error('[Meta CAPI] META_CAPI_ACCESS_TOKEN is not configured')
  }

  return {
    pixelId,
    accessToken,
    testEventCode,
    debug: process.env.NODE_ENV !== 'production',
  }
}

// ============================================================================
// USER DATA PROCESSING
// ============================================================================

/**
 * Process and hash user data for Meta API
 */
function processUserData(userData: MetaUserData): MetaUserDataPayload {
  const payload: MetaUserDataPayload = {}

  // Non-hashed fields (passed as-is)
  if (userData.clientIp) {
    payload.client_ip_address = userData.clientIp
  }
  if (userData.clientUserAgent) {
    payload.client_user_agent = userData.clientUserAgent
  }
  if (userData.fbc) {
    payload.fbc = userData.fbc
  }
  if (userData.fbp) {
    payload.fbp = userData.fbp
  }

  // Hashed fields - email
  const hashedEmail = hashEmail(userData.email)
  if (hashedEmail) {
    payload.em = [hashedEmail]
  }

  // Hashed fields - phone
  const hashedPhone = hashPhone(userData.phone)
  if (hashedPhone) {
    payload.ph = [hashedPhone]
  }

  // Hashed fields - name (split if only full name provided)
  let firstName = userData.firstName
  let lastName = userData.lastName

  // If we have email but no name, try to extract from email
  if (!firstName && userData.email) {
    const localPart = userData.email.split('@')[0]
    if (localPart && localPart.includes('.')) {
      const parts = localPart.split('.')
      firstName = parts[0]
      lastName = parts.slice(1).join(' ')
    }
  }

  const hashedFirstName = hashName(firstName)
  if (hashedFirstName) {
    payload.fn = [hashedFirstName]
  }

  const hashedLastName = hashName(lastName)
  if (hashedLastName) {
    payload.ln = [hashedLastName]
  }

  // Hashed fields - external ID (user ID)
  const hashedUserId = hashExternalId(userData.userId)
  if (hashedUserId) {
    payload.external_id = [hashedUserId]
  }

  // Hashed fields - geographic
  const hashedCity = hashGeo(userData.city)
  if (hashedCity) {
    payload.ct = [hashedCity]
  }

  const hashedState = hashGeo(userData.state)
  if (hashedState) {
    payload.st = [hashedState]
  }

  const hashedZip = hashGeo(userData.zipCode)
  if (hashedZip) {
    payload.zp = [hashedZip]
  }

  const hashedCountry = hashGeo(userData.country || 'br')
  if (hashedCountry) {
    payload.country = [hashedCountry]
  }

  return payload
}

// ============================================================================
// API COMMUNICATION
// ============================================================================

/**
 * Send events to Meta Conversions API
 */
async function sendToMetaAPI(
  events: MetaEventPayload[],
  config?: Partial<MetaCAPIConfig>
): Promise<MetaCAPIResult> {
  try {
    const { pixelId, accessToken, testEventCode, debug } = {
      ...getConfig(),
      ...config,
    }

    const payload: MetaCAPIRequestPayload = {
      data: events,
    }

    // Add test event code if configured (for development/testing)
    if (testEventCode) {
      payload.test_event_code = testEventCode
    }

    const url = `${META_API_BASE_URL}/${META_API_VERSION}/${pixelId}/events?access_token=${accessToken}`

    if (debug) {
      console.log('[Meta CAPI] Sending events:', JSON.stringify(payload, null, 2))
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data: MetaCAPIResponse = await response.json()

    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || `HTTP ${response.status}`
      console.error('[Meta CAPI] Error:', errorMessage, data.error)
      return {
        success: false,
        error: errorMessage,
        fbtraceId: data.fbtrace_id || data.error?.fbtrace_id,
      }
    }

    if (debug) {
      console.log('[Meta CAPI] Success:', {
        eventsReceived: data.events_received,
        fbtraceId: data.fbtrace_id,
      })
    }

    return {
      success: true,
      eventsReceived: data.events_received,
      fbtraceId: data.fbtrace_id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Meta CAPI] Exception:', message)
    return {
      success: false,
      error: message,
    }
  }
}

// ============================================================================
// PUBLIC API - EVENT SENDERS
// ============================================================================

/**
 * Send a Purchase event to Meta CAPI
 *
 * @example
 * await sendPurchaseEvent({
 *   eventId: 'purchase_123_1704067200000',
 *   eventSourceUrl: 'https://www.corretordetextoonline.com.br/premium',
 *   value: 29.90,
 *   currency: 'BRL',
 *   contentId: 'premium_monthly',
 *   contentName: 'Premium Mensal',
 *   userData: {
 *     email: 'user@example.com',
 *     userId: 'user-uuid',
 *     clientIp: '192.168.1.1',
 *     clientUserAgent: 'Mozilla/5.0...',
 *   },
 * })
 */
export async function sendPurchaseEvent(data: MetaPurchaseEventData): Promise<MetaCAPIResult> {
  const eventPayload: MetaEventPayload = {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId || generateEventId('purchase'),
    event_source_url: data.eventSourceUrl,
    action_source: 'website',
    user_data: processUserData(data.userData),
    custom_data: {
      currency: data.currency,
      value: data.value,
      content_ids: [data.contentId],
      content_name: data.contentName,
      content_type: data.contentType || 'product',
      contents: [
        {
          id: data.contentId,
          quantity: 1,
          item_price: data.value,
        },
      ],
      order_id: data.transactionId,
    },
  }

  console.log('[Meta CAPI] Sending Purchase event:', {
    eventId: eventPayload.event_id,
    value: data.value,
    currency: data.currency,
    contentId: data.contentId,
  })

  return sendToMetaAPI([eventPayload])
}

/**
 * Send an InitiateCheckout event to Meta CAPI
 *
 * @example
 * await sendInitiateCheckoutEvent({
 *   eventId: 'checkout_123_1704067200000',
 *   eventSourceUrl: 'https://www.corretordetextoonline.com.br/premium',
 *   value: 29.90,
 *   currency: 'BRL',
 *   contentId: 'premium_monthly',
 *   userData: { ... },
 * })
 */
export async function sendInitiateCheckoutEvent(
  data: MetaCheckoutEventData
): Promise<MetaCAPIResult> {
  const eventPayload: MetaEventPayload = {
    event_name: 'InitiateCheckout',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId || generateEventId('checkout'),
    event_source_url: data.eventSourceUrl,
    action_source: 'website',
    user_data: processUserData(data.userData),
    custom_data: {
      currency: data.currency,
      value: data.value,
      content_ids: [data.contentId],
      content_name: data.contentName,
      content_type: 'product',
      num_items: data.numItems || 1,
    },
  }

  console.log('[Meta CAPI] Sending InitiateCheckout event:', {
    eventId: eventPayload.event_id,
    value: data.value,
    contentId: data.contentId,
  })

  return sendToMetaAPI([eventPayload])
}

/**
 * Send a PageView event to Meta CAPI
 *
 * @example
 * await sendPageViewEvent({
 *   eventId: 'pageview_1704067200000_abc123',
 *   eventSourceUrl: 'https://www.corretordetextoonline.com.br/',
 *   userData: {
 *     clientIp: '192.168.1.1',
 *     clientUserAgent: 'Mozilla/5.0...',
 *     fbc: 'fb.1.1704067200.abc123',
 *     fbp: 'fb.1.1704067200.1234567890',
 *   },
 * })
 */
export async function sendPageViewEvent(data: MetaPageViewEventData): Promise<MetaCAPIResult> {
  const eventPayload: MetaEventPayload = {
    event_name: 'PageView',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId || generateEventId('pageview'),
    event_source_url: data.eventSourceUrl,
    action_source: 'website',
    user_data: processUserData(data.userData),
  }

  // PageView is high-volume, only log in debug mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Meta CAPI] Sending PageView event:', {
      eventId: eventPayload.event_id,
      url: data.eventSourceUrl,
    })
  }

  return sendToMetaAPI([eventPayload])
}

/**
 * Send a custom event to Meta CAPI
 *
 * Use this for custom events like TextCorrected, TextRewritten, etc.
 *
 * @example
 * await sendCustomEvent('TextCorrected', {
 *   eventId: 'textcorrected_1704067200000_abc123',
 *   eventSourceUrl: 'https://www.corretordetextoonline.com.br/',
 *   userData: { ... },
 *   customData: {
 *     text_length: 1500,
 *     correction_score: 85,
 *     mode: 'correct',
 *     is_premium: false,
 *   },
 * })
 */
export async function sendCustomEvent(
  eventName: string,
  data: MetaCustomEventData
): Promise<MetaCAPIResult> {
  const eventPayload: MetaEventPayload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId || generateEventId(eventName.toLowerCase()),
    event_source_url: data.eventSourceUrl,
    action_source: 'website',
    user_data: processUserData(data.userData),
    custom_data: data.customData,
  }

  console.log(`[Meta CAPI] Sending ${eventName} event:`, {
    eventId: eventPayload.event_id,
    customData: data.customData,
  })

  return sendToMetaAPI([eventPayload])
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { generateEventId } from './hash-utils'
export type {
  MetaUserData,
  MetaPurchaseEventData,
  MetaCheckoutEventData,
  MetaPageViewEventData,
  MetaCustomEventData,
  MetaCAPIResult,
} from './types'
