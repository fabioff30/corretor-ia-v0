/**
 * Verifica se as credenciais do Mercado Pago estão configuradas
 */
export function checkMercadoPagoCredentials(): { isConfigured: boolean; missingCredentials: string[] } {
  const missingCredentials: string[] = []

  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    missingCredentials.push("MERCADO_PAGO_ACCESS_TOKEN")
  }

  if (!process.env.MERCADO_PAGO_PUBLIC_KEY) {
    missingCredentials.push("MERCADO_PAGO_PUBLIC_KEY")
  }

  return {
    isConfigured: missingCredentials.length === 0,
    missingCredentials,
  }
}

/**
 * Verifica se um token do Mercado Pago é válido
 * @param token Token a ser verificado
 */
export function isValidMercadoPagoToken(token: string): boolean {
  // Tokens de produção começam com APP_USR-
  // Tokens de teste começam com TEST-
  return token.startsWith("APP_USR-") || token.startsWith("TEST-")
}
