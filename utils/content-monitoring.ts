/**
 * Utility for monitoring content publishing delays
 */

// Store the last fetch times and results
interface FetchRecord {
  timestamp: number
  url: string
  success: boolean
  responseTime: number
  cacheHit: boolean
}

// Keep a record of the last 100 fetches
const fetchRecords: FetchRecord[] = []
const MAX_RECORDS = 100

/**
 * Record a fetch operation for monitoring
 */
export function recordFetch(url: string, success: boolean, responseTime: number, cacheHit: boolean) {
  const record: FetchRecord = {
    timestamp: Date.now(),
    url,
    success,
    responseTime,
    cacheHit,
  }

  // Add to the beginning of the array
  fetchRecords.unshift(record)

  // Keep only the last MAX_RECORDS
  if (fetchRecords.length > MAX_RECORDS) {
    fetchRecords.pop()
  }

  // Log the record for debugging
  console.log(
    `Content fetch: ${url} - ${success ? "Success" : "Failed"} - ${responseTime}ms - ${cacheHit ? "Cache hit" : "Cache miss"}`,
  )
}

/**
 * Get statistics about recent content fetches
 */
export function getContentFetchStats() {
  if (fetchRecords.length === 0) {
    return {
      totalFetches: 0,
      successRate: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastFetchTime: null,
    }
  }

  const totalFetches = fetchRecords.length
  const successfulFetches = fetchRecords.filter((r) => r.success).length
  const cacheHits = fetchRecords.filter((r) => r.cacheHit).length
  const totalResponseTime = fetchRecords.reduce((sum, r) => sum + r.responseTime, 0)

  return {
    totalFetches,
    successRate: (successfulFetches / totalFetches) * 100,
    averageResponseTime: totalResponseTime / totalFetches,
    cacheHitRate: (cacheHits / totalFetches) * 100,
    lastFetchTime: fetchRecords[0]?.timestamp || null,
  }
}

/**
 * Monitor a specific post for updates
 * @param slug Post slug to monitor
 * @param checkInterval Interval in milliseconds to check for updates
 * @param callback Function to call when the post is updated
 */
export function monitorPostForUpdates(slug: string, checkInterval = 60000, callback: (updated: boolean) => void) {
  let lastModified: string | null = null

  const checkForUpdates = async () => {
    try {
      const response = await fetch(`https://blog.corretordetextoonline.com.br/wp-json/wp/v2/posts?slug=${slug}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        console.error(`Failed to check for updates on post ${slug}: ${response.status}`)
        return
      }

      const posts = await response.json()
      if (posts.length === 0) {
        console.log(`No post found with slug: ${slug}`)
        return
      }

      const currentModified = posts[0].modified

      if (lastModified && currentModified !== lastModified) {
        console.log(`Post ${slug} has been updated. Previous: ${lastModified}, Current: ${currentModified}`)
        callback(true)
      } else if (!lastModified) {
        console.log(`Started monitoring post ${slug}. Last modified: ${currentModified}`)
      }

      lastModified = currentModified
    } catch (error) {
      console.error(`Error checking for updates on post ${slug}:`, error)
    }
  }

  // Initial check
  checkForUpdates()

  // Set up interval for subsequent checks
  const intervalId = setInterval(checkForUpdates, checkInterval)

  // Return function to stop monitoring
  return () => {
    clearInterval(intervalId)
    console.log(`Stopped monitoring post ${slug}`)
  }
}
