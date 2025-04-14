import { NextResponse } from "next/server"
import { getRatingStats } from "@/utils/rating-stats"

export async function GET() {
  try {
    const stats = await getRatingStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erro ao obter estatísticas de avaliação:", error)
    return NextResponse.json(
      {
        error: "Erro ao obter estatísticas de avaliação",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
