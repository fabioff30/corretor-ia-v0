/**
 * Utilitários para formatação e validação de números de telefone brasileiros
 */

/**
 * Formata um número de telefone brasileiro para exibição
 * @param value String com números (pode conter formatação)
 * @returns String formatada como (XX) XXXXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '')

  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limited = numbers.slice(0, 11)

  // Formata: (XX) XXXXX-XXXX
  if (limited.length <= 2) return limited
  if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
}

/**
 * Normaliza um número de telefone para envio à API (formato E.164)
 * @param phone Número de telefone (formatado ou não)
 * @returns String com código do país (55) + DDD + número (13 dígitos)
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove formatação
  const numbers = phone.replace(/\D/g, '')

  // Se já tem 13 dígitos com código do país, retorna como está
  if (numbers.length === 13 && numbers.startsWith('55')) {
    return numbers
  }

  // Se tem 11 dígitos (DDD + número), adiciona código do país
  if (numbers.length === 11) {
    return `55${numbers}`
  }

  // Retorna o que tiver (pode ser inválido, mas deixa a API validar)
  return numbers
}

/**
 * Valida se é um número de celular brasileiro válido
 * @param phone Número de telefone (formatado ou não)
 * @returns true se for um celular válido (11 dígitos, começando com 9)
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, '')

  // Deve ter 11 dígitos (DDD + 9 dígitos)
  if (numbers.length !== 11) return false

  // O terceiro dígito (primeiro do número) deve ser 9 (celular)
  if (numbers[2] !== '9') return false

  // DDD deve estar entre 11 e 99
  const ddd = parseInt(numbers.slice(0, 2), 10)
  if (ddd < 11 || ddd > 99) return false

  return true
}

/**
 * Extrai apenas os números de uma string
 * @param value String com números e outros caracteres
 * @returns String apenas com números
 */
export function extractNumbers(value: string): string {
  return value.replace(/\D/g, '')
}
