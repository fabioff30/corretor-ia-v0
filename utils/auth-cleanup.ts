/**
 * Utilitário para limpar cookies e storage inválidos de autenticação
 * Previne loops de refresh_token causados por cookies expirados/inválidos
 */

import { supabase } from '@/lib/supabase/client'

const CLEANUP_FLAG_KEY = 'auth_cleanup_done'
const CLEANUP_VERSION = '4' // Incrementado para forçar nova limpeza + detecção de sessão corrompida
const CORRUPTION_FIX_FLAG = 'auth_corruption_fix_done'

/**
 * Limpa todos os cookies e storage relacionados à autenticação do Supabase
 * IMPORTANTE: Não chama signOut() para evitar disparar eventos de auth que causam loops
 */
export async function forceAuthCleanup(): Promise<void> {
  console.log('[AuthCleanup] Iniciando limpeza forçada de autenticação...')

  try {
    // NOTA: NÃO chamamos supabase.auth.signOut() aqui porque isso dispara eventos
    // de auth (SIGNED_OUT) que tentam refresh de tokens já limpos, causando loop 429

    // 1. Limpar localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('supabase.') ||
          key.startsWith('sb-') ||
          key.includes('auth-token') ||
          key === 'user-plan-type'
        )) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log('[AuthCleanup] Removidos', keysToRemove.length, 'itens do localStorage')

      // 2. Limpar sessionStorage
      sessionStorage.clear()

      // 3. Limpar cookies via JavaScript (sem disparar eventos Supabase)
      const cookies = document.cookie.split(';')
      const hostname = window.location.hostname
      const baseDomain = hostname.replace(/^www\./, '')
      const secureAttr = window.location.protocol === 'https:' ? 'Secure; ' : ''

      const domainVariants = Array.from(new Set([
        hostname,
        baseDomain,
      ].filter(Boolean)))

      const domainVariantsWithDot = domainVariants
        .map(domain => (domain.startsWith('.') ? domain : `.${domain}`))
        .filter(Boolean)

      const allDomainVariants = Array.from(new Set([...domainVariants, ...domainVariantsWithDot]))

      const pathVariants = ['/', '']

      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()

        if (name.startsWith('sb-')) {
          // Primeiro, remover sem Domain (host atual)
          pathVariants.forEach(path => {
            const pathAttr = `Path=${path || '/'}; `
            document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${pathAttr}${secureAttr}SameSite=Lax`
          })

          // Depois, remover usando diferentes variantes de domínio
          allDomainVariants.forEach(domain => {
            pathVariants.forEach(path => {
              const pathAttr = `Path=${path || '/'}; `
              document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${pathAttr}Domain=${domain}; ${secureAttr}SameSite=Lax`
            })
          })
        }
      })

      console.log('[AuthCleanup] Cookies limpos')
    }

    console.log('[AuthCleanup] Limpeza concluída com sucesso')
  } catch (error) {
    console.error('[AuthCleanup] Erro durante limpeza:', error)
    // Não propagar erro - continuar execução da aplicação
  }
}

/**
 * Detecta e corrige sessões Supabase armazenadas como string JSON em vez de objeto
 * Isso ocorre quando há double-serialization (JSON.stringify aplicado duas vezes)
 *
 * Erro que isso previne:
 * TypeError: Cannot create property 'user' on string '{"access_token":"...","user":{...}}'
 *
 * @returns true se uma sessão corrompida foi detectada e tratada
 */
export function detectAndFixCorruptedSession(): boolean {
  if (typeof window === 'undefined') return false

  try {
    // Extrair o projectRef da URL do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1]

    if (!projectRef) {
      console.warn('[AuthCleanup] Não foi possível extrair projectRef da SUPABASE_URL')
      return false
    }

    const storageKey = `sb-${projectRef}-auth-token`
    const stored = localStorage.getItem(storageKey)

    if (!stored) return false

    // Verificar se é uma string que contém JSON serializado duas vezes
    // Exemplo: '"{\\"access_token\\":\\"...\\"}"' (string dentro de string)
    if (stored.startsWith('"') && stored.endsWith('"')) {
      console.warn('[AuthCleanup] Detectada sessão double-serializada, tentando corrigir...')
      try {
        const parsed = JSON.parse(stored) // Remove primeira camada de serialização
        if (typeof parsed === 'string') {
          // Ainda é string, tenta parsear novamente
          const session = JSON.parse(parsed) // Remove segunda camada
          if (session && typeof session === 'object' && session.access_token) {
            // Sessão válida encontrada, corrigir no storage
            localStorage.setItem(storageKey, JSON.stringify(session))
            console.log('[AuthCleanup] Sessão double-serializada corrigida com sucesso')
            return true
          }
        }
      } catch {
        // Se não conseguir corrigir, limpar completamente
        console.warn('[AuthCleanup] Não foi possível corrigir sessão, removendo...')
        localStorage.removeItem(storageKey)
        return true
      }
    }

    // Verificar se o valor parseado é uma string (em vez de objeto)
    try {
      const parsed = JSON.parse(stored)
      if (typeof parsed === 'string') {
        console.warn('[AuthCleanup] Sessão armazenada como string, tentando re-parse...')
        try {
          const session = JSON.parse(parsed)
          if (session && typeof session === 'object' && session.access_token) {
            localStorage.setItem(storageKey, JSON.stringify(session))
            console.log('[AuthCleanup] Sessão re-parseada com sucesso')
            return true
          }
        } catch {
          // String não é JSON válido, remover
          localStorage.removeItem(storageKey)
          return true
        }
      }
    } catch {
      // Valor não é JSON válido, remover para evitar erros
      console.warn('[AuthCleanup] Sessão com formato inválido, removendo...')
      localStorage.removeItem(storageKey)
      return true
    }

    return false
  } catch (error) {
    console.error('[AuthCleanup] Erro ao verificar sessão corrompida:', error)
    return false
  }
}

