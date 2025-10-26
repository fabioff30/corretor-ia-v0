"use client"

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendGTMEvent } from '@/utils/gtm-helper'
import { useUser } from '@/hooks/use-user'

// Tipos para o Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleOneTapConfig) => void
          prompt: (callback?: (notification: PromptMomentNotification) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

interface GoogleOneTapConfig {
  client_id: string
  callback: (response: CredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  context?: 'signin' | 'signup' | 'use'
  prompt_parent_id?: string
}

interface CredentialResponse {
  credential: string
  select_by: string
}

interface PromptMomentNotification {
  isDisplayMoment: () => boolean
  isDisplayed: () => boolean
  isNotDisplayed: () => boolean
  getNotDisplayedReason: () => string
  isSkippedMoment: () => boolean
  getSkippedReason: () => string
  isDismissedMoment: () => boolean
  getDismissedReason: () => string
  getMomentType: () => string
}

export function GoogleOneTap() {
  const { user } = useUser()
  const supabase = createClient()
  const initialized = useRef(false)

  useEffect(() => {
    // Não mostrar One Tap se o usuário já estiver logado
    if (user) {
      return
    }

    // Não inicializar se já foi inicializado
    if (initialized.current) {
      return
    }

    // Client ID do Google - deve ser adicionado nas variáveis de ambiente
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID não configurado. Google One Tap desabilitado.')
      return
    }

    // Função que processa o login quando o usuário seleciona uma conta
    const handleCredentialResponse = async (response: CredentialResponse) => {
      console.log('[One Tap] Recebido token do Google')

      try {
        // Track tentativa de login via One Tap
        sendGTMEvent('login_attempt', {
          method: 'google_one_tap',
        })

        // Autentica com Supabase usando o token do Google
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        })

        if (error) {
          console.error('[One Tap] Erro ao autenticar com Supabase:', error.message)
          sendGTMEvent('login_error', {
            method: 'google_one_tap',
            error: error.message,
          })
          return
        }

        console.log('[One Tap] Login bem-sucedido!', data.user?.email)

        // Track login bem-sucedido
        sendGTMEvent('login', {
          method: 'google_one_tap',
          user_id: data.user?.id,
        })

        // O auth context vai detectar automaticamente a mudança de sessão
        // e redirecionar o usuário conforme necessário
      } catch (err) {
        console.error('[One Tap] Erro inesperado:', err)
      }
    }

    // Função para inicializar o Google One Tap quando o script estiver carregado
    const initializeOneTap = () => {
      if (!window.google?.accounts?.id) {
        console.warn('[One Tap] API do Google não carregada ainda')
        return
      }

      try {
        // Inicializa o cliente do Google
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false, // Não selecionar automaticamente
          cancel_on_tap_outside: true, // Fechar ao clicar fora
          context: 'signin', // Contexto: signin, signup ou use
        })

        // Exibe o prompt do One Tap
        window.google.accounts.id.prompt((notification) => {
          console.log('[One Tap] Prompt notification:', notification.getMomentType())

          if (notification.isNotDisplayed()) {
            console.log('[One Tap] Não exibido:', notification.getNotDisplayedReason())
          }

          if (notification.isSkippedMoment()) {
            console.log('[One Tap] Ignorado:', notification.getSkippedReason())
          }

          if (notification.isDismissedMoment()) {
            console.log('[One Tap] Dispensado:', notification.getDismissedReason())
            sendGTMEvent('one_tap_dismissed', {
              reason: notification.getDismissedReason(),
            })
          }

          if (notification.isDisplayed()) {
            sendGTMEvent('one_tap_displayed', {
              moment_type: notification.getMomentType(),
            })
          }
        })

        initialized.current = true
        console.log('[One Tap] Inicializado com sucesso')
      } catch (err) {
        console.error('[One Tap] Erro ao inicializar:', err)
      }
    }

    // Carregar o script do Google Identity Services se ainda não estiver carregado
    if (!document.getElementById('google-one-tap-script')) {
      const script = document.createElement('script')
      script.id = 'google-one-tap-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeOneTap
      document.head.appendChild(script)
    } else {
      // Script já carregado, apenas inicializar
      initializeOneTap()
    }

    // Cleanup: cancelar o prompt quando o componente for desmontado
    return () => {
      if (window.google?.accounts?.id && initialized.current) {
        window.google.accounts.id.cancel()
      }
    }
  }, [user, supabase])

  // Este componente não renderiza nada visível
  return null
}
