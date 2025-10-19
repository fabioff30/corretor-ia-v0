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

    // Buscar todos os usuários e filtrar por email
    // Nota: Na v2.x, listUsers() retorna uma página de usuários
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError || !users || users.length === 0) {
      // Responder sucesso mesmo se não houver usuários para evitar enumeração
      return NextResponse.json({ success: true })
    }

    // Filtrar usuário por email
    const user = users.find(u => u.email === email)

    if (!user) {
      // Responder sucesso mesmo se usuário não existir para evitar enumeração
      return NextResponse.json({ success: true })
    }

    const redirectTo = `${getPublicConfig().APP_URL}/resetar-senha`
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    })

    if (linkError || !linkData) {
      console.error("Erro ao gerar link de recuperação:", linkError)
      return NextResponse.json({ success: true }) // Responder sucesso para evitar enumeração
    }

    // Extrai o link de recuperação da resposta
    // generateLink retorna { user, properties: { action_link, ... } }
    const actionLink = (linkData as any)?.properties?.action_link || (linkData as any)?.action_link

    if (!actionLink) {
      console.error("Link de ação não encontrado na resposta do Supabase")
      return NextResponse.json({ success: true }) // Responder sucesso para evitar enumeração
    }

    try {
      await sendPasswordResetEmail({
        to: { email, name: user.user_metadata?.full_name || user.email },
        name: user.user_metadata?.full_name || user.email,
        resetLink: actionLink,
      })
    } catch (emailError) {
      console.error("Erro ao enviar email de recuperação:", emailError)
      // Ainda assim respondemos sucesso já que o link foi gerado
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar recuperação de senha:", error)
    return NextResponse.json({ error: "Não foi possível processar a solicitação." }, { status: 500 })
  }
}