/**
 * Verifica se precisa fazer limpeza automática e executa se necessário
 * Roda apenas uma vez por versão de limpeza
 */
export async function checkAndCleanup(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    // IMPORTANTE: Detectar e corrigir sessão corrompida ANTES de qualquer operação
    // Isso previne o erro "Cannot create property 'user' on string"
    const wasCorrupted = detectAndFixCorruptedSession()
    if (wasCorrupted) {
      console.log('[AuthCleanup] Sessão corrompida foi tratada')
      // Não recarregar automaticamente - deixar o Supabase reinicializar naturalmente
      // O fix já foi aplicado no localStorage
    }

    const lastCleanup = localStorage.getItem(CLEANUP_FLAG_KEY)

    // Se já fez limpeza nesta versão, pular
    if (lastCleanup === CLEANUP_VERSION) {
      return
    }

    console.log('[AuthCleanup] Executando limpeza automática (versão', CLEANUP_VERSION, ')')

    // Executar limpeza
    await forceAuthCleanup()

    // Marcar como feito
    localStorage.setItem(CLEANUP_FLAG_KEY, CLEANUP_VERSION)

  } catch (error) {
    console.error('[AuthCleanup] Erro em checkAndCleanup:', error)
  }
}

/**
 * Detecta se está em loop de refresh e força limpeza
 */
export class RefreshLoopDetector {
  private static refreshCount = 0
  private static lastReset = Date.now()
  private static readonly MAX_REFRESHES = 5
  private static readonly TIME_WINDOW = 30000 // 30 segundos

  static recordRefresh(): void {
    const now = Date.now()

    // Reset contador se passou tempo suficiente
    if (now - this.lastReset > this.TIME_WINDOW) {
      this.refreshCount = 0
      this.lastReset = now
    }

    this.refreshCount++

    // Se houver muitos refreshes, forçar limpeza
    if (this.refreshCount >= this.MAX_REFRESHES) {
      console.error('[RefreshLoopDetector] Loop detectado! Forçando limpeza...')
      this.reset()
      forceAuthCleanup().then(() => {
        // Recarregar página após limpeza
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      })
    }
  }

  static reset(): void {
    this.refreshCount = 0
    this.lastReset = Date.now()
  }
}

/**
 * Monitora erros de autenticação do Supabase e limpa se necessário
 */
export function monitorAuthErrors(): void {
  if (typeof window === 'undefined') return

  // Interceptar erros globais para detectar o TypeError específico de sessão corrompida
  const originalOnError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    // Detectar o erro específico: Cannot create property 'user' on string
    if (
      typeof message === 'string' &&
      message.includes("Cannot create property 'user' on string")
    ) {
      console.error('[AuthCleanup] Detectado erro de sessão corrompida via onerror, limpando...')
      forceAuthCleanup().then(() => {
        // Recarregar após limpeza para reinicializar o Supabase
        setTimeout(() => window.location.reload(), 500)
      })
      return true // Prevenir propagação do erro
    }
    // Chamar handler original se existir
    return originalOnError?.call(window, message, source, lineno, colno, error) ?? false
  }

  // Interceptar unhandled rejections (erros em promises)
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || String(event.reason)
    if (errorMessage.includes("Cannot create property 'user' on string")) {
      console.error('[AuthCleanup] Detectado erro de sessão corrompida via promise rejection, limpando...')
      event.preventDefault() // Prevenir log do erro
      forceAuthCleanup().then(() => {
        setTimeout(() => window.location.reload(), 500)
      })
    }
  })

  // Interceptar fetch para detectar 429 do Supabase
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const response = await originalFetch(...args)

    // Detectar 429 em endpoints de auth do Supabase
    if (
      response.status === 429 &&
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('supabase.co/auth/v1/token')
    ) {
      console.warn('[AuthCleanup] Detectado 429 em refresh_token, registrando...')
      RefreshLoopDetector.recordRefresh()
    }

    return response
  }
}
