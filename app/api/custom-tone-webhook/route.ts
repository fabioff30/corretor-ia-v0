import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { customTone } = data

    if (!customTone) {
      return NextResponse.json({ error: "Instrução de tom personalizado não fornecida" }, { status: 400 })
    }

    // Aqui você pode processar a instrução de tom personalizado
    // Por exemplo, armazenar em um banco de dados ou enviar para outro serviço

    console.log("Instrução de tom personalizado recebida:", customTone)

    // Retornar uma resposta de sucesso
    return NextResponse.json({
      success: true,
      message: "Instrução de tom personalizado recebida com sucesso",
    })
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
