import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getPublicConfig } from "@/utils/env-config"
import { sendPasswordResetEmail } from "@/lib/email/send"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { email } = await request.json().catch(() => ({ email: null }))

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 })
    }

    const supabaseAdmin = createServiceRoleClient()

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    if (userError || !userData.user) {
      // Responder sucesso mesmo se usuário não existir para evitar enumeração
      return NextResponse.json({ success: true })
    }

    const { user } = userData

    const redirectTo = `${getPublicConfig().APP_URL}/resetar-senha`
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    })

    if (linkError || !linkData?.action_link) {
      console.error("Erro ao gerar link de recuperação:", linkError)
      return NextResponse.json({ error: "Não foi possível gerar o link de recuperação." }, { status: 500 })
    }

    await sendPasswordResetEmail({
      to: { email, name: user.user_metadata?.full_name || user.email },
      name: user.user_metadata?.full_name || user.email,
      resetLink: linkData.action_link,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar recuperação de senha:", error)
    return NextResponse.json({ error: "Não foi possível processar a solicitação." }, { status: 500 })
  }
}
