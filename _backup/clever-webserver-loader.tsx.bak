'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from "@/hooks/use-user"

/**
 * CleverWebServer Ads Loader
 * Carrega os scripts de anúncios APENAS para usuários FREE
 * Bloqueado em rotas específicas e para usuários premium
 */

// Rotas onde o CleverWebServer não deve aparecer
const BLOCKED_ROUTES = [
  '/premium',
  '/dashboard',
  '/oferta-especial',
  '/admin',
  '/login',
  '/cadastro',
]

export function CleverWebServerLoader() {
  const pathname = usePathname()
  const [shouldLoad, setShouldLoad] = useState(false)
  const { isPro, profile } = useUser()

  useEffect(() => {
    // Verificar se a rota atual está bloqueada
    const isBlocked = BLOCKED_ROUTES.some(route => {
      return pathname === route || pathname.startsWith(`${route}/`)
    })

    // Se for usuário premium ou admin, não carregar
    const isPremiumUser = isPro || profile?.plan_type === 'pro' || profile?.plan_type === 'admin'

    if (isPremiumUser) {
      setShouldLoad(false)
      return
    }

    setShouldLoad(!isBlocked)
  }, [pathname, isPro, profile?.plan_type])

  // Carregar scripts quando shouldLoad mudar para true
  useEffect(() => {
    if (!shouldLoad) return

    // Função para criar e inserir script
    const loadScript = (id: string, src: string) => {
      // Verificar se já existe
      if (document.getElementById(id)) return

      const script = document.createElement('script')
      script.id = id
      script.src = src
      script.async = true
      script.type = 'text/javascript'
      script.setAttribute('data-cfasync', 'false')
      script.setAttribute('data-target', window.name || '')
      script.setAttribute('data-callback', 'put-your-callback-function-here')
      script.setAttribute('data-callback-url-click', 'put-your-click-macro-here')
      script.setAttribute('data-callback-url-view', 'put-your-view-macro-here')

      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        document.head.appendChild(script)
      }
    }

    // Carregar os dois scripts
    loadScript('CleverCoreLoader94925', 'https://scripts.cleverwebserver.com/5e874cbae3c8b61578de0cb6869547be.js')
    loadScript('CleverCoreLoader98062', 'https://scripts.cleverwebserver.com/b8d248675a18e7de6ab7db3a10e83a10.js')

    // Cleanup: remover scripts quando componente desmontar ou shouldLoad mudar
    return () => {
      const script1 = document.getElementById('CleverCoreLoader94925')
      const script2 = document.getElementById('CleverCoreLoader98062')
      script1?.remove()
      script2?.remove()
    }
  }, [shouldLoad])

  // Não renderizar se não deve carregar
  if (!shouldLoad) {
    return null
  }

  // Renderizar os containers de anúncios
  return (
    <>
      <div className="clever-core-ads-94925" />
      <div className="clever-core-ads-98062" />
    </>
  )
}
