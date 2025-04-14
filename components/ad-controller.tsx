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
    const textCorrected = localStorage.getItem("text-corrected")
    const showAdBanner = localStorage.getItem("show-ad-banner")
    const bannerClosed = localStorage.getItem("banner-closed")

    if ((textCorrected === "true" || showAdBanner === "true") && !bannerClosed && !shouldHideBasedOnPath) {
      console.log("AdController: Mostrando banner inicialmente")
      setShouldShowAd(true)
    }

    // Função para verificar mudanças no localStorage
    const checkStorage = () => {
      const updatedTextCorrected = localStorage.getItem("text-corrected")
      const updatedShowAdBanner = localStorage.getItem("show-ad-banner")
      const updatedBannerClosed = localStorage.getItem("banner-closed")

      if (
        (updatedTextCorrected === "true" || updatedShowAdBanner === "true") &&
        !updatedBannerClosed &&
        !shouldHideBasedOnPath
      ) {
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
      if (!shouldHideBasedOnPath && !bannerClosed) {
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
