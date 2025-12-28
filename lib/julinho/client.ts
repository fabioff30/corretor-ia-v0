/**
 * Julinho API Client
 *
 * Client for integrating with Julinho's subscription API.
 * Used to activate premium subscriptions for WhatsApp users
 * as part of the CorretorIA + Julinho bundle.
 */

const JULINHO_API_URL = process.env.JULINHO_API_URL || 'https://julinho-ia-julinho-ia-waba.3j5ljv.easypanel.host'
const JULINHO_DASHBOARD_SECRET = process.env.JULINHO_DASHBOARD_SECRET

interface JulinhoActivationResult {
  success: boolean
  error?: string
  data?: {
    phone: string
    subscription_end_date: string
    days: number
  }
}

interface JulinhoSubscriptionStatus {
  found: boolean
  phone: string
  name?: string
  email?: string
  subscription: {
    status: 'free' | 'active' | 'expired'
    end_date?: string
    is_active: boolean
    days_remaining?: number
  }
  free_tier: {
    messages_used: number
    messages_limit: number
    messages_remaining: number
  }
}

/**
 * Normalizes a Brazilian phone number to the format expected by Julinho API.
 * Removes all non-digit characters and ensures it starts with country code 55.
 *
 * @param phone - Phone number in any format
 * @returns Normalized phone number (e.g., "5585999999999")
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '')

  // Add country code if not present
  if (!digits.startsWith('55')) {
    digits = '55' + digits
  }

  return digits
}

/**
 * Validates a Brazilian WhatsApp phone number.
 *
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function validateWhatsAppPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')

  // Brazilian phone: 55 (country) + 2 digits DDD + 8-9 digits number
  // Total: 12-13 digits
  if (digits.length < 12 || digits.length > 13) {
    return false
  }

  // Must start with 55 (Brazil)
  if (!digits.startsWith('55')) {
    return false
  }

  // DDD must be valid (11-99)
  const ddd = parseInt(digits.substring(2, 4), 10)
  if (ddd < 11 || ddd > 99) {
    return false
  }

  return true
}

/**
 * Activates a Julinho premium subscription for a WhatsApp user.
 *
 * @param phone - WhatsApp phone number (will be normalized)
 * @param days - Number of days to activate (default: 30)
 * @returns Activation result with success status
 */
export async function activateJulinhoSubscription(
  phone: string,
  days: number = 30
): Promise<JulinhoActivationResult> {
  const startTime = Date.now()

  console.log('[Julinho] ========== ACTIVATION START ==========')
  console.log('[Julinho] activateJulinhoSubscription called:', {
    phone: phone ? `${phone.slice(0, 4)}****` : 'undefined',
    days,
    hasSecret: !!JULINHO_DASHBOARD_SECRET,
    secretLength: JULINHO_DASHBOARD_SECRET?.length || 0,
    apiUrl: JULINHO_API_URL
  })

  if (!JULINHO_DASHBOARD_SECRET) {
    console.error('[Julinho] ❌ JULINHO_DASHBOARD_SECRET not configured in environment')
    return {
      success: false,
      error: 'Julinho integration not configured'
    }
  }

  const normalizedPhone = normalizePhoneNumber(phone)

  console.log('[Julinho] Phone normalized:', {
    original: phone ? `${phone.slice(0, 4)}****` : 'undefined',
    normalized: normalizedPhone ? `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-4)}` : 'undefined',
    length: normalizedPhone?.length
  })

  if (!validateWhatsAppPhone(normalizedPhone)) {
    console.error('[Julinho] ❌ Invalid phone number validation failed:', {
      phone: normalizedPhone ? `${normalizedPhone.slice(0, 4)}****` : 'undefined',
      length: normalizedPhone?.length
    })
    return {
      success: false,
      error: `Invalid phone number: ${phone}`
    }
  }

  try {
    const credentials = Buffer.from(`admin:${JULINHO_DASHBOARD_SECRET}`).toString('base64')
    const url = `${JULINHO_API_URL}/api/webhook/subscription/${normalizedPhone}/activate`

    console.log('[Julinho] Making HTTP POST request:', {
      url: url.replace(normalizedPhone, `${normalizedPhone.slice(0, 4)}****`),
      method: 'POST',
      hasAuth: true,
      body: { days, source: 'corretoria-bundle' }
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({ days, source: 'corretoria-bundle' }),
    })

    console.log('[Julinho] HTTP response received:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      duration_ms: Date.now() - startTime
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Julinho] ❌ Activation failed:', {
        status: response.status,
        error: errorText,
        phone: `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-4)}`,
        duration_ms: Date.now() - startTime
      })

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()

    console.log('[Julinho] ✅ Activation successful:', {
      phone: `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-4)}`,
      days,
      end_date: data.data?.subscription_end_date,
      verified_status: data.data?.verified?.status,
      duration_ms: Date.now() - startTime
    })
    console.log('[Julinho] ========== ACTIVATION END ==========')

    return {
      success: true,
      data: data.data
    }
  } catch (error) {
    console.error('[Julinho] ❌ Network/fetch error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join(' | ') : undefined,
      phone: `${normalizedPhone.slice(0, 4)}****`,
      duration_ms: Date.now() - startTime
    })
    console.log('[Julinho] ========== ACTIVATION END (ERROR) ==========')

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Gets the subscription status for a WhatsApp user.
 *
 * @param phone - WhatsApp phone number
 * @returns Subscription status or null if not found
 */
