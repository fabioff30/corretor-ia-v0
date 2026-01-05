// @ts-nocheck
/**
 * API Route: Update dashboard profile information
 * PATCH /api/dashboard/profile
 *
 * Allows authenticated users to update personal profile data
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"
import { createServiceRoleClient } from "@/lib/supabase/server"

const updateSchema = z.object({
  full_name: z
    .string({
      required_error: "Nome é obrigatório",
      invalid_type_error: "Nome inválido",
    })
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
})

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const json = await request.json().catch(() => null)
    const parseResult = updateSchema.safeParse(json)

    if (!parseResult.success) {
      const [issue] = parseResult.error.issues
      return NextResponse.json({ error: issue.message }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { full_name } = parseResult.data

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error || !data) {
      console.error("Erro ao atualizar perfil:", error)
      return NextResponse.json(
        { error: "Não foi possível atualizar o perfil" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      profile: data,
    })
  } catch (error) {
    console.error("Erro inesperado em PATCH /api/dashboard/profile:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
// @ts-nocheck
