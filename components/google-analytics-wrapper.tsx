// @ts-nocheck
'use client'

import { GoogleAnalytics } from '@next/third-parties/google'
import { useEffect, useState } from 'react'

/**
 * Componente wrapper para o Google Analytics que respeita o consentimento de cookies
 *
 * Este componente só carrega o Google Analytics se:
 * 1. O usuário aceitou os cookies
 * 2. O ID do Google Analytics está configurado
 * 3. Não está em ambiente de desenvolvimento (opcional)
 */
export function GoogleAnalyticsWrapper() {
  const [hasConsent, setHasConsent] = useState(false)
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS

  useEffect(() => {
    // Verificar consentimento inicial
    const checkConsent = () => {
      const consent = localStorage.getItem('cookie-consent')
      setHasConsent(consent === 'accepted')
    }

    checkConsent()

    // Escutar mudanças no consentimento
    const handleStorageChange = () => {
      checkConsent()
    }

    window.addEventListener('storage', handleStorageChange)

    // Escutar evento customizado de mudança de consentimento
    const handleConsentChange = (event: CustomEvent) => {
      setHasConsent(event.detail.consent === 'accepted')
    }

    window.addEventListener('cookie-consent-changed', handleConsentChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cookie-consent-changed', handleConsentChange as EventListener)
    }
  }, [])

  // Não renderizar se:
  // - Não houver consentimento
  // - Não houver ID do Google Analytics configurado
  // - Estiver em desenvolvimento (opcional - remova se quiser testar em dev)
  if (!hasConsent || !gaId || gaId === 'G-XXXXXXXXXX') {
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}

/**
 * Hook para enviar eventos customizados ao Google Analytics
 *
 * Uso:
 * ```tsx
 * const sendGAEvent = useGoogleAnalytics()
 *
 * sendGAEvent('button_click', {
 *   category: 'engagement',
 *   label: 'premium_upgrade'
 * })
 * ```
 */
export function useGoogleAnalytics() {
  return (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams)
    }
  }
}

// Tipos para o gtag
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void
    dataLayer: any[]
  }
}
// @ts-nocheck
