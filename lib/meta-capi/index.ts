/**
 * Meta Conversions API (CAPI) Module
 *
 * Server-side tracking for Meta/Facebook events
 *
 * @example
 * import {
 *   sendPurchaseEvent,
 *   sendInitiateCheckoutEvent,
 *   sendPageViewEvent,
 *   sendCustomEvent,
 *   generateEventId,
 * } from '@/lib/meta-capi'
 */

// Main client functions
export {
  sendPurchaseEvent,
  sendInitiateCheckoutEvent,
  sendPageViewEvent,
  sendCustomEvent,
  generateEventId,
} from './client'

// Hash utilities (for advanced use cases)
export {
  hashForMeta,
  hashEmail,
  hashPhone,
  hashName,
  hashExternalId,
  hashGeo,
  splitFullName,
  wrapInArray,
} from './hash-utils'

// Types
export type {
  MetaUserData,
  MetaPurchaseEventData,
  MetaCheckoutEventData,
  MetaPageViewEventData,
  MetaCustomEventData,
  MetaCAPIResult,
  MetaCAPIConfig,
  MetaStandardEvent,
  MetaCustomEvent,
  MetaEventName,
} from './types'
