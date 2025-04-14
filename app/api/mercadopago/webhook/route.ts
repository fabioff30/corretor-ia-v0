import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("Mercado Pago webhook received:", JSON.stringify(body).substring(0, 200) + "...")

    // Extract payment information
    const { action, data } = body

    if (action === "payment.created" || action === "payment.updated") {
      const paymentId = data.id

      // Fetch payment details from Mercado Pago API
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
      if (!accessToken) {
        console.error("Mercado Pago access token not found")
        return NextResponse.json({ error: "Configuration error" }, { status: 500 })
      }

      try {
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!paymentResponse.ok) {
          throw new Error(`Failed to fetch payment details: ${paymentResponse.status}`)
        }

        const paymentData = await paymentResponse.json()

        // Store payment data in database or send to another service
        // This is where you would typically update your database
        console.log("Payment data:", JSON.stringify(paymentData).substring(0, 200) + "...")

        // You could also send an email confirmation here

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error("Error fetching payment details:", error)
        return NextResponse.json({ error: "Failed to process payment notification" }, { status: 500 })
      }
    }

    // For other webhook events
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
  }
}
