/**
 * Enhanced fetch utility with retry logic and timeout
 * Implements best practices from frontend-fix.md
 */

interface FetchRetryOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  retryCondition?: (error: Error, response?: Response) => boolean
}

/**
 * Default retry condition - retry on network errors and server errors
 */
const defaultRetryCondition = (error: Error, response?: Response): boolean => {
  // Retry on network errors
  if (error.name === 'TypeError' || error.name === 'AbortError') {
    return true
  }
  
  // Retry on server errors (5xx) but not client errors (4xx)
  if (response && response.status >= 500) {
    return true
  }
  
  // Don't retry on authentication errors or client errors
  return false
}

/**
 * Fetch with retry logic and exponential backoff
 */
export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retryOptions: FetchRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    retryCondition = defaultRetryCondition
  } = retryOptions

  let lastError: Error | null = null
  let lastResponse: Response | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // If response is ok, return it
        if (response.ok) {
          return response
        }

        // If response is not ok, check if we should retry
        const mockError = new Error(`HTTP ${response.status}: ${response.statusText}`)
        if (attempt < maxRetries && retryCondition(mockError, response)) {
          console.warn(`Fetch attempt ${attempt} failed with status ${response.status}, retrying in ${retryDelay * attempt}ms`)
          lastResponse = response
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
          continue
        }

        // If we shouldn't retry or this is the last attempt, return the response
        return response

      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }

    } catch (error) {
      lastError = error as Error
      
      // Check if we should retry
      if (attempt < maxRetries && retryCondition(lastError)) {
        const delay = retryDelay * attempt
        console.warn(`Fetch attempt ${attempt} failed: ${lastError.message}, retrying in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // If we shouldn't retry or this is the last attempt, throw the error
      throw lastError
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error('Unknown fetch error')
}

/**
 * Simplified fetch with timeout (backward compatibility)
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeout: number
): Promise<Response> {
  return fetchWithRetry(url, options, { 
    maxRetries: 1, 
    timeout 
  })
}
