import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    name: "Corretor de Texto API",
    version: "1.0.0",
    status: "online",
  })
}
