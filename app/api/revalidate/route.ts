import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getEnvConfig } from "@/utils/env-validation"

// Lazy-load revalidation token to avoid build-time validation issues
function getRevalidationToken(): string | undefined {
  try {
    const envConfig = getEnvConfig()
    return envConfig.REVALIDATION_TOKEN
  } catch (error) {
    // During build time, return undefined to prevent build failures
    console.warn("Failed to load revalidation token during build:", error)
    return undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is legitimate with token check
    const token = request.headers.get("x-revalidate-token")
    const REVALIDATION_TOKEN = getRevalidationToken()

    if (!REVALIDATION_TOKEN) {
      console.error("Revalidation token not configured")
      return NextResponse.json({ error: "Service not configured" }, { status: 503 })
    }

    if (token !== REVALIDATION_TOKEN) {
      console.warn("Unauthorized revalidation attempt with incorrect token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Revalidation request received:", body)

    // Handle different revalidation scenarios
    if (body.action === "refresh_all") {
      // Revalidate all blog content
      revalidatePath("/blog")
      console.log("Revalidated all blog content")
      return NextResponse.json({ revalidated: true, path: "/blog" })
    } else if (body.slug) {
      // Revalidate specific post
      revalidatePath(`/blog/${body.slug}`)
      // Also revalidate blog index to update listings
      revalidatePath("/blog")

      console.log(`Revalidated post: ${body.slug}`)
      return NextResponse.json({ revalidated: true, slug: body.slug })
    } else {
      // Default case - revalidate blog index
      revalidatePath("/blog")
      console.log("Revalidated blog index")
      return NextResponse.json({ revalidated: true, path: "/blog" })
    }
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json(
      {
        error: "Error revalidating",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Also support GET requests for easier testing
export async function GET(request: NextRequest) {
  try {
    // Check for token in query string for GET requests
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const path = searchParams.get("path") || "/blog"
    const REVALIDATION_TOKEN = getRevalidationToken()

    if (!REVALIDATION_TOKEN) {
      console.error("Revalidation token not configured")
      return NextResponse.json({ error: "Service not configured" }, { status: 503 })
    }

    if (token !== REVALIDATION_TOKEN) {
      console.warn("Unauthorized revalidation attempt with incorrect token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Revalidate the specified path
    revalidatePath(path)
    console.log(`Revalidated path: ${path}`)

    return NextResponse.json({ revalidated: true, path })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json(
      {
        error: "Error revalidating",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
