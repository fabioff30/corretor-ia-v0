"use client"

import { useEffect, useState } from "react"
import { AdBanner } from "@/components/ad-banner"
import { usePathname } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { DISABLE_ADS } from "@/utils/constants"

export function AdController() {
  // Temporarily disable all ads
  if (DISABLE_ADS) {
    return null
  }

  const [shouldShowAd, setShouldShowAd] = useState(false)
  const pathname = usePathname()
  const { profile } = useUser()

  // Não mostrar no caminho /apoiar
  const shouldHideBasedOnPath = pathname?.startsWith("/apoiar")

  // Verificar se o usuário é premium ou admin
  const isAdmin = profile?.plan_type === "admin"
  const isPremium = profile?.plan_type === "pro" || isAdmin
  const shouldHideForPremium = isPremium

  useEffect(() => {
    // Verificar inicialmente
    const cookieConsent = localStorage.getItem("cookie-consent")
    const bannerClosed = localStorage.getItem("banner-closed")

    // Só mostrar o banner se:
    // 1. O usuário deu consentimento para cookies
    // 2. O banner não foi fechado
    // 3. Não estamos na página de doação
    // 4. O usuário NÃO é premium ou admin
    if (
      cookieConsent === "accepted" &&
      !bannerClosed &&
      !shouldHideBasedOnPath &&
      !shouldHideForPremium
    ) {
      console.log("AdController: Mostrando banner apenas com consentimento de cookies")
      setShouldShowAd(true)
    } else {
      setShouldShowAd(false)
    }

    // Função para verificar mudanças no localStorage
    const checkStorage = () => {
      const updatedCookieConsent = localStorage.getItem("cookie-consent")
      const updatedBannerClosed = localStorage.getItem("banner-closed")

      if (
        updatedCookieConsent === "accepted" &&
        !updatedBannerClosed &&
        !shouldHideBasedOnPath &&
        !shouldHideForPremium
      ) {
        console.log("AdController: Mostrando banner após evento de storage")
        setShouldShowAd(true)
      } else {
        setShouldShowAd(false)
      }

      if (updatedBannerClosed === "true") {
        setShouldShowAd(false)
      }
    }

    // Adicionar listener para o evento de storage
    window.addEventListener("storage", checkStorage)

    // Adicionar listener para o evento personalizado
    const handleCustomEvent = () => {
      const currentCookieConsent = localStorage.getItem("cookie-consent")
      const currentBannerClosed = localStorage.getItem("banner-closed")

      if (
        currentCookieConsent === "accepted" &&
        !currentBannerClosed &&
        !shouldHideBasedOnPath &&
        !shouldHideForPremium
      ) {
        console.log("AdController: Mostrando banner via evento personalizado")
        setShouldShowAd(true)
      }
    }

    window.addEventListener("showAdBanner", handleCustomEvent)

    // Verificar periodicamente
    const interval = setInterval(checkStorage, 1000)

    return () => {
      window.removeEventListener("storage", checkStorage)
      window.removeEventListener("showAdBanner", handleCustomEvent)
      clearInterval(interval)
    }
  }, [shouldHideBasedOnPath, shouldHideForPremium])

  // Função para fechar o banner
  const handleClose = () => {
    setShouldShowAd(false)
    localStorage.setItem("banner-closed", "true")
  }

  if (!shouldShowAd) return null

  return <AdBanner position="bottom" variant="responsive" onClose={handleClose} forceShow={true} />
}
