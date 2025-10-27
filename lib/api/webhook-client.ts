import { fetchWithRetry } from "@/utils/fetch-retry"
import { FETCH_TIMEOUT, PREMIUM_FETCH_TIMEOUT, AUTH_TOKEN, AI_DETECTOR_TIMEOUT } from "@/utils/constants"

interface WebhookOptions {
  url: string
  fallbackUrl?: string
  text: string
  requestId: string
  additionalData?: Record<string, any>
  timeout?: number // Optional custom timeout for specific webhooks
}

interface WebhookHeaders {
  "Content-Type": string
  "X-Request-ID": string
  [key: string]: string
}

/**
 * Prepares headers for webhook request
 * Note: Connection/Keep-Alive headers are managed automatically by Node.js fetch
 */
function prepareHeaders(requestId: string): WebhookHeaders {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "X-Request-ID": requestId,
  }
}

/**
 * Makes a request to the webhook with retry and fallback support
 */
export async function callWebhook(options: WebhookOptions): Promise<Response> {
  const { url, fallbackUrl, text, requestId, additionalData = {}, timeout } = options
  const headers = prepareHeaders(requestId)
  const webhookUrl = url

  const requestBody = {
    text,
    ...additionalData,
    ...(AUTH_TOKEN && { authToken: AUTH_TOKEN }),
  }

  console.log(`API: Sending request to webhook: ${webhookUrl}`, requestId)

  try {
    // Determine timeout: use provided timeout, or auto-detect based on endpoint type
    let effectiveTimeout = timeout || FETCH_TIMEOUT
    if (!timeout) {
      if (url.includes("analysis-ai")) {
        effectiveTimeout = AI_DETECTOR_TIMEOUT
        console.log(`API: Using extended timeout for AI detector: ${effectiveTimeout}ms`, requestId)
      } else if (url.includes("premium-corrigir") || url.includes("premium-reescrever")) {
        effectiveTimeout = PREMIUM_FETCH_TIMEOUT
        console.log(`API: Using extended timeout for premium endpoint: ${effectiveTimeout}ms`, requestId)
      }
    }

    const response = await fetchWithRetry(
      webhookUrl,
      {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      },
      {
        maxRetries: 3,
        timeout: effectiveTimeout,
        retryDelay: 2000,
      }
    )

    console.log(`API: Received response from webhook with status ${response.status}`, requestId)

    // If 401, try fallback immediately
    if (!response.ok && response.status === 401 && fallbackUrl) {
      console.log("API: Status 401 detected, trying fallback automatically", requestId)
      return callFallbackWebhook(fallbackUrl, text, requestId)
    }

    return response
  } catch (webhookError) {
    const we = webhookError as Error
    console.error(`API: Error accessing webhook: ${we.message}`, requestId)

    if (fallbackUrl) {
      console.log("API: Trying fallback webhook", requestId)
      return callFallbackWebhook(fallbackUrl, text, requestId)
    }

    throw webhookError
  }
}

/**
 * Makes a request to the fallback webhook
 */
async function callFallbackWebhook(fallbackUrl: string, text: string, requestId: string): Promise<Response> {
  console.log(`API: Using fallback webhook: ${fallbackUrl}`, requestId)

  // Determine timeout for fallback based on endpoint type
  let effectiveTimeout = FETCH_TIMEOUT
  if (fallbackUrl.includes("analysis-ai")) {
    effectiveTimeout = AI_DETECTOR_TIMEOUT
    console.log(`API: Using extended timeout for fallback AI detector: ${effectiveTimeout}ms`, requestId)
  } else if (fallbackUrl.includes("premium-corrigir") || fallbackUrl.includes("premium-reescrever")) {
    effectiveTimeout = PREMIUM_FETCH_TIMEOUT
    console.log(`API: Using extended timeout for fallback premium endpoint: ${effectiveTimeout}ms`, requestId)
  }

  const response = await fetchWithRetry(
    fallbackUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Request-ID": requestId,
      },
      body: JSON.stringify({
        text,
        source: "fallback",
      }),
    },
    {
      maxRetries: 2,
      timeout: effectiveTimeout,
      retryDelay: 1000,
    }
  )

  console.log(`API: Received response from fallback webhook with status ${response.status}`, requestId)
  return response
}
