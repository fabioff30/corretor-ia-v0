'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AdSenseLoader } from './adsense-loader'
import type { Profile } from '@/types/supabase'

/**
 * AdSense Loader com controle de rotas
 * Carrega AdSense apenas em rotas específicas e para usuários não-premium
 */

// Rotas onde o AdSense PODE aparecer
const ALLOWED_ROUTES = [
  '/', // Home
  '/detector-ia',
  '/reescrever-texto',
  '/blog',
]

// Rotas onde o AdSense NÃO PODE aparecer
const BLOCKED_ROUTES = [
  '/dashboard',
  '/premium',
  '/contato',
  '/oferta-especial',
]

interface AdSenseLoaderWithRoutesProps {
  initialProfile: Profile | null
}

export function AdSenseLoaderWithRoutes({ initialProfile }: AdSenseLoaderWithRoutesProps) {
  const pathname = usePathname()
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    // Verificar se o usuário é premium
    const isPremium = initialProfile?.plan_type === 'pro' || initialProfile?.plan_type === 'admin'

    if (isPremium) {
      console.log('[AdSense] Bloqueado: usuário é premium/admin')
      setShouldLoad(false)
      return
    }

    // Verificar se está em rota bloqueada
    const isBlocked = BLOCKED_ROUTES.some(route => {
      return pathname === route || pathname.startsWith(`${route}/`)
    })

    if (isBlocked) {
      console.log(`[AdSense] Bloqueado na rota: ${pathname}`)
      setShouldLoad(false)
      return
    }

    // Verificar se está em rota permitida
    const isAllowed = ALLOWED_ROUTES.some(route => {
      // Para home, verificar rota exata
      if (route === '/') {
        return pathname === '/'
      }
      // Para outras rotas, verificar rota e subrotas
      return pathname === route || pathname.startsWith(`${route}/`)
    })

    if (isAllowed) {
      console.log(`[AdSense] Permitido na rota: ${pathname}`)
      setShouldLoad(true)
    } else {
      console.log(`[AdSense] Rota não está na lista permitida: ${pathname}`)
      setShouldLoad(false)
    }
  }, [pathname, initialProfile])

  // Não renderizar se não deve carregar
  if (!shouldLoad) {
    return null
  }

  return <AdSenseLoader initialProfile={initialProfile} />
}
