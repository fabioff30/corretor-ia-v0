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
      `${JULINHO_API_URL}/api/webhook/subscription/${normalizedPhone}/activate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({ days }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Julinho] Activation failed:', {
        status: response.status,
        error: errorText,
        phone: `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-4)}`
      })

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()

    console.log('[Julinho] Activation successful:', {
      phone: `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-4)}`,
      days,
      end_date: data.data?.subscription_end_date
    })

    return {
      success: true,
      data: data.data
    }
  } catch (error) {
    console.error('[Julinho] Network error:', error)

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
