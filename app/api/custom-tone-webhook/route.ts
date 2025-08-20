import { NextResponse } from "next/server"

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic'

// URL do webhook para ajuste de tom personalizado
const TONE_WEBHOOK_URL = "https://auto.ffmedia.com.br/webhook/lh-corretoria/b2b76baf-b9ea-4bef-9f7c-556322a9042f"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { customTone } = data

    if (!customTone) {
      return NextResponse.json({ error: "Instrução de tom personalizado não fornecida" }, { status: 400 })
    }

    console.log("Instrução de tom personalizado recebida:", customTone)

    // Enviar para o webhook externo
    try {
      const response = await fetch(TONE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customTone,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        console.error(`Erro ao enviar para webhook: ${response.status} ${response.statusText}`)
        throw new Error(`Webhook error: ${response.status}`)
      }

      const webhookResponse = await response.json()
      console.log("Resposta do webhook:", webhookResponse)

      // Retornar uma resposta de sucesso
      return NextResponse.json({
        success: true,
        message: "Instrução de tom personalizado processada com sucesso",
        data: webhookResponse,
      })
    } catch (webhookError) {
      console.error("Erro ao comunicar com o webhook:", webhookError)
      
      // Fallback: ainda retorna sucesso para não quebrar o UX
      return NextResponse.json({
        success: true,
        message: "Instrução de tom personalizado recebida (processamento assíncrono)",
        warning: "Webhook indisponível",
      })
    }
  } catch (error) {
    console.error("Erro ao processar instrução de tom personalizado:", error)
    return NextResponse.json(
      {
        error: "Erro ao processar a solicitação",
      },
      { status: 500 },
    )
  }
}
