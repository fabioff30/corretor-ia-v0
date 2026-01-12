/**
 * Safe Storage Adapter for Supabase Auth
 *
 * Previne o erro: TypeError: Cannot create property 'user' on string
 *
 * Este adapter intercepta todas as operações de leitura/escrita no localStorage
 * e automaticamente detecta e corrige sessões double-serialized (quando JSON.stringify
 * foi aplicado duas vezes, resultando em uma string ao invés de objeto).
 */

// Flag para evitar logs duplicados em curto período
let lastLogTime = 0
const LOG_THROTTLE_MS = 5000

function throttledLog(level: 'log' | 'warn' | 'error', ...args: unknown[]) {
  const now = Date.now()
  if (now - lastLogTime < LOG_THROTTLE_MS) return
  lastLogTime = now
  console[level](...args)
}

/**
 * Detecta se um valor está double-serialized e retorna o valor corrigido
 *
 * Exemplos de double-serialization:
 * - '"{\"access_token\":\"...\",\"user\":{...}}"' (string JSON de uma string JSON)
 * - Quando JSON.parse retorna uma string ao invés de objeto
 */
function fixDoubleSerialization(value: string | null): string | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value)

    // Caso 1: O valor parseado ainda é uma string (double-serialization)
    if (typeof parsed === 'string') {
      try {
        const innerParsed = JSON.parse(parsed)

        // Verificar se é um objeto de sessão válido
        if (innerParsed && typeof innerParsed === 'object') {
          // Verificar se tem estrutura de sessão Supabase
          if (innerParsed.access_token || innerParsed.user || innerParsed.refresh_token) {
            throttledLog('warn', '[StorageAdapter] Corrigindo sessão double-serialized')

            // Retornar como JSON corretamente serializado (apenas uma vez)
            return JSON.stringify(innerParsed)
          }
        }
      } catch {
        // A string interna não é JSON válido
        throttledLog('warn', '[StorageAdapter] Valor interno não é JSON válido, removendo')
        return null
      }
    }

    // Caso 2: O valor é um objeto válido (não está corrompido)
    if (typeof parsed === 'object' && parsed !== null) {
      // Verificar se o objeto está bem formado para sessão
      if (parsed.access_token || parsed.user || parsed.refresh_token) {
        // Tudo OK, retornar valor original
        return value
      }
    }

    // Outros casos: retornar valor original
    return value
  } catch {
    // Valor não é JSON válido de forma alguma
    // Isso pode acontecer se localStorage foi corrompido por outra extensão
    throttledLog('warn', '[StorageAdapter] Valor não é JSON válido')
    return null
  }
}

/**
 * Valida se um valor está sendo armazenado corretamente
 * Previne que código bugado armazene valores double-serialized
 */
function validateBeforeStore(key: string, value: string): string {
  // Só validar chaves de autenticação do Supabase
  if (!key.includes('auth-token') && !key.startsWith('sb-')) {
    return value
  }

  try {
    const parsed = JSON.parse(value)

    // Se o valor parseado é uma string, alguém fez JSON.stringify duas vezes
    if (typeof parsed === 'string') {
      throttledLog('warn', '[StorageAdapter] Prevenindo double-serialization na escrita')

      // Log do stack trace para identificar origem (apenas em dev)
      if (process.env.NODE_ENV === 'development') {
        console.trace('[StorageAdapter] Stack trace da double-serialization:')
      }

      // Tentar extrair o objeto real
      try {
        const innerParsed = JSON.parse(parsed)
        if (innerParsed && typeof innerParsed === 'object') {
          return JSON.stringify(innerParsed)
        }
      } catch {
        // Não conseguiu parsear, usar valor original
      }
    }

    return value
  } catch {
    // Valor não é JSON, retornar como está
    return value
  }
}

/**
 * Storage adapter seguro para Supabase Auth
 * Implementa a interface esperada pelo Supabase SDK
 */
export const safeStorageAdapter = {
  /**
   * Obtém um item do localStorage com proteção contra double-serialization
   */
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null

    try {
      const value = localStorage.getItem(key)

      // Aplicar fix apenas para chaves de autenticação do Supabase
      if (key.includes('auth-token') || key.startsWith('sb-')) {
        const fixedValue = fixDoubleSerialization(value)

        // Se o valor foi corrigido, atualizar no localStorage
        if (fixedValue !== value && fixedValue !== null) {
          localStorage.setItem(key, fixedValue)
          throttledLog('log', '[StorageAdapter] Sessão corrigida e salva no localStorage')
        } else if (fixedValue === null && value !== null) {
          // Valor era inválido, remover
          localStorage.removeItem(key)
          throttledLog('warn', '[StorageAdapter] Sessão inválida removida do localStorage')
        }

        return fixedValue
      }

      return value
    } catch (error) {
      throttledLog('error', '[StorageAdapter] Erro ao ler localStorage:', error)
      return null
    }
  },

  /**
   * Armazena um item no localStorage com validação
   */
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return

    try {
      const validatedValue = validateBeforeStore(key, value)
      localStorage.setItem(key, validatedValue)
    } catch (error) {
      throttledLog('error', '[StorageAdapter] Erro ao salvar no localStorage:', error)
    }
  },

  /**
   * Remove um item do localStorage
   */
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(key)
    } catch (error) {
      throttledLog('error', '[StorageAdapter] Erro ao remover do localStorage:', error)
    }
  },
}

/**
 * Função para executar limpeza proativa do localStorage
 * Chamada antes da inicialização do cliente Supabase
 */
export function cleanupCorruptedSessions(): void {
  if (typeof window === 'undefined') return

  try {
    const keysToCheck: string[] = []

    // Encontrar todas as chaves de autenticação do Supabase
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('auth-token') || key.startsWith('sb-'))) {
        keysToCheck.push(key)
      }
    }

    // Verificar e corrigir cada chave
    for (const key of keysToCheck) {
      const value = localStorage.getItem(key)
      if (!value) continue

      const fixedValue = fixDoubleSerialization(value)

      if (fixedValue !== value) {
        if (fixedValue === null) {
          localStorage.removeItem(key)
          console.log('[StorageAdapter] Removida sessão inválida:', key)
        } else {
          localStorage.setItem(key, fixedValue)
          console.log('[StorageAdapter] Corrigida sessão:', key)
        }
      }
    }
  } catch (error) {
    console.error('[StorageAdapter] Erro na limpeza proativa:', error)
  }
}
