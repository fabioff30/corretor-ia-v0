import { NextResponse } from "next/server"
import { checkMercadoPagoCredentials, isValidMercadoPagoToken } from "@/utils/payment-utils"

export async function POST(request: Request) {
  try {
    // Verificar se as credenciais do Mercado Pago estão configuradas
    const { isConfigured, missingCredentials } = checkMercadoPagoCredentials()
    if (!isConfigured) {
      console.error(`Credenciais do Mercado Pago ausentes: ${missingCredentials.join(", ")}`)
      return NextResponse.json(
        {
          error: "Configuração do Mercado Pago incompleta",
          details: `Credenciais ausentes: ${missingCredentials.join(", ")}`,
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { title, price, quantity = 1, donorName, donorEmail } = body

    if (!title || !price) {
      return NextResponse.json({ error: "Título e preço são obrigatórios" }, { status: 400 })
    }

    // Obter a URL base da aplicação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://corretordetextoonline.com.br"

    // Add more detailed logging and error handling for the Mercado Pago token
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error("Token do Mercado Pago não encontrado nas variáveis de ambiente")
      return NextResponse.json(
        { error: "Configuração do Mercado Pago ausente", details: "Token de acesso não configurado" },
        { status: 500 },
      )
    }

    // Verificar se o token tem o formato correto
    if (!isValidMercadoPagoToken(accessToken)) {
      console.error("Token do Mercado Pago com formato inválido")
      return NextResponse.json(
        {
          error: "Token do Mercado Pago inválido",
          details: "O token não está no formato esperado (deve começar com APP_USR- ou TEST-)",
        },
        { status: 500 },
      )
    }

    // Log a masked version of the token for debugging (only first and last 4 chars)
    const maskedToken =
      accessToken.length > 10
        ? `${accessToken.substring(0, 4)}...${accessToken.substring(accessToken.length - 4)}`
        : "****"
    console.log(`Usando token do Mercado Pago: ${maskedToken}`)

    // Em vez de usar o SDK, vamos fazer uma chamada direta à API do Mercado Pago
    // Isso evita o erro "f.headers.raw is not a function"
    const mpApiUrl = "https://api.mercadopago.com/checkout/preferences"

    // Add more detailed logging
    console.log("Creating Mercado Pago preference with data:", body)

    const preferenceData = {
      items: [
        {
          id: "donation-" + Date.now(),
          title: title,
          quantity: quantity,
          unit_price: Number(price),
          currency_id: "BRL",
        },
      ],
      back_urls: {
        success: `${baseUrl}/apoiar/sucesso`,
        failure: `${baseUrl}/apoiar/falha`,
        pending: `${baseUrl}/apoiar/pendente`,
      },
      auto_return: "approved",
      statement_descriptor: "CorretorIA",
      payer: {
        name: donorName || "",
        email: donorEmail || "",
      },
      metadata: {
        donation_type: "support",
        platform: "website",
      },
      // Add payment methods configuration
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 1,
      },
    }

    try {
      // When making the API call, ensure we're using the correct headers
      const response = await fetch(mpApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Idempotency-Key": `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`, // Add idempotency key for retries
        },
        body: JSON.stringify(preferenceData),
      })

      // Improve error handling for API responses
      if (!response.ok) {
        let errorDetails = ""
        try {
          const errorResponse = await response.json()
          errorDetails = JSON.stringify(errorResponse)
          console.error("Erro detalhado do Mercado Pago:", errorDetails)
        } catch (e) {
          const errorText = await response.text()
          errorDetails = errorText
          console.error("Erro na resposta do Mercado Pago (texto):", errorText)
        }

        return NextResponse.json(
          {
            error: `Erro na API do Mercado Pago: ${response.status} ${response.statusText}`,
            details: errorDetails,
            suggestion: "Verifique se o token de acesso está válido e tem as permissões necessárias.",
          },
          { status: response.status },
        )
      }

      const result = await response.json()
      console.log("Mercado Pago preference created successfully:", result.id)

      // Retornar o ID da preferência e o URL de inicialização
      return NextResponse.json({
        preferenceId: result.id,
        initPoint: result.init_point,
      })
    } catch (apiError) {
      console.error("Erro na API do Mercado Pago:", apiError)
      return NextResponse.json(
        {
          error: "Erro na API do Mercado Pago",
          details: apiError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao criar preferência:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar preferência de pagamento",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
