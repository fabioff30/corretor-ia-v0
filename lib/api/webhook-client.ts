import { fetchWithRetry } from "@/utils/fetch-retry"
import { FETCH_TIMEOUT, AUTH_TOKEN } from "@/utils/constants"

const VERCEL_BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

interface WebhookOptions {
  url: string
  fallbackUrl?: string
  text: string
  requestId: string
  additionalData?: Record<string, any>
}

interface WebhookHeaders {
  "Content-Type": string
  "X-Request-ID": string
  [key: string]: string
}

/**
 * Prepares headers for webhook request with optional bypass token
 */
function prepareHeaders(requestId: string): WebhookHeaders {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "X-Request-ID": requestId,
  }
}

/**
 * Adds Vercel bypass token to URL and headers if available
 */
function addBypassToken(url: string, headers: WebhookHeaders): string {
  if (!VERCEL_BYPASS_TOKEN || url.includes('localhost')) {
    return url
  }

  const urlObj = new URL(url)
  urlObj.searchParams.set('x-vercel-set-bypass-cookie', 'true')
  urlObj.searchParams.set('x-vercel-protection-bypass', VERCEL_BYPASS_TOKEN)

  headers['x-vercel-protection-bypass'] = VERCEL_BYPASS_TOKEN
  headers['x-vercel-set-bypass-cookie'] = 'true'

  return urlObj.toString()
}

/**
 * Makes a request to the webhook with retry and fallback support
 */
export async function callWebhook(options: WebhookOptions): Promise<Response> {
  const { url, fallbackUrl, text, requestId, additionalData = {} } = options
  const headers = prepareHeaders(requestId)
  let webhookUrl = addBypassToken(url, headers)

  const requestBody = {
    text,
    ...additionalData,
    ...(AUTH_TOKEN && { authToken: AUTH_TOKEN }),
  }

  console.log(`API: Sending request to webhook: ${webhookUrl}`, requestId)

  try {
    const response = await fetchWithRetry(
      webhookUrl,
      {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      },
      {
        maxRetries: 3,
        timeout: FETCH_TIMEOUT,
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
      timeout: FETCH_TIMEOUT,
      retryDelay: 1000,
    }
  )

  console.log(`API: Received response from fallback webhook with status ${response.status}`, requestId)
  return response
}
