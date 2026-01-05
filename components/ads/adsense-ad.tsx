"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { GOOGLE_ADSENSE_CLIENT } from "@/utils/constants"
import { useSubscription } from "@/hooks/use-subscription"

interface AdsenseAdProps {
  adSlot: string
  format?: "auto" | "horizontal" | "vertical" | "rectangle" | "fluid"
  className?: string
  style?: React.CSSProperties
  responsive?: boolean
}

export function AdsenseAd({ adSlot, format = "auto", className = "", style = {}, responsive = true }: AdsenseAdProps) {
  const [hasConsent, setHasConsent] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const adRef = useRef<HTMLModElement>(null)
  const initRef = useRef(false)
  const { isPremium } = useSubscription()

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

  // Initialize ad only once when consent is given and component is mounted
  useEffect(() => {
    if (hasConsent && !initRef.current && adRef.current && window.adsbygoogle) {
      try {
        // Check if this specific ad element already has an ad
        const adElement = adRef.current
        if (adElement && !adElement.hasAttribute("data-adsbygoogle-status")) {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          initRef.current = true
          setIsLoaded(true)
        }
      } catch (error) {
        console.error("AdSense initialization error:", error)
      }
    }
  }, [hasConsent])

  // Se não tiver consentimento ou usuário premium, não mostrar nada
  if (!hasConsent || isPremium) return null

  return (
    <div className={`my-4 overflow-hidden ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center", ...style }}
        data-ad-client={GOOGLE_ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      ></ins>
    </div>
  )
}
