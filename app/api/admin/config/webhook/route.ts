import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth } from "@/middleware/admin-auth"
import {
  updateWebhookConfig,
  getWebhookConfiguration,
  clearWebhookCache,
  WebhookType,
} from "@/lib/webhook-config"

/**
 * GET /api/admin/config/webhook
 * Get current webhook configuration
 * Requires: admin JWT or ADMIN_API_KEY
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Verify admin authentication
    const authError = await verifyAdminAuth(request)
    if (authError) {
      return NextResponse.json(
        { error: "Unauthorized", details: ["Admin access required"] },
        { status: 401 }
      )
    }

    // Get all webhook configurations
    const configs: Record<string, any> = {}

    for (const type of Object.values(WebhookType)) {
      configs[type] = await getWebhookConfiguration(type as WebhookType, requestId)
    }

    return NextResponse.json(
      {
        status: "success",
        configurations: configs,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Webhook config GET error:", error, requestId)
    return NextResponse.json(
      { error: "Internal server error", details: ["Failed to retrieve webhook configuration"] },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/config/webhook
 * Update webhook configuration
 * Body: { type: WebhookType, level: "primary"|"fallback"|"secondary", url: string }
 * Requires: admin JWT or ADMIN_API_KEY
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Verify admin authentication
    const authError = await verifyAdminAuth(request)
    if (authError) {
      return NextResponse.json(
        { error: "Unauthorized", details: ["Admin access required"] },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, level, url } = body

    // Validate input
    if (!type || !level || !url) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: ["Missing required fields: type, level, url"],
        },
        { status: 400 }
      )
    }

    // Validate type
    if (!Object.values(WebhookType).includes(type)) {
      return NextResponse.json(
        {
          error: "Invalid webhook type",
          details: [
            `type must be one of: ${Object.values(WebhookType).join(", ")}`,
          ],
        },
        { status: 400 }
      )
    }

    // Validate level
    if (!["primary", "fallback", "secondary"].includes(level)) {
      return NextResponse.json(
        {
          error: "Invalid level",
          details: ['level must be one of: "primary", "fallback", "secondary"'],
        },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        {
          error: "Invalid URL",
          details: ["URL must be a valid HTTP/HTTPS URL"],
        },
        { status: 400 }
      )
    }

    // Update configuration
    const success = await updateWebhookConfig(type, level as any, url, requestId)

    if (!success) {
      return NextResponse.json(
        {
          error: "Configuration update failed",
          details: ["Could not update webhook configuration"],
        },
        { status: 500 }
      )
    }

    // Clear cache to ensure new config is used immediately
    clearWebhookCache()

    // Get updated configuration
    const updatedConfig = await getWebhookConfiguration(type, requestId)

    console.log(`Admin: Updated webhook ${type}/${level} via API`, requestId)

    return NextResponse.json(
      {
        status: "success",
        message: `Webhook ${type}/${level} updated successfully`,
        configuration: updatedConfig,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Webhook config POST error:", error, requestId)
    return NextResponse.json(
      { error: "Internal server error", details: ["Failed to update webhook configuration"] },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/config/webhook
 * Reset webhook configuration to defaults
 * Body: { type?: WebhookType } (if not provided, resets all)
 * Requires: admin JWT or ADMIN_API_KEY
 */
export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Verify admin authentication
    const authError = await verifyAdminAuth(request)
    if (authError) {
      return NextResponse.json(
        { error: "Unauthorized", details: ["Admin access required"] },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { type } = body

    // Clear cache
    clearWebhookCache()

    let message = "All webhook configurations reset to defaults"

    if (type) {
      if (!Object.values(WebhookType).includes(type)) {
        return NextResponse.json(
          {
            error: "Invalid webhook type",
            details: [
              `type must be one of: ${Object.values(WebhookType).join(", ")}`,
            ],
          },
          { status: 400 }
        )
      }
      message = `Webhook ${type} configuration reset to defaults`
    }

    console.log(`Admin: Reset webhook configuration: ${message}`, requestId)

    return NextResponse.json(
      {
        status: "success",
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Webhook config DELETE error:", error, requestId)
    return NextResponse.json(
      { error: "Internal server error", details: ["Failed to reset webhook configuration"] },
      { status: 500 }
    )
  }
}
