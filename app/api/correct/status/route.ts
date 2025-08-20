import { NextResponse } from "next/server"

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic'

// URL do webhook do n8n
const WEBHOOK_URL = "https://auto.ffmedia.com.br/webhook/webapp-tradutor"

export async function GET() {
  try {
    // Verificar se o webhook está online
    const response = await fetch(WEBHOOK_URL, {
      method: "HEAD",
      cache: "no-store",
    })

    if (response.ok) {
      return NextResponse.json({ status: "online" })
    } else {
      return NextResponse.json({ status: "offline" }, { status: 503 })
    }
  } catch (error) {
    console.error("Erro ao verificar status do webhook:", error)
    return NextResponse.json(
      { status: "offline", error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 503 },
    )
  }
}
