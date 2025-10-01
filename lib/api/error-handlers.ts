import { NextResponse } from "next/server"
import { logError, logRequest } from "@/utils/logger"

/**
 * Creates a fallback response when processing fails
 */
export function createFallbackResponse(originalText: string, type: "correction" | "rewrite" = "correction") {
  const textKey = type === "rewrite" ? "rewrittenText" : "correctedText"

  return {
    [textKey]: originalText,
    evaluation: {
      strengths: ["O texto foi processado parcialmente"],
      weaknesses: [`Não foi possível realizar uma ${type === "rewrite" ? "reescrita" : "correção"} completa devido a um erro no serviço`],
      suggestions: [
        "Tente novamente mais tarde ou com um texto menor",
        "Verifique se o texto contém caracteres especiais ou formatação complexa",
      ],
      score: 5,
    },
  }
}

/**
 * Handles webhook response errors
 */
export function handleWebhookError(
  response: Response,
  requestId: string,
  ip: string
): NextResponse {
  logError(requestId, {
    status: response.status,
    message: `Webhook error: ${response.statusText}`,
    ip,
  })

  throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`)
}

/**
 * Handles timeout errors
 */
export function handleTimeoutError(): NextResponse {
  return NextResponse.json(
    {
      error: "Tempo limite excedido",
      message: "O servidor demorou muito para responder. Por favor, tente novamente com um texto menor ou mais tarde.",
      code: "TIMEOUT_ERROR",
    },
    { status: 504 }
  )
}

/**
 * Handles general errors with fallback
 */
export function handleGeneralError(
  error: Error,
  requestId: string,
  ip: string,
  originalText: string,
  startTime: number,
  type: "correction" | "rewrite" = "correction"
): NextResponse {
  console.error("API: Error processing request:", error, requestId)

  try {
    const fallbackResponse = createFallbackResponse(originalText, type)
    console.log("API: Using fallback response due to general error", requestId)

    logRequest(requestId, {
      status: 200,
      processingTime: Date.now() - startTime,
      textLength: originalText.length,
      ip,
      fallbackUsed: true,
      generalError: error.message,
    })

    return NextResponse.json(fallbackResponse)
  } catch (fallbackError) {
    console.error("API: Error creating fallback response:", fallbackError, requestId)

    logError(requestId, {
      status: error.name === "AbortError" ? 504 : 500,
      message: error.message || "Unknown error",
      stack: error.stack,
      ip,
    })

    if (error.name === "AbortError") {
      return handleTimeoutError()
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        message: "Erro ao processar o texto. Por favor, verifique se o texto contém apenas caracteres válidos e tente novamente.",
        code: "GENERAL_ERROR",
      },
      { status: 500 }
    )
  }
}
