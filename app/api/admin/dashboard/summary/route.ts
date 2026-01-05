// @ts-nocheck
/**
 * API Route: Admin Dashboard Summary
 * GET /api/admin/dashboard/summary
 *
 * Returns aggregated metrics for the admin dashboard
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"

export const maxDuration = 60

type PlanLimitSummary = {
  max_characters: number
  corrections_per_day: number
  rewrites_per_day: number
  ai_analyses_per_day: number
  show_ads: boolean
  updated_at: string
}

export async function GET(_request: NextRequest) {
  try {
    const { user, profile } = await getCurrentUserWithProfile()

    if (!user || !profile || profile.plan_type !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    const now = new Date()
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const endOfToday = new Date(startOfToday)
    endOfToday.setUTCDate(endOfToday.getUTCDate() + 1)

    const startOfRange = new Date(startOfToday)
    startOfRange.setUTCDate(startOfRange.getUTCDate() - 6)

    const [
      totalUsersRes,
      freeUsersRes,
      proUsersRes,
      adminUsersRes,
      activePremiumRes,
      correctionsTodayRes,
      rewritesTodayRes,
      analysesTodayRes,
      planLimitsRes,
      operationsLast7DaysRes,
      recentPremiumUsersRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("plan_type", "free"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("plan_type", "pro"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("plan_type", "admin"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan_type", "pro")
        .eq("subscription_status", "active"),
      supabase
        .from("user_corrections")
        .select("id", { count: "exact", head: true })
        .eq("operation_type", "correct")
        .gte("created_at", startOfToday.toISOString())
        .lt("created_at", endOfToday.toISOString()),
      supabase
        .from("user_corrections")
        .select("id", { count: "exact", head: true })
        .eq("operation_type", "rewrite")
        .gte("created_at", startOfToday.toISOString())
        .lt("created_at", endOfToday.toISOString()),
      supabase
        .from("user_corrections")
        .select("id", { count: "exact", head: true })
        .eq("operation_type", "ai_analysis")
        .gte("created_at", startOfToday.toISOString())
        .lt("created_at", endOfToday.toISOString()),
      supabase
        .from("plan_limits_config")
        .select(
          "plan_type, max_characters, corrections_per_day, rewrites_per_day, ai_analyses_per_day, show_ads, updated_at",
        ),
      supabase
        .from("user_corrections")
        .select("created_at, operation_type")
        .gte("created_at", startOfRange.toISOString())
        .lt("created_at", endOfToday.toISOString()),
      supabase
        .from("profiles")
        .select("id, full_name, email, plan_type, subscription_status, created_at, updated_at")
        .in("plan_type", ["pro", "admin"])
        .order("updated_at", { ascending: false })
        .limit(5),
    ])

    const supabaseErrors = [
      totalUsersRes.error,
      freeUsersRes.error,
      proUsersRes.error,
      adminUsersRes.error,
      activePremiumRes.error,
      correctionsTodayRes.error,
      rewritesTodayRes.error,
      analysesTodayRes.error,
      planLimitsRes.error,
      operationsLast7DaysRes.error,
      recentPremiumUsersRes.error,
    ].filter(Boolean) as Error[]

    if (supabaseErrors.length > 0) {
      supabaseErrors.forEach((err) => console.error("Admin dashboard summary error:", err))
      return NextResponse.json({ error: "Failed to load dashboard summary" }, { status: 500 })
    }

    const userCounts = {
      total: totalUsersRes.count || 0,
      free: freeUsersRes.count || 0,
      pro: proUsersRes.count || 0,
      admin: adminUsersRes.count || 0,
    }

    const premiumCount = (userCounts.pro || 0) + (userCounts.admin || 0)
    const activePremium = activePremiumRes.count || 0

    const operationsToday = {
      corrections: correctionsTodayRes.count || 0,
      rewrites: rewritesTodayRes.count || 0,
      analyses: analysesTodayRes.count || 0,
    }

    const planLimits = (planLimitsRes.data || []).reduce(
      (acc, limit) => {
        if (limit.plan_type === "free" || limit.plan_type === "pro") {
          acc[limit.plan_type] = {
            max_characters: limit.max_characters,
            corrections_per_day: limit.corrections_per_day,
            rewrites_per_day: limit.rewrites_per_day,
            ai_analyses_per_day: limit.ai_analyses_per_day,
            show_ads: limit.show_ads,
            updated_at: limit.updated_at,
          }
        }
        return acc
      },
      { free: null as PlanLimitSummary | null, pro: null as PlanLimitSummary | null },
    )

    const operationsMap = new Map<
      string,
      { corrections: number; rewrites: number; analyses: number }
    >()

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfRange)
      date.setUTCDate(startOfRange.getUTCDate() + i)
      const key = date.toISOString().slice(0, 10)
      operationsMap.set(key, { corrections: 0, rewrites: 0, analyses: 0 })
    }

    for (const entry of operationsLast7DaysRes.data || []) {
      const key = new Date(entry.created_at).toISOString().slice(0, 10)
      if (!operationsMap.has(key)) continue

      const bucket = operationsMap.get(key)!
      if (entry.operation_type === "correct") {
        bucket.corrections += 1
      } else if (entry.operation_type === "rewrite") {
        bucket.rewrites += 1
      } else if (entry.operation_type === "ai_analysis") {
        bucket.analyses += 1
      }
    }

    const operationsLast7Days = Array.from(operationsMap.entries()).map(([date, values]) => ({
      date,
      ...values,
      total: values.corrections + values.rewrites + values.analyses,
    }))

    const recentPremiumUsers = (recentPremiumUsersRes.data || []).map((user) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      plan_type: user.plan_type,
      subscription_status: user.subscription_status,
      updated_at: user.updated_at,
      created_at: user.created_at,
    }))

    return NextResponse.json({
      userCounts: {
        ...userCounts,
        premium: premiumCount,
        activePremium,
      },
      operationsToday: {
        ...operationsToday,
        total: operationsToday.corrections + operationsToday.rewrites + operationsToday.analyses,
      },
      operationsLast7Days,
      planLimits,
      recentPremiumUsers,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/dashboard/summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
// @ts-nocheck
