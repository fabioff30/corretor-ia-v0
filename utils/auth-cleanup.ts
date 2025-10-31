/**
 * Utilitário para limpar cookies e storage inválidos de autenticação
 * Previne loops de refresh_token causados por cookies expirados/inválidos
 */

import { supabase } from '@/lib/supabase/client'

const CLEANUP_FLAG_KEY = 'auth_cleanup_done'
const CLEANUP_VERSION = '3' // Incrementado para forçar nova limpeza sem signOut()

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
 * Verifica se precisa fazer limpeza automática e executa se necessário
 * Roda apenas uma vez por versão de limpeza
 */
export async function checkAndCleanup(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
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
