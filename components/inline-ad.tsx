"use client"

import { useState, useEffect } from "react"
import { sendGTMEvent } from "@/utils/gtm-helper"
import Link from "next/link"
import Image from "next/image"

interface InlineAdProps {
  adSlot?: string
  className?: string
  format?: "auto" | "horizontal" | "vertical" | "rectangle"
}

export function InlineAd({ className = "", format = "auto" }: InlineAdProps) {
  const [hasConsent, setHasConsent] = useState(false)

  // Verificar consentimento de cookies
  useEffect(() => {
    const consentGiven = localStorage.getItem("cookie-consent")
    if (consentGiven === "accepted") {
      setHasConsent(true)
    }
  }, [])

  // Se não tiver consentimento, não mostrar nada
  if (!hasConsent) return null

  const handleClick = () => {
    sendGTMEvent("supporter_banner_clicked", {
      ad_location: "inline",
      ad_format: format,
      utm_source: "inline_ad",
      utm_medium: "banner",
      utm_campaign: "support_banner",
    })
  }

  return (
    <div className={`my-8 overflow-hidden min-h-[250px] rounded-lg border ${className}`}>
      <Link
        href="/apoiar?utm_source=inline_ad&utm_medium=banner&utm_campaign=support_banner"
        onClick={handleClick}
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
