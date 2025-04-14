import { NextResponse } from "next/server"
import { isValidMercadoPagoToken } from "@/utils/payment-utils"

export async function GET() {
  try {
    // Get the public key from environment variables
    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY

    // Validate the key
    if (!publicKey) {
      console.error("Mercado Pago public key not found in environment variables")
      return NextResponse.json({ error: "Payment service configuration missing" }, { status: 500 })
    }

    // Check if the key has the correct format
    if (!isValidMercadoPagoToken(publicKey)) {
      console.error("Mercado Pago public key has invalid format")
      return NextResponse.json({ error: "Payment service configuration invalid" }, { status: 500 })
    }

    // Return the public key securely
    return NextResponse.json({ publicKey })
  } catch (error) {
    console.error("Error retrieving Mercado Pago configuration:", error)
    return NextResponse.json({ error: "Failed to retrieve payment configuration" }, { status: 500 })
  }
}
