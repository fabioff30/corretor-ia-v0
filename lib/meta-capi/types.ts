/**
 * Meta Conversions API (CAPI) Type Definitions
 *
 * Implements server-side tracking for Meta/Facebook events
 * Complements client-side Meta Pixel for better attribution
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api
 */

// ============================================================================
// USER DATA TYPES
// ============================================================================

/**
 * User data for event matching
 * Some fields require SHA256 hashing (handled by hash-utils.ts)
 */
export interface MetaUserData {
  // Contact Information (must be SHA256 hashed)
  email?: string
  phone?: string
  firstName?: string
  lastName?: string

  // External Identifier (must be SHA256 hashed)
  userId?: string

  // Browser/Client Information (NOT hashed)
  clientIp?: string
  clientUserAgent?: string

  // Meta Click/Browser IDs (NOT hashed)
  fbc?: string | null // Click ID from _fbc cookie
  fbp?: string | null // Browser ID from _fbp cookie

  // Geographic Data (must be SHA256 hashed if provided)
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

/**
 * Normalized user data ready to send to Meta API
 * All PII fields are already hashed
 */
export interface MetaUserDataPayload {
  client_ip_address?: string
  client_user_agent?: string
  fbc?: string
  fbp?: string
  em?: string[] // hashed email(s)
  ph?: string[] // hashed phone(s)
  fn?: string[] // hashed first name(s)
  ln?: string[] // hashed last name(s)
  external_id?: string[] // hashed user ID(s)
  ct?: string[] // hashed city
  st?: string[] // hashed state
  zp?: string[] // hashed zip code
  country?: string[] // hashed country
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Standard Meta events
 */
export type MetaStandardEvent =
  | 'AddPaymentInfo'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'InitiateCheckout'
  | 'Lead'
  | 'PageView'
  | 'Purchase'
  | 'Schedule'
  | 'Search'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'
  | 'ViewContent'

/**
 * Custom events specific to CorretorIA
 */
export type MetaCustomEvent =
  | 'TextCorrected'
  | 'TextRewritten'
  | 'AIDetectionUsed'

/**
 * All supported event types
 */
export type MetaEventName = MetaStandardEvent | MetaCustomEvent

// ============================================================================
// EVENT DATA TYPES
// ============================================================================

/**
 * Base event data required for all events
 */
export interface MetaBaseEventData {
  eventId: string
  eventSourceUrl: string
  userData: MetaUserData
  referrer?: string
}

/**
 * Purchase event data
 */
export interface MetaPurchaseEventData extends MetaBaseEventData {
  value: number
  currency: string
  contentId: string
  contentName: string
  contentType?: 'product' | 'subscription'
  transactionId?: string
}

/**
 * InitiateCheckout event data
 */
export interface MetaCheckoutEventData extends MetaBaseEventData {
  value: number
  currency: string
  contentId: string
  contentName?: string
  numItems?: number
}

/**
 * PageView event data
 */
export interface MetaPageViewEventData extends MetaBaseEventData {
  // PageView has minimal required fields
}

/**
 * Custom event data (TextCorrected, TextRewritten, etc.)
 */
export interface MetaCustomEventData extends MetaBaseEventData {
  customData?: Record<string, unknown>
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Custom data payload for commerce events
 */
export interface MetaCustomDataPayload {
  currency?: string
  value?: number
  content_ids?: string[]
  content_name?: string
  content_type?: string
  contents?: Array<{
    id: string
    quantity: number
    item_price?: number
  }>
  num_items?: number
  order_id?: string
  // Custom properties for TextCorrected/TextRewritten
  [key: string]: unknown
}

/**
 * Single event payload for Meta API
 */
export interface MetaEventPayload {
  event_name: string
  event_time: number
  event_id: string
  event_source_url: string
  action_source: 'website'
  user_data: MetaUserDataPayload
  custom_data?: MetaCustomDataPayload
  opt_out?: boolean
}

/**
 * Full request payload for Meta CAPI
 */
export interface MetaCAPIRequestPayload {
  data: MetaEventPayload[]
  test_event_code?: string
}

/**
 * Response from Meta CAPI
 */
export interface MetaCAPIResponse {
  events_received?: number
  messages?: string[]
  fbtrace_id?: string
  error?: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Meta CAPI client configuration
 */
export interface MetaCAPIConfig {
  pixelId: string
  accessToken: string
  testEventCode?: string
  debug?: boolean
}

/**
 * Result of sending an event
 */
export interface MetaCAPIResult {
  success: boolean
  eventsReceived?: number
  error?: string
  fbtraceId?: string
  skipped?: boolean // Indica skip por config inválida ou erro de rede
}
