// @ts-nocheck
/**
 * API Route: Admin Coupon Management
 * GET /api/admin/coupons
 * POST /api/admin/coupons
 *
 * Allows administrators to list and create Stripe promotion codes
 */

import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/server"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"

export const maxDuration = 60

function requireAdmin(profilePlanType?: string) {
  if (profilePlanType !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }
}

export async function GET(request: NextRequest) {
  try {
    const { profile } = await getCurrentUserWithProfile()
    requireAdmin(profile?.plan_type)

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100) : 20

    const promotionCodes = await stripe.promotionCodes.list({
      limit,
      expand: ["data.coupon"],
    })

    const mapped = promotionCodes.data.map((promotionCode) => {
      const coupon = promotionCode.coupon
      const couponData =
        typeof coupon === "string"
          ? null
          : {
              id: coupon.id,
              name: coupon.name,
              duration: coupon.duration,
              durationInMonths: coupon.duration_in_months ?? null,
              percentOff: coupon.percent_off ?? null,
              amountOff: coupon.amount_off ?? null,
              currency: coupon.currency ?? null,
              valid: coupon.valid,
            }

      return {
        id: promotionCode.id,
        code: promotionCode.code,
        active: promotionCode.active,
        created: promotionCode.created,
        expiresAt: promotionCode.expires_at,
        maxRedemptions: promotionCode.max_redemptions,
        timesRedeemed: promotionCode.times_redeemed,
        coupon: couponData,
        restrictions: promotionCode.restrictions,
      }
    })

    return NextResponse.json({ promotionCodes: mapped })
  } catch (error) {
    console.error("Error fetching promotion codes:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch promotion codes"
    const status = message.includes("Unauthorized") ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = await getCurrentUserWithProfile()
    requireAdmin(profile?.plan_type)

    const body = await request.json().catch(() => ({}))
    const {
      code,
      percentOff,
      duration = "once",
      durationInMonths,
      maxRedemptions,
      expiresAt,
      name,
    } = body as {
      code?: string
      percentOff?: number
      duration?: "once" | "repeating" | "forever"
      durationInMonths?: number | null
      maxRedemptions?: number | null
      expiresAt?: string | null
      name?: string | null
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "O código do cupom é obrigatório." }, { status: 400 })
    }

    if (!percentOff || typeof percentOff !== "number" || percentOff <= 0 || percentOff > 100) {
      return NextResponse.json(
        { error: "Informe um percentual de desconto entre 1 e 100." },
        { status: 400 },
      )
    }

    if (!["once", "repeating", "forever"].includes(duration)) {
      return NextResponse.json({ error: "Duração inválida." }, { status: 400 })
    }

    if (duration === "repeating") {
      if (!durationInMonths || durationInMonths < 1 || durationInMonths > 24) {
        return NextResponse.json(
          { error: "Para cupons recorrentes, informe a quantidade de meses (1 a 24)." },
          { status: 400 },
        )
      }
    }

    let expiresAtTimestamp: number | undefined
    if (expiresAt) {
      const expiresDate = new Date(expiresAt)
      if (Number.isNaN(expiresDate.getTime())) {
        return NextResponse.json({ error: "Data de expiração inválida." }, { status: 400 })
      }
      expiresAtTimestamp = Math.floor(expiresDate.getTime() / 1000)
    }

    const coupon = await stripe.coupons.create({
      duration,
      percent_off: percentOff,
      duration_in_months: duration === "repeating" ? durationInMonths ?? undefined : undefined,
      name: name || undefined,
    })

    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code.trim().toUpperCase(),
      active: true,
      max_redemptions: maxRedemptions ?? undefined,
      expires_at: expiresAtTimestamp,
    })

    return NextResponse.json({
      promotionCode: {
        id: promotionCode.id,
        code: promotionCode.code,
        active: promotionCode.active,
        created: promotionCode.created,
        expiresAt: promotionCode.expires_at,
        maxRedemptions: promotionCode.max_redemptions,
        timesRedeemed: promotionCode.times_redeemed,
      },
      coupon: {
        id: coupon.id,
        name: coupon.name,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months ?? null,
        percentOff: coupon.percent_off ?? null,
      },
    })
  } catch (error) {
    console.error("Error creating promotion code:", error)
    const message =
      error instanceof Error ? error.message : "Não foi possível criar o cupom de desconto."
    const status = message.includes("Unauthorized") ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
// @ts-nocheck
