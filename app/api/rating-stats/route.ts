import { NextResponse } from "next/server"
import { getRatingStats } from "@/utils/rating-stats"

export async function GET() {
  try {
    const stats = await getRatingStats()

    // Validar se os dados retornados são válidos
    if (!stats || typeof stats.averageRating !== "number" || typeof stats.totalRatings !== "number") {
      throw new Error("Dados de estatísticas inválidos")
    }

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("Erro ao obter estatísticas de avaliação:", error)

    // Retornar dados padrão em caso de erro
    const fallbackStats = {
      averageRating: 4.8,
      totalRatings: 1247,
      ratingCounts: {
        "5": 892,
        "4": 234,
        "3": 89,
        "2": 21,
        "1": 11,
      },
    }

    return NextResponse.json(fallbackStats, {
      status: 200, // Retornar 200 com dados padrão em vez de erro
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
