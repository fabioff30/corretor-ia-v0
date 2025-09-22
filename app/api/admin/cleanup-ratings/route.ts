import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { cleanupRedisRatings, addSampleRatings } from "@/utils/cleanup-redis"

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação admin
    await requireAdmin()

    const { action } = await request.json()

    if (action === 'cleanup') {
      const success = await cleanupRedisRatings()
      return NextResponse.json({
        success,
        message: success ? "Dados limpos com sucesso" : "Erro ao limpar dados"
      })
    } else if (action === 'add-samples') {
      const success = await addSampleRatings()
      return NextResponse.json({
        success,
        message: success ? "Dados de exemplo adicionados" : "Erro ao adicionar dados"
      })
    } else if (action === 'reset') {
      // Limpar e adicionar dados de exemplo
      const cleanup = await cleanupRedisRatings()
      if (cleanup) {
        const samples = await addSampleRatings()
        return NextResponse.json({
          success: samples,
          message: samples ? "Redis resetado com dados de exemplo" : "Erro ao adicionar dados de exemplo"
        })
      } else {
        return NextResponse.json({
          success: false,
          message: "Erro ao limpar dados"
        })
      }
    }

    return NextResponse.json({
      success: false,
      message: "Ação inválida"
    }, { status: 400 })

  } catch (error) {
    console.error("Erro na limpeza de ratings:", error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: "Erro interno", message: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    )
  }
}