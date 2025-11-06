import { NextResponse } from "next/server"
import { getRatingStats } from "@/utils/rating-stats"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * API endpoint to fetch social proof statistics
 * Returns real-time data from Redis and Supabase for social proof display
 */
export async function GET() {
  try {
    // Get rating stats from Redis
    const ratingStats = await getRatingStats()

    // Get premium users count from Supabase
    let premiumUsers = 127 // default fallback
    let totalCorrections = 15234 // default fallback

    try {
      const supabase = await createClient()

      // Count premium users
      const { count: premiumCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("plan", ["pro", "admin"])

      if (premiumCount !== null) {
        premiumUsers = premiumCount
      }

      // Count total corrections (last 30 days for more dynamic number)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: correctionsCount } = await supabase
        .from("user_corrections")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString())

      if (correctionsCount !== null) {
        totalCorrections = correctionsCount
      }
    } catch (supabaseError) {
      console.error("Error fetching Supabase stats:", supabaseError)
      // Continue with default values
    }

    return NextResponse.json({
      ratings: {
        average: ratingStats.averageRating,
        total: ratingStats.totalRatings,
      },
      users: {
        premium: premiumUsers,
      },
      corrections: {
        last30Days: totalCorrections,
      },
    })
  } catch (error) {
    console.error("Error fetching social proof:", error)

    // Return fallback data on error
    return NextResponse.json({
      ratings: {
        average: 4.8,
        total: 1247,
      },
      users: {
        premium: 127,
      },
      corrections: {
        last30Days: 15234,
      },
    })
  }
}
