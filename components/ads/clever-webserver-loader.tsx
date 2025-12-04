'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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

// Padrões de user agent de bots conhecidos
const BOT_PATTERNS = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'baiduspider',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
  'applebot', 'petalbot', 'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot',
  'rogerbot', 'embedly', 'quora link preview', 'showyoubot', 'outbrain',
  'pinterest', 'slackbot', 'vkshare', 'w3c_validator', 'redditbot',
  'sogou', 'exabot', 'facebot', 'ia_archiver', 'crawler', 'spider', 'bot/'
]

// Detecta se o user agent é um bot
function isBot(): boolean {
  if (typeof window === 'undefined' || !navigator?.userAgent) return false
  const ua = navigator.userAgent.toLowerCase()
  return BOT_PATTERNS.some(pattern => ua.includes(pattern))
}

export function CleverWebServerLoader() {
  const pathname = usePathname()
  const [shouldLoad, setShouldLoad] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [isBrazil, setIsBrazil] = useState(false)
  const { isPro, profile } = useUser()

  // feature flag to kill switch quickly if Google flags again
  const isFeatureEnabled = useMemo(() => {
    if (typeof process === 'undefined') return true
    const flag = process.env.NEXT_PUBLIC_ENABLE_CLEVER
    return flag === undefined || flag === 'true'
  }, [])

  // Geo: usa cookie definido no middleware (x-vercel-ip-country) e cai para heurística
  useEffect(() => {
    if (typeof window === 'undefined') return

    const countryMatch = document.cookie.match(/(?:^|; )country=([^;]+)/)
    if (countryMatch?.[1]) {
      const country = decodeURIComponent(countryMatch[1]).toUpperCase()
      setIsBrazil(country === 'BR')
      return
    }

    const lang = (navigator.language || navigator.languages?.[0] || '').toLowerCase()
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    const brazilTimezones = [
      'America/Sao_Paulo', 'America/Belem', 'America/Fortaleza', 'America/Recife',
      'America/Araguaina', 'America/Maceio', 'America/Bahia', 'America/Manaus',
      'America/Boa_Vista', 'America/Porto_Velho', 'America/Eirunepe', 'America/Rio_Branco'
    ]

    const inferredBrazil = lang.startsWith('pt-br') || brazilTimezones.includes(tz)
    setIsBrazil(inferredBrazil)
  }, [])

  // cookie consent listener (marketing cookies required before loading ads)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const readConsent = () => {
      try {
        return localStorage.getItem('cookie-consent') === 'accepted'
      } catch {
        return false
      }
    }

    const updateConsent = () => setHasConsent(readConsent())

    updateConsent()
    window.addEventListener('storage', updateConsent)
    const consentHandler = () => updateConsent()
    window.addEventListener('cookie-consent-changed', consentHandler)
    return () => {
      window.removeEventListener('storage', updateConsent)
      window.removeEventListener('cookie-consent-changed', consentHandler)
    }
  }, [])

  useEffect(() => {
    // Verificar se a rota atual está bloqueada
    const isBlocked = BLOCKED_ROUTES.some(route => {
      return pathname === route || pathname.startsWith(`${route}/`)
    })

    // Se for usuário premium ou admin, não carregar
    const isPremiumUser = isPro || profile?.plan_type === 'pro' || profile?.plan_type === 'admin' || profile?.plan_type === 'lifetime'

    // Mostrar para:
    // - Visitantes não logados (isAuthenticated === false)
    // - Usuários logados com plano free
    // NÃO mostrar para usuários premium/admin/lifetime ou bots
    const allow =
      isFeatureEnabled &&
      isBrazil &&
      hasConsent &&
      !isPremiumUser &&
      !isBlocked &&
      !isBot()

    setShouldLoad(allow)
  }, [pathname, isPro, profile?.plan_type, isFeatureEnabled, isBrazil, hasConsent])

  // Carregar scripts quando shouldLoad mudar para true
  useEffect(() => {
    if (!shouldLoad) return

    // Função para criar e inserir script (lazy via idle callback)
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

    const scheduleLoad = () => {
      loadScript('CleverCoreLoader94925', 'https://scripts.cleverwebserver.com/5e874cbae3c8b61578de0cb6869547be.js')
      loadScript('CleverCoreLoader98062', 'https://scripts.cleverwebserver.com/b8d248675a18e7de6ab7db3a10e83a10.js')
    }

    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(scheduleLoad)
    } else {
      setTimeout(scheduleLoad, 0)
    }

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
