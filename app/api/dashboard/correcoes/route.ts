import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"

const MAX_PAGE_SIZE = 100

const selectFields = `
  id,
  user_id,
  original_text,
  corrected_text,
  operation_type,
  tone_style,
  evaluation,
  character_count,
  created_at
`

export async function GET(request: NextRequest) {
  try {
    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams

    const page = Math.max(Number(searchParams.get("page")) || 0, 0)
    const rawPageSize = Number(searchParams.get("pageSize")) || 20
    const pageSize = Math.min(Math.max(rawPageSize, 1), MAX_PAGE_SIZE)
    const offset = page * pageSize

    const operationType = searchParams.get("operationType")
    const searchQuery = searchParams.get("searchQuery")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    let query = supabase
      .from("user_corrections")
      .select(selectFields)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize)

    if (operationType) {
      query = query.eq("operation_type", operationType)
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom)
    }

    if (dateTo) {
      query = query.lte("created_at", dateTo)
    }

    if (searchQuery) {
      const sanitized = searchQuery.trim().slice(0, 200)
      if (sanitized) {
        query = query.or(
          `original_text.ilike.%${sanitized}%,corrected_text.ilike.%${sanitized}%`,
        )
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar correções:", error)
      return NextResponse.json(
        { error: "Não foi possível carregar o histórico de textos" },
        { status: 500 },
      )
    }

    const safeData = data ?? []
    const hasMore = safeData.length === pageSize + 1
    const items = hasMore ? safeData.slice(0, pageSize) : safeData

    return NextResponse.json({
      items,
      hasMore,
      page,
      pageSize,
    })
  } catch (error) {
    console.error("Erro inesperado em GET /api/dashboard/correcoes:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("user_corrections")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Erro ao excluir correção:", error)
      return NextResponse.json(
        { error: "Não foi possível excluir o item" },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro inesperado em DELETE /api/dashboard/correcoes:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
