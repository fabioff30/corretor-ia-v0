// @ts-nocheck
/**
 * API para Google Indexing
 *
 * POST /api/admin/indexing - Submeter URLs para indexação
 * GET /api/admin/indexing - Listar URLs do blog disponíveis
 *
 * Requer autenticação de admin
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  submitUrlsInBatch,
  getBlogUrlsForIndexing,
  getUrlIndexingStatus,
  type IndexingAction,
} from "@/lib/google-indexing/indexing-api"

// Verifica se o usuário é admin
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_type")
      .eq("id", user.id)
      .single()

    return profile?.plan_type === "admin"
  } catch {
    return false
  }
}

/**
 * GET - Lista todas as URLs do blog disponíveis para indexação
 */
export async function GET(request: NextRequest) {
  // Verificar admin
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const urls = await getBlogUrlsForIndexing()

    // Adicionar URLs estáticas importantes
    const staticUrls = [
      "https://www.corretordetextoonline.com.br",
      "https://www.corretordetextoonline.com.br/blog",
      "https://www.corretordetextoonline.com.br/reescrever-texto",
      "https://www.corretordetextoonline.com.br/detector-ia",
      "https://www.corretordetextoonline.com.br/premium",
    ]

    return NextResponse.json({
      success: true,
      urls: [...staticUrls, ...urls],
      total: staticUrls.length + urls.length,
      quotaInfo: {
        dailyLimit: 200,
        batchLimit: 100,
        note: "Google permite 200 URLs/dia por padrão. Solicite aumento de quota se necessário.",
      },
    })
  } catch (error) {
    console.error("Error fetching URLs:", error)
    return NextResponse.json(
      { error: "Failed to fetch URLs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * POST - Submeter URLs para indexação
 *
 * Body:
 * - urls: string[] - Array de URLs para indexar
 * - action: "URL_UPDATED" | "URL_DELETED" - Tipo de ação (default: URL_UPDATED)
 * - indexAll: boolean - Se true, indexa todas as URLs do blog
 */
export async function POST(request: NextRequest) {
  // Verificar admin
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { urls: providedUrls, action = "URL_UPDATED", indexAll = false } = body as {
      urls?: string[]
      action?: IndexingAction
      indexAll?: boolean
    }

    let urlsToIndex: string[] = []

    if (indexAll) {
      // Indexar todas as URLs do blog
      urlsToIndex = await getBlogUrlsForIndexing()

      // Adicionar URLs estáticas
      urlsToIndex.unshift(
        "https://www.corretordetextoonline.com.br",
        "https://www.corretordetextoonline.com.br/blog",
        "https://www.corretordetextoonline.com.br/reescrever-texto",
        "https://www.corretordetextoonline.com.br/detector-ia"
      )
    } else if (providedUrls && Array.isArray(providedUrls)) {
      urlsToIndex = providedUrls
    } else {
      return NextResponse.json(
        { error: "No URLs provided. Send 'urls' array or set 'indexAll': true" },
        { status: 400 }
      )
    }

    // Limitar a 200 URLs (quota diária padrão)
    if (urlsToIndex.length > 200) {
      console.warn(`Limiting to 200 URLs (received ${urlsToIndex.length})`)
      urlsToIndex = urlsToIndex.slice(0, 200)
    }

    console.log(`Submitting ${urlsToIndex.length} URLs for indexing...`)

    const result = await submitUrlsInBatch(urlsToIndex, action)

    return NextResponse.json({
      success: true,
      ...result,
      message: `Submitted ${result.successful} of ${result.total} URLs successfully`,
    })
  } catch (error) {
    console.error("Error submitting URLs for indexing:", error)
    return NextResponse.json(
      { error: "Failed to submit URLs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
// @ts-nocheck
