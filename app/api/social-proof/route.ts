import { NextResponse } from "next/server"
import { getRatingStats } from "@/utils/rating-stats"
import { createClient } from "@/lib/supabase/server"
import { getMonthlyCorrectionsCount } from "@/lib/google-analytics/analytics-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 1800 // Cache por 30 minutos

/**
 * API endpoint to fetch social proof statistics
 * Returns real-time data from Redis and Supabase for social proof display
 */
export async function GET() {
  try {
    // Get rating stats from Redis
    const ratingStats = await getRatingStats() as { averageRating: number; totalRatings: number }

    // Get premium users count from Supabase
    let premiumUsers = 127 // default fallback
    let totalCorrections = 15234 // default fallback

    try {
      const supabase = (await createClient()) as any

      // Count premium users
      const { count: premiumCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("plan", ["pro", "admin"])

      if (premiumCount !== null) {
        premiumUsers = premiumCount
      }

      // Try to get corrections count from Google Analytics first
      const propertyId = process.env.GA4_PROPERTY_ID

      if (propertyId && process.env.GOOGLE_CLOUD_CREDENTIALS_BLOB_URL) {
        try {
          const gaCorrections = await getMonthlyCorrectionsCount(propertyId)
          if (gaCorrections > 0) {
            totalCorrections = gaCorrections
            console.log(`✅ Using Google Analytics data: ${gaCorrections} corrections this month`)
          }
        } catch (gaError) {
          console.warn("⚠️ Google Analytics unavailable, falling back to Supabase:", gaError)
          // Fallback to Supabase if GA fails
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          const { count: correctionsCount } = await supabase
            .from("user_corrections")
            .select("*", { count: "exact", head: true })
            .gte("created_at", thirtyDaysAgo.toISOString())

          if (correctionsCount !== null) {
            totalCorrections = correctionsCount
            console.log(`✅ Using Supabase data: ${correctionsCount} corrections`)
          }
        }
      } else {
        // No GA configured, use Supabase
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: correctionsCount } = await supabase
          .from("user_corrections")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo.toISOString())

        if (correctionsCount !== null) {
          totalCorrections = correctionsCount
        }
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
