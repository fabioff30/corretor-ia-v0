/**
 * Safe Storage Adapter for Supabase Auth
 *
 * Previne o erro: TypeError: Cannot create property 'user' on string
 *
 * Este adapter intercepta todas as operações de leitura/escrita no localStorage
 * e automaticamente detecta e corrige sessões double-serialized (quando JSON.stringify
 * foi aplicado duas vezes, resultando em uma string ao invés de objeto).
 *
 * IMPORTANTE para iOS Safari:
 * - Safari ITP pode purgar localStorage após 7 dias de inatividade
 * - Private Browsing no Safari faz localStorage falhar silenciosamente
 * - Este adapter implementa fallback para sessionStorage quando localStorage falha
 */

// Flag para evitar logs duplicados em curto período
let lastLogTime = 0
const LOG_THROTTLE_MS = 5000

// In-memory storage como ultimo fallback
const memoryStorage: Map<string, string> = new Map()

// Cache do tipo de storage disponível
let availableStorageType: 'localStorage' | 'sessionStorage' | 'memory' | null = null

function throttledLog(level: 'log' | 'warn' | 'error', ...args: unknown[]) {
  const now = Date.now()
  if (now - lastLogTime < LOG_THROTTLE_MS) return
  lastLogTime = now
  console[level](...args)
}

/**
 * Verifica se um storage está disponível e funcional
 * Safari Private Browsing faz localStorage.setItem falhar silenciosamente
 */
function isStorageAvailable(storage: Storage): boolean {
  const testKey = '__supabase_storage_test__'
  try {
    storage.setItem(testKey, testKey)
    const retrieved = storage.getItem(testKey)
    storage.removeItem(testKey)
    return retrieved === testKey
  } catch {
    return false
  }
}

/**
 * Detecta qual storage está disponível
 * Ordem de preferência: localStorage > sessionStorage > memory
 */
function getAvailableStorageType(): 'localStorage' | 'sessionStorage' | 'memory' {
  // Usar cache se já detectado
  if (availableStorageType !== null) {
    return availableStorageType
  }

  if (typeof window === 'undefined') {
    availableStorageType = 'memory'
    return 'memory'
  }

  // Tentar localStorage primeiro
  try {
    if (typeof localStorage !== 'undefined' && isStorageAvailable(localStorage)) {
      availableStorageType = 'localStorage'
      return 'localStorage'
    }
  } catch {
    // localStorage não disponível
  }

  // Tentar sessionStorage como fallback
  try {
    if (typeof sessionStorage !== 'undefined' && isStorageAvailable(sessionStorage)) {
      throttledLog('warn', '[StorageAdapter] localStorage indisponível, usando sessionStorage (Safari Private Browsing?)')
      availableStorageType = 'sessionStorage'
      return 'sessionStorage'
    }
  } catch {
    // sessionStorage não disponível
  }

  // Último recurso: memória
  throttledLog('warn', '[StorageAdapter] Nenhum Web Storage disponível, usando memória (sessão não persistirá)')
  availableStorageType = 'memory'
  return 'memory'
}

/**
 * Obtém o storage apropriado baseado na disponibilidade
 */
function getStorage(): Storage | null {
  const type = getAvailableStorageType()

  if (type === 'localStorage') {
    return localStorage
  } else if (type === 'sessionStorage') {
    return sessionStorage
  }

  return null // Usa memória
}

/**
 * Operações de storage com fallback para memória
 */
function storageGet(key: string): string | null {
  const storage = getStorage()
  if (storage) {
    try {
      return storage.getItem(key)
    } catch {
      // Fallback para memória se der erro
      return memoryStorage.get(key) ?? null
    }
  }
  return memoryStorage.get(key) ?? null
}

function storageSet(key: string, value: string): void {
  const storage = getStorage()
  if (storage) {
    try {
      storage.setItem(key, value)
      return
    } catch {
      // Fallback para memória se der erro (ex: quota exceeded)
      throttledLog('warn', '[StorageAdapter] Erro ao salvar, usando memória como fallback')
    }
  }
  memoryStorage.set(key, value)
}

function storageRemove(key: string): void {
  const storage = getStorage()
  if (storage) {
    try {
      storage.removeItem(key)
    } catch {
      // Ignorar erro
    }
  }
  memoryStorage.delete(key)
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
   * Obtém um item do storage com proteção contra double-serialization
   * Usa fallback automatico: localStorage > sessionStorage > memory
   */
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null

    try {
      const value = storageGet(key)

      // Aplicar fix apenas para chaves de autenticação do Supabase
      if (key.includes('auth-token') || key.startsWith('sb-')) {
        const fixedValue = fixDoubleSerialization(value)

        // Se o valor foi corrigido, atualizar no storage
        if (fixedValue !== value && fixedValue !== null) {
          storageSet(key, fixedValue)
          throttledLog('log', '[StorageAdapter] Sessão corrigida e salva')
        } else if (fixedValue === null && value !== null) {
          // Valor era inválido, remover
          storageRemove(key)
          throttledLog('warn', '[StorageAdapter] Sessão inválida removida')
        }

        return fixedValue
      }

      return value
    } catch (error) {
      throttledLog('error', '[StorageAdapter] Erro ao ler storage:', error)
      return null
    }
  },

  /**
   * Armazena um item no storage com validação
   * Usa fallback automatico: localStorage > sessionStorage > memory
   */
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return

    try {
      const validatedValue = validateBeforeStore(key, value)
      storageSet(key, validatedValue)
    } catch (error) {
      throttledLog('error', '[StorageAdapter] Erro ao salvar no storage:', error)
    }
  },

  /**
   * Remove um item do storage
   */
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return

    try {
      storageRemove(key)
    } catch (error) {
      throttledLog('error', '[StorageAdapter] Erro ao remover do storage:', error)
    }
  },
}

/**
 * Função para executar limpeza proativa do storage
 * Chamada antes da inicialização do cliente Supabase
 */
export function cleanupCorruptedSessions(): void {
  if (typeof window === 'undefined') return

  try {
    const storage = getStorage()
    if (!storage) {
      // Usando memória, não há o que limpar
      return
    }

    const keysToCheck: string[] = []

    // Encontrar todas as chaves de autenticação do Supabase
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && (key.includes('auth-token') || key.startsWith('sb-'))) {
        keysToCheck.push(key)
      }
    }

    // Verificar e corrigir cada chave
    for (const key of keysToCheck) {
      const value = storage.getItem(key)
      if (!value) continue

      const fixedValue = fixDoubleSerialization(value)

      if (fixedValue !== value) {
        if (fixedValue === null) {
          storage.removeItem(key)
          console.log('[StorageAdapter] Removida sessão inválida:', key)
        } else {
          storage.setItem(key, fixedValue)
          console.log('[StorageAdapter] Corrigida sessão:', key)
        }
      }
    }

    // Log do tipo de storage em uso
    const storageType = getAvailableStorageType()
    if (storageType !== 'localStorage') {
      console.log(`[StorageAdapter] Usando ${storageType} como storage`)
    }
  } catch (error) {
    console.error('[StorageAdapter] Erro na limpeza proativa:', error)
  }
}

/**
 * Exporta informação sobre qual storage está em uso (para debug)
 */
export function getStorageInfo(): { type: string; available: boolean } {
  const type = getAvailableStorageType()
  return {
    type,
    available: type !== 'memory',
  }
}
