import { NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email/send"

export const maxDuration = 15

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 })
    }

    await sendWelcomeEmail({ to: { email, name }, name })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao enviar email de boas-vindas:", error)
    return NextResponse.json({ error: "Não foi possível enviar o email de boas-vindas." }, { status: 500 })
  }
}
