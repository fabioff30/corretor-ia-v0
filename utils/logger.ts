// Tipos para os logs
type RequestLogData = {
  status: number
  message?: string
  processingTime?: number
  textLength?: number
  ip: string
}

type ErrorLogData = {
  status: number
  message: string
  details?: string
  ip: string
}

/**
 * Registra informações sobre uma requisição
 * @param requestId ID único da requisição
 * @param data Dados da requisição
 */
export function logRequest(requestId: string, data: RequestLogData) {
  // Simplificar para apenas registrar no console, sem depender de variáveis de ambiente
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type: "request",
      requestId,
      ...data,
    }),
  )
}

/**
 * Registra informações sobre um erro
 * @param requestId ID único da requisição
 * @param data Dados do erro
 */
export function logError(requestId: string, data: ErrorLogData) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type: "error",
      requestId,
      ...data,
    }),
  )
}
