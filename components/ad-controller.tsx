"use client"

import { useEffect, useState } from "react"
import { AdBanner } from "@/components/ad-banner"
import { usePathname } from "next/navigation"

export function AdController() {
  const [shouldShowAd, setShouldShowAd] = useState(false)
  const pathname = usePathname()

  // Não mostrar no caminho /apoiar
  const shouldHideBasedOnPath = pathname?.startsWith("/apoiar")

  useEffect(() => {
    // Verificar inicialmente
    const cookieConsent = localStorage.getItem("cookie-consent")
    const bannerClosed = localStorage.getItem("banner-closed")

    // Só mostrar o banner se o usuário deu consentimento para cookies,
    // o banner não foi fechado e não estamos na página de doação
    if (cookieConsent === "accepted" && !bannerClosed && !shouldHideBasedOnPath) {
      console.log("AdController: Mostrando banner apenas com consentimento de cookies")
      setShouldShowAd(true)
    }

    // Função para verificar mudanças no localStorage
    const checkStorage = () => {
      const updatedCookieConsent = localStorage.getItem("cookie-consent")
      const updatedBannerClosed = localStorage.getItem("banner-closed")

      if (updatedCookieConsent === "accepted" && !updatedBannerClosed && !shouldHideBasedOnPath) {
        console.log("AdController: Mostrando banner após evento de storage")
        setShouldShowAd(true)
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

      if (currentCookieConsent === "accepted" && !currentBannerClosed && !shouldHideBasedOnPath) {
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
  }, [shouldHideBasedOnPath])

  // Função para fechar o banner
  const handleClose = () => {
    setShouldShowAd(false)
    localStorage.setItem("banner-closed", "true")
  }

  if (!shouldShowAd) return null

  return <AdBanner position="bottom" variant="responsive" onClose={handleClose} forceShow={true} />
}
