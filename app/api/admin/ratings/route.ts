import { type NextRequest, NextResponse } from "next/server"
import { getRatingDetails } from "@/utils/rating-storage"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { user, profile } = await getCurrentUserWithProfile()

    if (!user || !profile || profile.plan_type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    // Obter parâmetros de paginação da query string
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10)

    // Validar os parâmetros
    const validLimit = Math.min(Math.max(1, limit), 100) // Entre 1 e 100
    const validOffset = Math.max(0, offset)

    // Obter as avaliações
    const ratings = await getRatingDetails(validLimit, validOffset)

    return NextResponse.json({
      ratings,
      pagination: {
        limit: validLimit,
        offset: validOffset,
        count: ratings.length,
      },
    })
  } catch (error) {
    console.error("Erro ao obter avaliações:", error)
    return NextResponse.json(
      { error: "Erro ao obter avaliações", message: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
