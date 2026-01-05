"use client"

import { useState, useEffect, useRef } from "react"
import { sendGTMEvent } from "@/utils/gtm-helper"
import Link from "next/link"
import Image from "next/image"
import { GOOGLE_ADSENSE_CLIENT, DISABLE_ADS } from "@/utils/constants"
import { useSubscription } from "@/hooks/use-subscription"

interface InlineAdProps {
  adSlot?: string
  className?: string
  format?: "auto" | "horizontal" | "vertical" | "rectangle"
  useAdsense?: boolean // Nova propriedade para escolher entre banner próprio ou AdSense
}

export function InlineAd({ adSlot, className = "", format = "auto", useAdsense = false }: InlineAdProps) {
  // Temporarily disable all ads
  if (DISABLE_ADS) {
    return null
  }
  const [hasConsent, setHasConsent] = useState(false)
  const adRef = useRef<HTMLModElement>(null)
  const initRef = useRef(false)
  const { isPremium } = useSubscription()

  // Não mostrar anúncios para usuários premium
  if (isPremium) return null

  // Verificar consentimento de cookies
  useEffect(() => {
    const consentGiven = localStorage.getItem("cookie-consent")
    if (consentGiven === "accepted") {
      setHasConsent(true)
    }

    // Listen for consent changes
    const handleStorageChange = () => {
      const consent = localStorage.getItem("cookie-consent")
      if (consent === "accepted") {
        setHasConsent(true)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Initialize AdSense ad only once
  useEffect(() => {
    if (useAdsense && hasConsent && adSlot && !initRef.current && adRef.current && window.adsbygoogle) {
      try {
        const adElement = adRef.current
        if (adElement && !adElement.hasAttribute("data-adsbygoogle-status")) {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          initRef.current = true
        }
      } catch (error) {
        console.error("AdSense initialization error:", error)
      }
    }
  }, [useAdsense, hasConsent, adSlot])

  // Se não tiver consentimento, não mostrar nada
  if (!hasConsent) return null

  // Se useAdsense for true e tivermos um adSlot, mostrar anúncio do AdSense
  if (useAdsense && adSlot) {
    return (
      <div className={`my-8 overflow-hidden min-h-[250px] rounded-lg ${className}`}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={GOOGLE_ADSENSE_CLIENT}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        ></ins>
      </div>
    )
  }

  // Caso contrário, mostrar banner próprio
  return (
    <div className={`my-8 overflow-hidden min-h-[250px] rounded-lg border ${className}`}>
      <Link
        href="/apoiar"
        onClick={() => {
          sendGTMEvent("banner_click", {
            location: "inline_ad",
            format: format,
            section: className || "default_section",
          })
        }}
        className="block"
      >
        <Image
          src="/images/banner-corretoria.png"
          alt="Seja um Apoiador do CorretorIA - Junte-se aos nossos apoiadores e faça parte da comunidade que mantém o Corretor vivo. Cada contribuição conta!"
          width={600}
          height={600}
          className="w-full h-auto"
        />
      </Link>
    </div>
  )
}
