/**
 * API Route: Dashboard usage overview
 * GET /api/dashboard/usage
 *
 * Returns daily usage stats, plan limits and preferences for the authenticated user
 */

import { NextResponse } from "next/server"
import { addDays, startOfDay, subDays } from "date-fns"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"
import { createServiceRoleClient } from "@/lib/supabase/server"

function formatDateRange(date: Date) {
  const start = startOfDay(date)
  const end = addDays(start, 1)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export async function GET() {
  try {
    const { user, profile } = await getCurrentUserWithProfile()

    if (!user || !profile) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    const today = new Date()
    const todayRange = formatDateRange(today)

    // Calculate date 30 days ago for recent activity
    const thirtyDaysAgo = subDays(today, 30).toISOString()

    const planType = profile.plan_type === "admin" ? "pro" : (profile.plan_type ?? "free")

    // Fetch daily usage, plan limits, last 30 days counts, and lifetime totals in parallel
    const [
      { data: limits, error: limitsError },
      { data: usageData, error: usageError },
      { count: correctionsLast30Days, error: corrections30Error },
      { count: rewritesLast30Days, error: rewrites30Error },
      { count: aiAnalysesLast30Days, error: aiAnalyses30Error },
      { count: correctionsTotal, error: correctionsError },
      { count: rewritesTotal, error: rewritesError },
      { count: aiAnalysesTotal, error: aiAnalysesError },
    ] = await Promise.all([
      supabase
        .from("plan_limits_config")
        .select(
          "plan_type, max_characters, corrections_per_day, rewrites_per_day, ai_analyses_per_day, show_ads, updated_at",
        )
        .eq("plan_type", planType)
        .maybeSingle(),
      supabase
        .from("usage_limits")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", todayRange.start.slice(0, 10))
        .maybeSingle(),
      // Get corrections count from last 30 days
      supabase
        .from("user_corrections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("operation_type", "correct")
        .gte("created_at", thirtyDaysAgo),
      // Get rewrites count from last 30 days
      supabase
        .from("user_corrections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("operation_type", "rewrite")
        .gte("created_at", thirtyDaysAgo),
      // Get AI analyses count from last 30 days
      supabase
        .from("user_corrections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("operation_type", "ai_analysis")
        .gte("created_at", thirtyDaysAgo),
      // Get total corrections count (lifetime)
      supabase
        .from("user_corrections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("operation_type", "correct"),
      // Get total rewrites count (lifetime)
      supabase
        .from("user_corrections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("operation_type", "rewrite"),
      // Get total AI analyses count (lifetime)
      supabase
        .from("user_corrections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("operation_type", "ai_analysis"),
    ])

    if (limitsError) {
      console.error("Erro ao buscar limites do plano:", limitsError)
      return NextResponse.json(
        { error: "Não foi possível carregar as configurações do plano" },
        { status: 500 },
      )
    }

    // Log errors for counts but don't fail the request
    if (corrections30Error) {
      console.error("Erro ao buscar correções dos últimos 30 dias:", corrections30Error)
    }
    if (rewrites30Error) {
      console.error("Erro ao buscar reescritas dos últimos 30 dias:", rewrites30Error)
    }
    if (aiAnalyses30Error) {
      console.error("Erro ao buscar análises de IA dos últimos 30 dias:", aiAnalyses30Error)
    }
    if (correctionsError) {
      console.error("Erro ao buscar total de correções:", correctionsError)
    }
    if (rewritesError) {
      console.error("Erro ao buscar total de reescritas:", rewritesError)
    }
    if (aiAnalysesError) {
      console.error("Erro ao buscar total de análises de IA:", aiAnalysesError)
    }

    let usage = usageData

    if (usageError && usageError.code !== "PGRST116") {
      console.error("Erro ao buscar uso do dia:", usageError)
      return NextResponse.json(
        { error: "Não foi possível carregar o uso diário" },
        { status: 500 },
      )
    }

    // Se não há registro de uso para hoje, criar um (usando upsert para evitar race conditions)
    if (!usage) {
      const { data: insertedUsage, error: insertError } = await supabase
        .from("usage_limits")
        .upsert(
          {
            user_id: user.id,
            date: todayRange.start.slice(0, 10),
            corrections_used: 0,
            rewrites_used: 0,
            ai_analyses_used: 0,
            last_reset: todayRange.start,
          },
          {
            onConflict: "user_id,date",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single()

      if (insertError) {
        // Se ainda assim houver erro de duplicação (race condition), buscar o registro existente
        if (insertError.code === "23505") {
          console.log("[Dashboard Usage] Registro já existe (race condition), buscando novamente...")
          const { data: existingUsage, error: fetchError } = await supabase
            .from("usage_limits")
            .select("*")
            .eq("user_id", user.id)
            .eq("date", todayRange.start.slice(0, 10))
            .single()

          if (fetchError) {
            console.error("Erro ao buscar registro existente após duplicação:", fetchError)
            return NextResponse.json(
              { error: "Não foi possível carregar o uso diário" },
              { status: 500 },
            )
          }

          usage = existingUsage
        } else {
          console.error("Erro ao criar registro de uso diário:", insertError)
          return NextResponse.json(
            { error: "Não foi possível inicializar o uso diário" },
            { status: 500 },
          )
        }
      } else {
        usage = insertedUsage
      }
    }

    const effectiveLimits =
      limits ??
      {
        id: `fallback-${planType}`,
        plan_type: planType as "free" | "pro",
        max_characters: planType === "pro" ? -1 : 1500,
        corrections_per_day: planType === "pro" ? -1 : 20,
        rewrites_per_day: planType === "pro" ? -1 : 10,
        ai_analyses_per_day: planType === "pro" ? -1 : 5,
        show_ads: planType !== "pro",
        updated_at: new Date().toISOString(),
        updated_by: null,
        created_at: new Date().toISOString(),
      }

    const isPremium = profile.plan_type === "pro" || profile.plan_type === "admin"

    const stats = {
      // Daily usage (kept for backwards compatibility with usage limit checks)
      corrections_used: usage.corrections_used,
      rewrites_used: usage.rewrites_used,
      ai_analyses_used: usage.ai_analyses_used,
      corrections_remaining: isPremium
        ? -1
        : Math.max(0, effectiveLimits.corrections_per_day - (usage.corrections_used ?? 0)),
      rewrites_remaining: isPremium
        ? -1
        : Math.max(0, effectiveLimits.rewrites_per_day - (usage.rewrites_used ?? 0)),
      ai_analyses_remaining: isPremium
        ? -1
        : Math.max(0, effectiveLimits.ai_analyses_per_day - (usage.ai_analyses_used ?? 0)),
      date: usage.date,
      // Last 30 days activity
      corrections_last_30_days: correctionsLast30Days ?? 0,
      rewrites_last_30_days: rewritesLast30Days ?? 0,
      ai_analyses_last_30_days: aiAnalysesLast30Days ?? 0,
      // Lifetime totals
      corrections_total: correctionsTotal ?? 0,
      rewrites_total: rewritesTotal ?? 0,
      ai_analyses_total: aiAnalysesTotal ?? 0,
    }

    // Build 7-day history for reference (optional future use)
    const historyDates = Array.from({ length: 7 }, (_, index) => {
      const target = subDays(today, 6 - index)
      return target.toISOString().slice(0, 10)
    })

    const { data: historyData, error: historyError } = await supabase
      .from("usage_limits")
      .select("date, corrections_used, rewrites_used, ai_analyses_used")
      .eq("user_id", user.id)
      .in("date", historyDates)
      .order("date", { ascending: true })

    if (historyError) {
      console.warn("Não foi possível carregar histórico de uso:", historyError)
    }

    return NextResponse.json({
      usage,
      limits: effectiveLimits,
      stats,
      showAds: effectiveLimits.show_ads,
      maxCharacters: effectiveLimits.max_characters,
      history: historyData ?? [],
      profileSnapshot: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        plan_type: profile.plan_type,
      },
    })
  } catch (error) {
    console.error("Erro inesperado em GET /api/dashboard/usage:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
