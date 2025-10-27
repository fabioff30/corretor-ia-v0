/**
 * API Route: Sync authenticated user profile
 * POST /api/profiles/sync
 *
 * Cria (ou atualiza) um profile usando service role quando a linha não existe.
 */

import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/utils/auth-helpers"

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    const { error: creationError } = await supabase.rpc("create_profile_for_user", {
      user_id: user.id,
    })

    if (creationError) {
      console.error("Erro ao criar perfil via RPC:", creationError)
      return NextResponse.json(
        { error: "Não foi possível criar o perfil" },
        { status: 500 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError || !profile) {
      console.error("Perfil não encontrado após criação:", profileError)
      return NextResponse.json(
        { error: "Perfil não encontrado após criação" },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error("Erro inesperado em POST /api/profiles/sync:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
