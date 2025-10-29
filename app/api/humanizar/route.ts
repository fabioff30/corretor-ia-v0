import { type NextRequest, NextResponse } from "next/server"
import { logRequest } from "@/utils/logger"
import { HUMANIZAR_WEBHOOK_URL, HUMANIZAR_MAX_TEXT_LENGTH, HUMANIZAR_TIMEOUT } from "@/utils/constants"
import { parseRequestBody, validateTextLength } from "@/lib/api/shared-handlers"
import { callWebhook } from "@/lib/api/webhook-client"
import { handleGeneralError, handleWebhookError } from "@/lib/api/error-handlers"
import { getCurrentUserWithProfile, type AuthContext } from "@/utils/auth-helpers"
import { sendGTMEvent } from "@/utils/gtm-helper"

export const maxDuration = 120

// Health check endpoint (GET /api/humanizar)
export async function GET() {
  return NextResponse.json({ status: "OK" })
}

interface HumanizeResponse {
  humanizedText: string
  explanation: string
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  const cfRay = request.headers.get("cf-ray") || undefined

  // Parse request body
  const { body: requestBody, error: parseError } = await parseRequestBody(request, requestId)
  if (parseError) return parseError

  try {
    const { text, mode = "default" } = requestBody || {}

    // Verify authentication and premium plan
    const authContext: AuthContext = await getCurrentUserWithProfile()
    const { user, profile } = authContext

    if (!user || !profile) {
      return NextResponse.json(
        {
          error: "Não autorizado",
          message: "Usuário não autenticado",
          details: ["Faça login para usar este recurso"]
        },
        { status: 401 },
      )
    }

    if (profile.plan_type !== "pro" && profile.plan_type !== "admin") {
      return NextResponse.json(
        {
          error: "Acesso restrito",
          message: "É necessário um plano Premium ou Admin para humanizar textos.",
          details: ["Faça upgrade para um plano Premium ou Admin"]
        },
        { status: 403 },
      )
    }

    // Validate text
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        {
          error: "Texto inválido",
          message: "O campo 'text' é obrigatório",
          details: ["Envie um texto válido para humanização"]
        },
        { status: 400 }
      )
    }

    // Validate text length (20,000 characters max)
    const lengthError = validateTextLength(text, HUMANIZAR_MAX_TEXT_LENGTH, requestId, ip)
    if (lengthError) return lengthError

    // Validate mode
    const validModes = ["default", "academico", "jornalistico", "blog", "juridico"]
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        {
          error: "Modo inválido",
          message: `O modo deve ser um de: ${validModes.join(", ")}`,
          details: [`Modo fornecido: ${mode}`]
        },
        { status: 400 }
      )
    }

    console.log(`API: Processing humanization for premium user ${user.id}, text length: ${text.length}, mode: ${mode}`, requestId)

    // Call webhook with rewriteOnly=true
    const response = await callWebhook({
      url: HUMANIZAR_WEBHOOK_URL,
      text,
      requestId,
      additionalData: {
        mode,
        rewriteOnly: true,
      },
      timeout: HUMANIZAR_TIMEOUT,
    })

    console.log(`API: Webhook responded with status ${response.status}`, requestId)

    // Handle non-OK responses
    if (!response.ok) {
      return handleWebhookError(response, text, requestId, cfRay)
    }

    // Parse response
    const responseText = await response.text()
    console.log(`API: Received response text (length: ${responseText.length})`, requestId)

    let data: HumanizeResponse
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      console.error(`API: Failed to parse JSON response`, requestId, jsonError)
      return NextResponse.json(
        {
          error: "Resposta inválida",
          message: "Erro ao processar resposta do servidor",
          details: ["O servidor retornou uma resposta malformada"]
        },
        { status: 502 }
      )
    }

    // Validate response structure
    if (!data.humanizedText || !data.explanation) {
      console.error(`API: Invalid response structure`, requestId, data)
      return NextResponse.json(
        {
          error: "Resposta incompleta",
          message: "O servidor retornou uma resposta incompleta",
          details: ["Resposta não contém humanizedText ou explanation"]
        },
        { status: 502 }
      )
    }

    const processingTime = Date.now() - startTime

    // Log successful request
    logRequest(requestId, {
      status: 200,
      ip,
      textLength: text.length,
      mode,
      processingTime,
      userId: user.id,
      planType: profile.plan_type,
    })

    console.log(`API: Humanization completed successfully in ${processingTime}ms`, requestId)

    // Return response
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        ...(cfRay && { "CF-Ray": cfRay }),
        "X-Processing-Time": processingTime.toString(),
      },
    })
  } catch (error) {
    return handleGeneralError(error, requestId, ip, cfRay)
  }
}
