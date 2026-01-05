// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { addRating } from "@/utils/rating-stats"
import { storeRatingDetails } from "@/utils/rating-storage"
import { sendRatingNotification } from "@/utils/notifications"

// Esquema de validação para o feedback
const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
  correctionId: z.string().optional(),
  textLength: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Obter o corpo da requisição
    const body = await request.json()

    // Validar o corpo da requisição
    const result = feedbackSchema.safeParse(body)

    if (!result.success) {
      // Retornar erro de validação
      return NextResponse.json(
        {
          error: "Erro de validação",
          message: result.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      )
    }

    // Extrair os dados validados
    const { rating, feedback, correctionId, textLength } = result.data

    // Obter informações adicionais da requisição
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const timestamp = new Date().toISOString()

    // 1. Registrar a avaliação nas estatísticas agregadas
    const statsSuccess = await addRating(rating)
    if (!statsSuccess) {
      console.warn("Não foi possível registrar a avaliação nas estatísticas")
    }

    // 2. Armazenar os detalhes completos da avaliação no banco de dados
    const ratingId = await storeRatingDetails({
      rating,
      feedback,
      correctionId,
      textLength,
      timestamp,
      ip,
      userAgent,
    })

    if (!ratingId) {
      console.warn("Não foi possível armazenar os detalhes da avaliação")
    }

    // 3. Enviar notificação sobre a nova avaliação (não bloquear em caso de erro)
    try {
      await sendRatingNotification({
        rating,
        feedback,
        correctionId,
        textLength,
        timestamp,
        ip,
      })
    } catch (notificationError) {
      // Apenas registrar o erro, não interromper o fluxo principal
      console.warn("Erro ao enviar notificação:", notificationError)
    }

    // Retornar sucesso mesmo se a notificação falhar
    return NextResponse.json({ success: true, ratingId })
  } catch (error) {
    console.error("Erro ao processar feedback:", error)

    return NextResponse.json(
      {
        error: "Erro ao processar feedback",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
// @ts-nocheck
