'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * SessionRefreshProvider
 *
 * Provider que garante refresh proativo da sessao quando:
 * 1. A aba volta do background (visibilitychange)
 * 2. O usuario retorna apos inatividade
 *
 * Isso resolve o problema de sessoes expirando quando o usuario
 * deixa a aba em background por muito tempo.
 */
interface SessionRefreshProviderProps {
  children: ReactNode
}

export function SessionRefreshProvider({ children }: SessionRefreshProviderProps) {
  const lastRefreshRef = useRef<number>(Date.now())
  const isRefreshingRef = useRef<boolean>(false)

  useEffect(() => {
    // Intervalo minimo entre refreshes (5 minutos)
    const MIN_REFRESH_INTERVAL_MS = 5 * 60 * 1000

    const refreshSession = async () => {
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
          console.log('[SessionRefresh] Session refreshed successfully')
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
        refreshSession()
      }
    }

    // Refresh quando janela ganha foco
    const handleFocus = () => {
      console.log('[SessionRefresh] Window focused, checking session...')
      refreshSession()
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

    // Fazer refresh inicial se a aba ja esta visivel
    if (document.visibilityState === 'visible') {
      refreshSession()
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
