/**
 * API Route: Send Promotional Campaign
 * POST /api/admin/campaigns/send-promo
 *
 * Sends promotional emails AND/OR WhatsApp messages to targeted user segments.
 * Admin authentication required.
 *
 * Channels:
 * - email: Send emails via Brevo
 * - whatsapp: Send WhatsApp broadcast via Julinho
 * - both: Send both email and WhatsApp
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"
import { sendNewYearBundleEmail } from "@/lib/email/send"
import {
  sendJulinhoBroadcast,
  getJulinhoBroadcastPreview,
} from "@/lib/julinho/client"

export const maxDuration = 300 // 5 minutes for bulk operations

interface SendPromoRequest {
  campaign: "new-year-bundle"
  target: "free" | "cancelled" | "free_and_cancelled"
  channel?: "email" | "whatsapp" | "both" // Default: email
  dryRun?: boolean
  batchSize?: number
  startOffset?: number
  // WhatsApp-specific options
  whatsappMessage?: string
  whatsappDelaySeconds?: number
  whatsappTestMode?: boolean
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
      channel = "email",
      dryRun = false,
      batchSize = 50,
      startOffset = 0,
      whatsappMessage,
      whatsappDelaySeconds = 5,
      whatsappTestMode = false,
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

    // Validate channel
    if (!["email", "whatsapp", "both"].includes(channel)) {
      return NextResponse.json(
        { error: "Invalid channel. Supported: email, whatsapp, both" },
        { status: 400 }
      )
    }

    // WhatsApp channel requires a message
    if ((channel === "whatsapp" || channel === "both") && !whatsappMessage) {
      return NextResponse.json(
        { error: "whatsappMessage is required for WhatsApp campaigns" },
        { status: 400 }
      )
    }

    console.log(`[Campaign] Starting ${campaign} campaign for target: ${target}`, {
      channel,
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

    console.log(`[Campaign] Found ${users.length} users`)

    // Initialize stats
    const results: EmailResult[] = []
    let emailSuccessCount = 0
    let emailFailCount = 0
    let whatsappResult = null

    // ============================================
    // SEND EMAILS (if channel is email or both)
    // ============================================
    if (channel === "email" || channel === "both") {
      console.log(`[Campaign] Sending emails to ${users.length} users`)

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
          emailSuccessCount++
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
          emailSuccessCount++

          // Rate limiting: small delay between emails to avoid hitting Brevo limits
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (emailError) {
          console.error(`[Campaign] Failed to send email to ${targetUser.email}:`, emailError)
          results.push({
            email: targetUser.email,
            success: false,
            error: emailError instanceof Error ? emailError.message : "Unknown error",
          })
          emailFailCount++
        }
      }
    }

    // ============================================
    // SEND WHATSAPP BROADCAST (if channel is whatsapp or both)
    // ============================================
    if (channel === "whatsapp" || channel === "both") {
      console.log(`[Campaign] Sending WhatsApp broadcast`)

      // Map target to Julinho filter
      const whatsappFilters = {
        subscriptionStatus: target === "free" ? "free" as const : "all" as const,
        engagement: "all" as const,
      }

      if (dryRun) {
        // Get preview only
        const preview = await getJulinhoBroadcastPreview(whatsappFilters)
        whatsappResult = {
          dryRun: true,
          preview: preview.success ? preview.data : null,
          error: preview.error,
        }
      } else {
        // Send actual broadcast
        const broadcast = await sendJulinhoBroadcast(
          whatsappMessage!,
          whatsappFilters,
          whatsappDelaySeconds,
          whatsappTestMode
        )
        whatsappResult = {
          dryRun: false,
          success: broadcast.success,
          message: broadcast.message,
          config: broadcast.config,
          error: broadcast.error,
        }
      }
    }

    const duration = Date.now() - startTime

    console.log(`[Campaign] Completed in ${duration}ms:`, {
      channel,
      target,
      emailSuccess: emailSuccessCount,
      emailFailed: emailFailCount,
      whatsappSent: whatsappResult?.success || false,
      dryRun,
    })

    // Calculate if there are more users to process (only relevant for email)
    const hasMore = users.length === batchSize && (channel === "email" || channel === "both")
    const nextOffset = hasMore ? startOffset + batchSize : null

    // Build response message
    let message = ""
    if (dryRun) {
      if (channel === "email") {
        message = `Dry run completed. Would send ${emailSuccessCount} emails.`
      } else if (channel === "whatsapp") {
        message = `Dry run completed. WhatsApp preview retrieved.`
      } else {
        message = `Dry run completed. Would send ${emailSuccessCount} emails + WhatsApp broadcast.`
      }
    } else {
      if (channel === "email") {
        message = `Campaign sent. ${emailSuccessCount} emails sent.`
      } else if (channel === "whatsapp") {
        message = `WhatsApp broadcast started.`
      } else {
        message = `Campaign sent. ${emailSuccessCount} emails + WhatsApp broadcast started.`
      }
    }

    return NextResponse.json({
      success: true,
      message,
      stats: {
        campaign,
        target,
        channel,
        batchSize,
        startOffset,
        usersInBatch: users.length,
        email: {
          sent: emailSuccessCount,
          failed: emailFailCount,
        },
        whatsapp: whatsappResult,
        dryRun,
        processingTimeMs: duration,
        hasMore,
        nextOffset,
      },
      // Only include detailed results in dry run or if there are failures
      results: dryRun || emailFailCount > 0 ? results : undefined,
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

    // Get WhatsApp preview from Julinho
    let whatsappPreview = null
    try {
      const julinhoPrev = await getJulinhoBroadcastPreview({ subscriptionStatus: "free" })
      if (julinhoPrev.success) {
        whatsappPreview = julinhoPrev.data
      }
    } catch (e) {
      console.error("[Campaign Preview] Failed to get Julinho preview:", e)
    }

    return NextResponse.json({
      availableCampaigns: [
        {
          id: "new-year-bundle",
          name: "Oferta de Fim de Ano",
          description: "CorretorIA + Julinho por R$19,90/mês",
          validUntil: "2025-01-06T23:59:59-03:00",
        },
      ],
      channels: {
        email: "Envio de emails via Brevo",
        whatsapp: "Broadcast via Julinho WhatsApp",
        both: "Email + WhatsApp simultaneamente",
      },
      targetSegments: {
        email: {
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
        whatsapp: whatsappPreview || {
          note: "Julinho não disponível",
        },
      },
      usage: {
        emailOnly: {
          endpoint: "POST /api/admin/campaigns/send-promo",
          body: {
            campaign: "new-year-bundle",
            target: "free_and_cancelled",
            channel: "email",
            dryRun: true,
            batchSize: 50,
          },
        },
        whatsappOnly: {
          endpoint: "POST /api/admin/campaigns/send-promo",
          body: {
            campaign: "new-year-bundle",
            target: "free",
            channel: "whatsapp",
            whatsappMessage: `🎆 Oferta de Ano Novo! 🎆

Olá {nome}! O Julinho e o CorretorIA se juntaram pra te dar um presente:

✅ Correções ILIMITADAS de texto
✅ Julinho no WhatsApp sem limites
✅ Tudo isso por apenas R$ 19,90/mês

Preço travado! Economize 50% em comparação aos planos individuais.

👉 https://www.corretordetextoonline.com.br/oferta-fim-de-ano?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=fimdeano2024

Válido até 06/01! 🚀`,
            whatsappDelaySeconds: 5,
            whatsappTestMode: true,
            dryRun: true,
          },
        },
        both: {
          endpoint: "POST /api/admin/campaigns/send-promo",
          body: {
            campaign: "new-year-bundle",
            target: "free_and_cancelled",
            channel: "both",
            whatsappMessage: "...",
            dryRun: true,
          },
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
