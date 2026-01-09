import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, isRedisAvailable } from "@/utils/redis-client"

export const dynamic = "force-dynamic"

/**
 * Admin endpoint to clear guest daily rate limit keys from Redis
 * This allows resetting rate limits when needed (e.g., after changing limit values)
 *
 * POST /api/admin/clear-rate-limits
 * Authorization: Bearer ${ADMIN_API_KEY}
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authHeader = request.headers.get("authorization")
  const adminKey = process.env.ADMIN_API_KEY

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing admin API key" },
      { status: 401 }
    )
  }

  // Check Redis availability
  if (!isRedisAvailable()) {
    return NextResponse.json(
      { error: "Service unavailable", message: "Redis is not available" },
      { status: 503 }
    )
  }

  const redis = getRedisClient()
  if (!redis) {
    return NextResponse.json(
      { error: "Service unavailable", message: "Redis client not initialized" },
      { status: 503 }
    )
  }

  try {
    // Get today's date in UTC (YYYY-MM-DD format)
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const today = `${year}-${month}-${day}`

    // Pattern to match all guest daily rate limit keys for today
    const pattern = `guest-daily:*:${today}`

    let deletedCount = 0
    const deletedKeys: string[] = []

    // Use SCAN to find and delete keys matching the pattern
    let scanCursor: string | number = 0
    let shouldContinue = true

    while (shouldContinue) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await redis.scan(scanCursor, { match: pattern, count: 100 })
      const nextCursor = result[0]
      const keys = result[1] as string[]

      if (keys.length > 0) {
        await redis.del(...keys)
        deletedCount += keys.length
        deletedKeys.push(...keys)
      }

      scanCursor = nextCursor
      shouldContinue = nextCursor !== 0 && nextCursor !== "0"
    }

    console.log(`[Admin] Cleared ${deletedCount} rate limit keys for ${today}`)

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} rate limit keys for ${today}`,
      deletedCount,
      deletedKeys,
      date: today,
    })
  } catch (error) {
    console.error("[Admin] Error clearing rate limits:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "OK",
    endpoint: "/api/admin/clear-rate-limits",
    method: "POST",
    description: "Clear guest daily rate limit keys from Redis"
  })
}
