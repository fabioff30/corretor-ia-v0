'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * SessionRefreshProvider
 *
 * Provider que garante refresh proativo da sessao quando:
 * 1. A aba volta do background (visibilitychange)
 * 2. O usuario retorna apos inatividade
 * 3. Periodicamente (importante para iOS Safari)
 * 4. Evento pageshow (mais confiavel que visibilitychange no iOS)
 *
 * Isso resolve o problema de sessoes expirando quando o usuario
 * deixa a aba em background por muito tempo.
 *
 * NOTA: iOS Safari tem problemas conhecidos com visibilitychange
 * nao disparando corretamente quando o usuario troca de apps.
 */

/**
 * Detecta se o navegador e iOS Safari
 * iOS Safari tem comportamentos especificos com eventos de visibilidade
 */
function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  // Safari (exclui Chrome, Firefox, etc no iOS)
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua)
  return isIOS && isSafari
}

/**
 * Detecta se e um dispositivo iOS (qualquer navegador)
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

interface SessionRefreshProviderProps {
  children: ReactNode
}

export function SessionRefreshProvider({ children }: SessionRefreshProviderProps) {
  const lastRefreshRef = useRef<number>(Date.now())
  const isRefreshingRef = useRef<boolean>(false)

  useEffect(() => {
    // iOS Safari precisa de refresh mais frequente devido a bugs com visibilitychange
    const isIOSDevice = isIOS()
    const isIOSSafariBrowser = isIOSSafari()

    // Intervalo minimo entre refreshes
    // iOS Safari: 2 minutos (eventos de visibilidade sao menos confiaveis)
    // Outros: 5 minutos
    const MIN_REFRESH_INTERVAL_MS = isIOSSafariBrowser ? 2 * 60 * 1000 : 5 * 60 * 1000

    // Intervalo para refresh periodico (importante para iOS)
    // iOS: 3 minutos | Outros: 4 minutos
    const PERIODIC_REFRESH_INTERVAL_MS = isIOSDevice ? 3 * 60 * 1000 : 4 * 60 * 1000

    const refreshSession = async (source?: string) => {
      // Evitar refreshes simultaneos
      if (isRefreshingRef.current) {
        return
      }

      // Evitar refresh muito frequente
      const timeSinceLastRefresh = Date.now() - lastRefreshRef.current
      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
        return
      }

      isRefreshingRef.current = true

      try {
        // Verificar se ha cookies de sessao antes de tentar refresh
        const hasSupabaseCookies = document.cookie
          .split(';')
          .some(c => c.trim().startsWith('sb-'))

        if (!hasSupabaseCookies) {
          // Sem cookies, nao ha sessao para refresh
          return
        }

        // getSession() verifica e faz refresh automatico se necessario
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('[SessionRefresh] Error refreshing session:', error.message)
          return
        }

        if (session) {
          lastRefreshRef.current = Date.now()
          console.log(`[SessionRefresh] Session refreshed successfully (source: ${source || 'unknown'})`)
        }
      } catch (err) {
        console.warn('[SessionRefresh] Unexpected error:', err)
      } finally {
        isRefreshingRef.current = false
      }
    }

    // Refresh quando aba volta do background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[SessionRefresh] Tab became visible, checking session...')
        refreshSession('visibilitychange')
      }
    }

    // Refresh quando janela ganha foco
    const handleFocus = () => {
      console.log('[SessionRefresh] Window focused, checking session...')
      refreshSession('focus')
    }

    // pageshow e mais confiavel que visibilitychange no iOS Safari
    // Dispara quando a pagina e restaurada do bfcache (back-forward cache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('[SessionRefresh] Page restored from bfcache, checking session...')
        refreshSession('pageshow-bfcache')
      } else if (isIOSSafariBrowser) {
        // No iOS Safari, tambem fazer refresh em pageshow normal
        console.log('[SessionRefresh] pageshow event (iOS Safari), checking session...')
        refreshSession('pageshow-ios')
      }
    }

    // Listener para detectar quando token foi refreshed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED' && session) {
          lastRefreshRef.current = Date.now()
          console.log('[SessionRefresh] Token refreshed via auth state change')
        }
      }
    )

    // Adicionar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handlePageShow)

    // Refresh periodico - CRITICO para iOS Safari
    // Nao depende de eventos do browser que podem nao disparar
    const periodicRefreshInterval = setInterval(() => {
      // So faz refresh periodico se a aba estiver visivel
      if (document.visibilityState === 'visible') {
        console.log('[SessionRefresh] Periodic refresh check...')
        refreshSession('periodic')
      }
    }, PERIODIC_REFRESH_INTERVAL_MS)

    // Log inicial
    if (isIOSSafariBrowser) {
      console.log('[SessionRefresh] iOS Safari detected - using aggressive refresh strategy')
    } else if (isIOSDevice) {
      console.log('[SessionRefresh] iOS device detected - using enhanced refresh strategy')
    }

    // Fazer refresh inicial se a aba ja esta visivel
    if (document.visibilityState === 'visible') {
      refreshSession('initial')
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handlePageShow)
      clearInterval(periodicRefreshInterval)
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
