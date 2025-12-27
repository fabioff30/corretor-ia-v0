/**
 * API Route: Send Promotional Campaign Emails
 * POST /api/admin/campaigns/send-promo
 *
 * Sends promotional emails to targeted user segments.
 * Admin authentication required.
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"
import { sendNewYearBundleEmail } from "@/lib/email/send"

export const maxDuration = 300 // 5 minutes for bulk operations

interface SendPromoRequest {
  campaign: "new-year-bundle"
  target: "free" | "cancelled" | "free_and_cancelled"
  dryRun?: boolean
  batchSize?: number
  startOffset?: number
}

interface EmailResult {
  email: string
  success: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify admin authentication
    const { user, profile } = await getCurrentUserWithProfile()

    if (!user || !profile || profile.plan_type !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    const body: SendPromoRequest = await request.json()
    const {
      campaign,
      target,
      dryRun = false,
      batchSize = 50,
      startOffset = 0,
    } = body

    // Validate campaign
    if (campaign !== "new-year-bundle") {
      return NextResponse.json(
        { error: "Invalid campaign. Supported: new-year-bundle" },
        { status: 400 }
      )
    }

    // Validate target
    if (!["free", "cancelled", "free_and_cancelled"].includes(target)) {
      return NextResponse.json(
        { error: "Invalid target. Supported: free, cancelled, free_and_cancelled" },
        { status: 400 }
      )
    }

    console.log(`[Campaign] Starting ${campaign} campaign for target: ${target}`, {
      dryRun,
      batchSize,
      startOffset,
      admin: user.email,
    })

    // Build query based on target
    let query = supabase
      .from("profiles")
      .select("id, email, full_name, plan_type, subscription_status")
      .not("email", "is", null)

    switch (target) {
      case "free":
        query = query.eq("plan_type", "free")
        break
      case "cancelled":
        query = query.eq("subscription_status", "cancelled")
        break
      case "free_and_cancelled":
        query = query.or("plan_type.eq.free,subscription_status.eq.cancelled")
        break
    }

    // Add pagination
    query = query
      .range(startOffset, startOffset + batchSize - 1)
      .order("created_at", { ascending: true })

    const { data: users, error: queryError, count } = await query

    if (queryError) {
      console.error("[Campaign] Query error:", queryError)
      return NextResponse.json(
        { error: "Failed to query users", details: queryError.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found matching criteria",
        stats: {
          target,
          usersFound: 0,
          emailsSent: 0,
          emailsFailed: 0,
          dryRun,
        },
      })
    }

    console.log(`[Campaign] Found ${users.length} users to email`)

    // Send emails
    const results: EmailResult[] = []
    let successCount = 0
    let failCount = 0

    for (const targetUser of users) {
      if (!targetUser.email) continue

      const isFreePlan = targetUser.plan_type === "free"
      const isCancelled = targetUser.subscription_status === "cancelled"

      if (dryRun) {
        // Dry run - just log what would be sent
        results.push({
          email: targetUser.email,
          success: true,
          error: "DRY_RUN",
        })
        successCount++
        continue
      }

      try {
        await sendNewYearBundleEmail({
          to: {
            email: targetUser.email,
            name: targetUser.full_name || undefined,
          },
          name: targetUser.full_name,
          isFreePlan,
          isCancelled,
        })

        results.push({
          email: targetUser.email,
          success: true,
        })
        successCount++

        // Rate limiting: small delay between emails to avoid hitting Brevo limits
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (emailError) {
        console.error(`[Campaign] Failed to send email to ${targetUser.email}:`, emailError)
        results.push({
          email: targetUser.email,
          success: false,
          error: emailError instanceof Error ? emailError.message : "Unknown error",
        })
        failCount++
      }
    }

    const duration = Date.now() - startTime

    console.log(`[Campaign] Completed in ${duration}ms:`, {
      target,
      total: users.length,
      success: successCount,
      failed: failCount,
      dryRun,
    })

    // Calculate if there are more users to process
    const hasMore = users.length === batchSize
    const nextOffset = hasMore ? startOffset + batchSize : null

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Dry run completed. Would send ${successCount} emails.`
        : `Campaign sent successfully. ${successCount} emails sent.`,
      stats: {
        campaign,
        target,
        batchSize,
        startOffset,
        usersInBatch: users.length,
        emailsSent: successCount,
        emailsFailed: failCount,
        dryRun,
        processingTimeMs: duration,
        hasMore,
        nextOffset,
      },
      // Only include detailed results in dry run or if there are failures
      results: dryRun || failCount > 0 ? results : undefined,
    })
  } catch (error) {
    console.error("[Campaign] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to preview campaign targets
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { user, profile } = await getCurrentUserWithProfile()

    if (!user || !profile || profile.plan_type !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    // Get counts for each target segment
    const [freeResult, cancelledResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan_type", "free")
        .not("email", "is", null),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("subscription_status", "cancelled")
        .not("email", "is", null),
    ])

    // Get combined count (may have overlap)
    const combinedResult = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .or("plan_type.eq.free,subscription_status.eq.cancelled")
      .not("email", "is", null)

    return NextResponse.json({
      availableCampaigns: [
        {
          id: "new-year-bundle",
          name: "Oferta de Fim de Ano",
          description: "CorretorIA + Julinho por R$19,90/mês",
          validUntil: "2025-01-06T23:59:59-03:00",
        },
      ],
      targetSegments: {
        free: {
          count: freeResult.count || 0,
          description: "Usuários no plano gratuito",
        },
        cancelled: {
          count: cancelledResult.count || 0,
          description: "Usuários que cancelaram assinatura",
        },
        free_and_cancelled: {
          count: combinedResult.count || 0,
          description: "Gratuitos + Cancelados (pode ter sobreposição)",
        },
      },
      usage: {
        endpoint: "POST /api/admin/campaigns/send-promo",
        body: {
          campaign: "new-year-bundle",
          target: "free_and_cancelled",
          dryRun: true,
          batchSize: 50,
          startOffset: 0,
        },
      },
    })
  } catch (error) {
    console.error("[Campaign Preview] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
