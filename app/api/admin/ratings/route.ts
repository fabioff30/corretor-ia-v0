import { type NextRequest, NextResponse } from "next/server"
import { getRatingDetails } from "@/utils/rating-storage"

// Chave de API para proteger o endpoint (deve ser configurada como variável de ambiente)
const API_KEY = process.env.ADMIN_API_KEY || ""

export async function GET(request: NextRequest) {
  // Verificar a chave de API
  const authHeader = request.headers.get("authorization")
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

  if (!API_KEY || !apiKey || apiKey !== API_KEY) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
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
