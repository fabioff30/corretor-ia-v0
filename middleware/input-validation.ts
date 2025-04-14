import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Atualizar o esquema de validação para incluir o tom
const correctionRequestSchema = z.object({
  text: z
    .string()
    .min(1, "O texto não pode estar vazio")
    .max(5000, "O texto não pode exceder 5000 caracteres")
    .refine((text) => {
      // Verificar se o texto contém conteúdo suspeito
      const suspiciousPatterns = [
        /<script>/i,
        /javascript:/i,
        /onerror=/i,
        /onload=/i,
        /eval\(/i,
        /document\.cookie/i,
        /fetch\(/i,
        /localStorage/i,
        /sessionStorage/i,
      ]

      return !suspiciousPatterns.some((pattern) => pattern.test(text))
    }, "O texto contém conteúdo não permitido"),
  isMobile: z.boolean().optional(),
  tone: z.string().optional(),
})

export async function validateInput(req: NextRequest) {
  try {
    const body = await req.json()
    const result = correctionRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Erro de validação",
          message: result.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      )
    }

    return result.data
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao validar entrada",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 400 },
    )
  }
}
