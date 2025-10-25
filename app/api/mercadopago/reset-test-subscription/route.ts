/**
 * API Route: Reset Test Subscription
 * DELETE /api/mercadopago/reset-test-subscription
 *
 * Deletes all test subscriptions for a user (for development/testing only)
 * ⚠️ USE ONLY IN DEVELOPMENT/STAGING - NOT FOR PRODUCTION
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"

export const maxDuration = 60

const NON_PRODUCTION_HOST_PATTERNS = ["stage.", "localhost", "127.0.0.1", ".vercel.app"]

function shouldBypassProductionGuard(target?: string | null) {
  const normalized = target?.toLowerCase() ?? ""
  if (!normalized) {
    return false
  }
  return NON_PRODUCTION_HOST_PATTERNS.some(pattern => normalized.includes(pattern))
}

function isProductionEnvironment(hostname?: string | null) {
  if (process.env.ALLOW_TEST_SUBSCRIPTION_RESET === "true") {
    return false
  }

  if (process.env.NODE_ENV !== "production") {
    return false
  }

  if (shouldBypassProductionGuard(hostname)) {
    return false
  }

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL
  if (configuredAppUrl) {
    try {
      const url = new URL(configuredAppUrl)
      if (shouldBypassProductionGuard(url.hostname)) {
        return false
      }
    } catch {
      if (shouldBypassProductionGuard(configuredAppUrl)) {
        return false
      }
    }
  }

  return true
}

async function verifyAdminAccess(request: NextRequest) {
  const hostname =
    request?.nextUrl?.hostname ||
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host")

  if (isProductionEnvironment(hostname)) {
    return NextResponse.json(
      { error: "Endpoint desabilitado em produção" },
      { status: 403 }
    )
  }

  const { user, profile } = await getCurrentUserWithProfile()

  if (!user || !profile || profile.plan_type !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized: Admin access required" },
      { status: 401 }
    )
  }

  return null
}

export async function DELETE(request: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(request)
    if (accessError) {
      return accessError
    }

    // Get userId from query params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Delete all subscriptions for this user
    const { data: deletedSubscriptions, error: deleteSubError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("user_id", userId)
      .select()

    if (deleteSubError) {
      console.error("Error deleting subscriptions:", deleteSubError)
      return NextResponse.json(
        { error: "Failed to delete subscriptions", details: deleteSubError.message },
        { status: 500 }
      )
    }

    // Delete all payment transactions for this user
    const { data: deletedTransactions, error: deleteTxError } = await supabase
      .from("payment_transactions")
      .delete()
      .eq("user_id", userId)
      .select()

    if (deleteTxError) {
      console.error("Error deleting transactions:", deleteTxError)
      // Continue even if this fails
    }

    // Reset profile to free plan
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan_type: "free",
        subscription_status: "inactive",
        subscription_expires_at: null,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return NextResponse.json(
        { error: "Failed to update profile", details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Test subscriptions cleared successfully",
      deleted: {
        subscriptions: deletedSubscriptions?.length || 0,
        transactions: deletedTransactions?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error resetting test subscription:", error)
    return NextResponse.json(
      {
        error: "Failed to reset test subscription",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET to check current subscriptions
export async function GET(request: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(request)
    if (accessError) {
      return accessError
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)

    if (subError) {
      return NextResponse.json(
        { error: "Failed to fetch subscriptions", details: subError.message },
        { status: 500 }
      )
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, plan_type, subscription_status")
      .eq("id", userId)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to fetch profile", details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile,
      subscriptions: subscriptions || [],
      count: subscriptions?.length || 0,
    })
  } catch (error) {
    console.error("Error checking subscriptions:", error)
    return NextResponse.json(
      { error: "Failed to check subscriptions" },
      { status: 500 }
    )
  }
}