export async function getJulinhoSubscriptionStatus(
  phone: string
): Promise<JulinhoSubscriptionStatus | null> {
  if (!JULINHO_DASHBOARD_SECRET) {
    console.error('[Julinho] JULINHO_DASHBOARD_SECRET not configured')
    return null
  }

  const normalizedPhone = normalizePhoneNumber(phone)

  try {
    const credentials = Buffer.from(`admin:${JULINHO_DASHBOARD_SECRET}`).toString('base64')

    const response = await fetch(
      `${JULINHO_API_URL}/api/webhook/subscription/${normalizedPhone}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      console.error('[Julinho] Status check failed:', response.status)
      return null
    }

    const data = await response.json()
    return data.data as JulinhoSubscriptionStatus
  } catch (error) {
    console.error('[Julinho] Error checking status:', error)
    return null
  }
}

/**
 * Sends a WhatsApp template message to a user via Julinho API.
 *
 * @param phone - WhatsApp phone number
 * @param templateName - Name of the template to send (e.g., "pagamento_aprovado")
 * @returns Result with success status
 */
export async function sendJulinhoTemplateMessage(
  phone: string,
  templateName: string
): Promise<{ success: boolean; error?: string }> {
  if (!JULINHO_DASHBOARD_SECRET) {
    console.error('[Julinho] JULINHO_DASHBOARD_SECRET not configured')
    return {
      success: false,
      error: 'Julinho integration not configured'
    }
  }

  const normalizedPhone = normalizePhoneNumber(phone)

  if (!validateWhatsAppPhone(normalizedPhone)) {
    return {
      success: false,
      error: `Invalid phone number: ${phone}`
    }
  }

  try {
    const credentials = Buffer.from(`admin:${JULINHO_DASHBOARD_SECRET}`).toString('base64')

    const response = await fetch(
      `${JULINHO_API_URL}/api/webhook/send-template`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          templateName: templateName, // Cloud API uses 'templateName' not 'template'
          language: 'pt_BR',
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Julinho] Template message failed:', {
        status: response.status,
        error: errorText,
        phone: `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-4)}`,
        template: templateName
      })

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    console.log('[Julinho] Template message sent:', {
      phone: `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-4)}`,
      template: templateName
    })

    return { success: true }
  } catch (error) {
    console.error('[Julinho] Template message error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Retries failed Julinho activations.
 * Used for manual retry of failed bundle activations.
 *
 * @param phone - WhatsApp phone number
 * @param days - Number of days to activate
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Final activation result
 */
export async function retryJulinhoActivation(
  phone: string,
  days: number = 30,
  maxRetries: number = 3
): Promise<JulinhoActivationResult> {
  let lastError: string | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Julinho] Retry attempt ${attempt}/${maxRetries} for phone: ${phone.slice(0, 4)}****`)

    const result = await activateJulinhoSubscription(phone, days)

    if (result.success) {
      return result
    }

    lastError = result.error

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`
  }
}

// ============================================
// BROADCAST CAMPAIGN FUNCTIONS
// ============================================

interface BroadcastFilters {
  engagement?: 'high' | 'medium' | 'low' | 'all'
  subscriptionStatus?: 'active' | 'expired' | 'free' | 'all'
  minMessages?: number
  state?: string
}

interface BroadcastPreviewResult {
  success: boolean
  error?: string
  data?: {
    totalRecipients: number
    breakdown: {
      highEngagement: number
      mediumEngagement: number
      lowEngagement: number
      activeSubscribers: number
    }
    estimatedTime: string
  }
}

interface BroadcastResult {
  success: boolean
  error?: string
  message?: string
  config?: {
    messageLength: number
    filters: BroadcastFilters
    delayBetweenMessages: string
    testMode: boolean
  }
}

/**
 * Gets a preview of how many contacts would receive a broadcast.
 *
 * @param filters - Filters to apply to the contact list
 * @returns Preview with contact counts and estimated time
 */
export async function getJulinhoBroadcastPreview(
  filters: BroadcastFilters = {}
): Promise<BroadcastPreviewResult> {
  if (!JULINHO_DASHBOARD_SECRET) {
    return {
      success: false,
      error: 'Julinho integration not configured'
    }
  }

  try {
    const credentials = Buffer.from(`admin:${JULINHO_DASHBOARD_SECRET}`).toString('base64')

    const response = await fetch(
      `${JULINHO_API_URL}/api/webhook/broadcast-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({ filters }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Julinho] Broadcast preview failed:', {
        status: response.status,
        error: errorText
      })

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()

    return {
      success: true,
      data: data.data
    }
  } catch (error) {
    console.error('[Julinho] Broadcast preview error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Sends a custom broadcast message to Julinho contacts.
 *
 * @param message - Message to send (supports {nome} and {phone} placeholders)
 * @param filters - Filters to apply to the contact list
 * @param delaySeconds - Delay between messages (default: 5)
 * @param testMode - If true, only sends to first 3 contacts (default: false)
 * @returns Result of the broadcast request
 */
export async function sendJulinhoBroadcast(
  message: string,
  filters: BroadcastFilters = {},
  delaySeconds: number = 5,
  testMode: boolean = false
): Promise<BroadcastResult> {
  if (!JULINHO_DASHBOARD_SECRET) {
    return {
      success: false,
      error: 'Julinho integration not configured'
    }
  }

  if (!message || message.trim().length === 0) {
    return {
      success: false,
      error: 'Message content is required'
    }
  }

  try {
    const credentials = Buffer.from(`admin:${JULINHO_DASHBOARD_SECRET}`).toString('base64')

    console.log('[Julinho] Starting broadcast:', {
      messageLength: message.length,
      filters,
      delaySeconds,
      testMode
    })

    const response = await fetch(
      `${JULINHO_API_URL}/api/webhook/send-custom-broadcast`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          message,
          filters,
          delaySeconds,
          testMode
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Julinho] Broadcast failed:', {
        status: response.status,
        error: errorText
      })

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()

    console.log('[Julinho] Broadcast started:', data)

    return {
      success: true,
      message: data.message,
      config: data.config
    }
  } catch (error) {
    console.error('[Julinho] Broadcast error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Sends a WhatsApp template message via Julinho.
 * Uses Meta-approved templates for transactional messages.
 *
 * @param phone - WhatsApp phone number
 * @param templateName - Name of the approved template
 * @param language - Language code (default: pt_BR)
 * @param parameters - Template parameters
 * @returns Result of the template send
 */
export async function sendJulinhoTemplate(
  phone: string,
  templateName: string,
  language: string = 'pt_BR',
  parameters: string[] = []
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!JULINHO_DASHBOARD_SECRET) {
    return {
      success: false,
      error: 'Julinho integration not configured'
    }
  }

  const normalizedPhone = normalizePhoneNumber(phone)

  try {
    const credentials = Buffer.from(`admin:${JULINHO_DASHBOARD_SECRET}`).toString('base64')

    const response = await fetch(
      `${JULINHO_API_URL}/api/webhook/send-template`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          templateName: templateName,
          language: language,
          parameters: parameters
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Julinho] Template send failed:', {
        status: response.status,
        error: errorText,
        phone: `${normalizedPhone.slice(0, 4)}****`,
        template: templateName
      })

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()

    console.log('[Julinho] Template sent:', {
      phone: `${normalizedPhone.slice(0, 4)}****`,
      template: templateName,
      messageId: data.data?.messageId
    })

    return {
      success: true,
      messageId: data.data?.messageId
    }
  } catch (error) {
    console.error('[Julinho] Template error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Gets list of available WhatsApp templates from Julinho.
 *
 * @returns List of approved templates
 */
export async function getJulinhoTemplates(): Promise<{
  success: boolean
  error?: string
  templates?: Array<{ name: string; status: string; language: string }>
}> {
  if (!JULINHO_DASHBOARD_SECRET) {
    return {
      success: false,
      error: 'Julinho integration not configured'
    }
  }

  try {
    const credentials = Buffer.from(`admin:${JULINHO_DASHBOARD_SECRET}`).toString('base64')

    const response = await fetch(
      `${JULINHO_API_URL}/api/webhook/templates`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()

    return {
      success: true,
      templates: data.data?.templates || []
    }
  } catch (error) {
    console.error('[Julinho] Templates fetch error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}
