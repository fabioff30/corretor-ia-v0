"use client"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { usePathname } from "next/navigation"

// Define the banner interface
interface Banner {
  id: string
  src: string
  alt: string
  utmParams: {
    source: string
    medium: string
    campaign: string
    content: string
  }
}

interface AdBannerProps {
  position?: "top" | "bottom" | "sidebar"
  variant?: "standard" | "responsive" | "inline"
  onClose?: () => void
  adSlot?: string
  forceShow?: boolean // Nova prop para controlar explicitamente a visibilidade
}

export function AdBanner({ position = "bottom", variant = "standard", onClose, forceShow = false }: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(forceShow)
  const [currentBannerIndex] = useState(() => Math.floor(Math.random() * 4)) // Seleciona um banner aleatório na inicialização
  const pathname = usePathname()
  const [shouldShow, setShouldShow] = useState(true)
  // Adicionar uma ref para o banner
  const bannerRef = useRef<HTMLDivElement>(null)
  // Adicionar um novo estado para rastrear se o banner foi fechado recentemente
  const [wasRecentlyClosed, setWasRecentlyClosed] = useState(false)

  // Define the banners with their respective UTM parameters
  const banners: Banner[] = [
    {
      id: "banner-community",
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/banner%20corretoria-wW4zGq97ZLHQ1kXMgKVHbnkhOUgLXR.webp",
      alt: "Seja um Apoiador do CorretorIA - Junte-se aos nossos apoiadores e faça parte da comunidade que mantém o Corretor vivo. Cada contribuição conta!",
      utmParams: {
        source: "ad_banner",
        medium: "banner",
        campaign: "support_banner",
        content: "community",
      },
    },
    {
      id: "banner-error-warning",
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ad3%20corretoria-mhXUBXOCGjKU1zj1XCBOIOU7QQcnsx.webp",
      alt: "Você tem certeza de que esreveu isso direito? Um erro pode custar caro na sua imagem pessoal ou profissional. Não corra riscos: apoie o CorretorIA.",
      utmParams: {
        source: "ad_banner",
        medium: "banner",
        campaign: "support_banner",
        content: "error_warning",
      },
    },
    {
      id: "banner-opportunities",
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ad5-YvVMzAt1pJUAEAdULnyvuVdqjZgP8g.webp",
      alt: "Quantas oportunidades você já perdeu por erros bobos na escrita? Sua escrita diz muito sobre você. Apoie o CorretorIA e garanta textos sempre impecáveis.",
      utmParams: {
        source: "ad_banner",
        medium: "banner",
        campaign: "support_banner",
        content: "opportunities",
      },
    },
    {
      id: "banner-write-better",
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ad4%20corretoria-lQwzLLaPfe6oVZ5xCf0DfO3rjfA2me.webp",
      alt: "Escreva melhor, sem complicação. Doe e ajude o CorretorIA a continuar gratuito.",
      utmParams: {
        source: "ad_banner",
        medium: "banner",
        campaign: "support_banner",
        content: "write_better",
      },
    },
  ]

  // Don't show on the donation page
  useEffect(() => {
    if (pathname?.startsWith("/apoiar")) {
      setShouldShow(false)
    } else {
      setShouldShow(true)
    }
  }, [pathname])

  // Modificar o useEffect que controla a visibilidade do banner
  useEffect(() => {
    // Verificar se há um flag específico para mostrar o banner após correção
    const showAdBanner = localStorage.getItem("show-ad-banner")
    const bannerClosed = localStorage.getItem("banner-closed")
    const textCorrected = localStorage.getItem("text-corrected")

    // Mostrar o banner se o flag estiver presente OU se o texto foi corrigido
    if ((showAdBanner === "true" || textCorrected === "true") && !bannerClosed && shouldShow && !wasRecentlyClosed) {
      console.log("Mostrando banner de anúncio após correção de texto")
      setIsVisible(true)
      // Remover o flag após mostrar o banner para evitar que ele apareça novamente sem uma nova correção
      localStorage.removeItem("show-ad-banner")
    }

    // Adicionar um listener para o evento de storage para detectar mudanças em tempo real
    const handleStorageChange = () => {
      const updatedShowAdBanner = localStorage.getItem("show-ad-banner")
      const updatedTextCorrected = localStorage.getItem("text-corrected")
      const updatedBannerClosed = localStorage.getItem("banner-closed")

      if (
        (updatedShowAdBanner === "true" || updatedTextCorrected === "true") &&
        !updatedBannerClosed &&
        shouldShow &&
        !wasRecentlyClosed
      ) {
        console.log("Mostrando banner via evento de storage")
        setIsVisible(true)
        localStorage.removeItem("show-ad-banner")
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Também adicionar um listener para um evento personalizado
    const handleCustomEvent = () => {
      if (shouldShow && !wasRecentlyClosed && !bannerClosed) {
        console.log("Mostrando banner via evento personalizado")
        setIsVisible(true)
      }
    }

    window.addEventListener("showAdBanner", handleCustomEvent)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("showAdBanner", handleCustomEvent)
    }
  }, [shouldShow, wasRecentlyClosed, pathname])

  // Adicionar um novo useEffect para detectar cliques fora do banner
  useEffect(() => {
    // Função para verificar se o clique foi fora do banner
    const handleClickOutside = (event: MouseEvent) => {
      if (bannerRef.current && !bannerRef.current.contains(event.target as Node) && isVisible) {
        setIsVisible(false)
        setWasRecentlyClosed(true)

        // Marcar o banner como fechado no localStorage
        localStorage.setItem("banner-closed", "true")

        if (onClose) onClose()

        // Registrar evento de fechamento por clique fora
        sendGTMEvent("ad_closed", {
          ad_variant: variant,
          ad_position: position,
          ad_content: banners[currentBannerIndex].utmParams.content,
          close_method: "click_outside",
        })
      }
    }

    // Adicionar o event listener
    document.addEventListener("mousedown", handleClickOutside)

    // Remover o event listener quando o componente for desmontado
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isVisible, onClose, variant, position, currentBannerIndex, banners])

  // Atualizar o useEffect para usar a prop forceShow
  useEffect(() => {
    if (forceShow && shouldShow && !wasRecentlyClosed) {
      setIsVisible(true)
    }
  }, [forceShow, shouldShow, wasRecentlyClosed])

  // If not visible, don't render anything
  if (!isVisible || !shouldShow) return null

  const currentBanner = banners[currentBannerIndex]

  // Remover a função getUtmUrl que não será mais necessária

  const handleClose = () => {
    setIsVisible(false)
    setWasRecentlyClosed(true)

    // Marcar o banner como fechado no localStorage
    localStorage.setItem("banner-closed", "true")

    if (onClose) onClose()

    sendGTMEvent("ad_closed", {
      ad_variant: variant,
      ad_position: position,
      ad_content: currentBanner.utmParams.content,
    })
  }

  // Remova a função handleClick que não será mais necessária.

  // Styles based on position
  const positionStyles = {
    top: "top-0 left-0 right-0 border-b w-full",
    bottom:
      "bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-4 lg:left-auto lg:right-4 md:max-w-md w-full md:w-auto",
    sidebar: "top-24 right-4 max-w-[300px] hidden md:block",
  }

  // Sizes based on variant
  const sizeStyles = {
    standard: "min-h-[90px]",
    responsive: "min-h-[120px] md:min-h-[180px] lg:min-h-[250px]",
    inline: "min-h-[90px]",
  }

  return (
    <motion.div
      ref={bannerRef} // Adicionar a ref aqui
      initial={{ opacity: 0, y: position === "top" ? -20 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === "top" ? -20 : 20 }}
      className={`fixed z-[9999] ${positionStyles[position]} bg-background rounded-lg shadow-lg border p-2 sm:p-3 md:p-4 ${position === "bottom" ? "border-b-0 md:border-b" : ""}`}
    >
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">Apoie o CorretorIA</span>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Fechar anúncio"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Link
            href="/apoiar"
            onClick={() => {
              sendGTMEvent("banner_click", {
                location: "ad_banner",
                position: position,
                variant: variant,
                banner_id: currentBanner.id,
                banner_content: currentBanner.utmParams.content,
              })
            }}
            className="block"
          >
            <Image
              src={currentBanner.src || "/placeholder.svg"}
              alt={currentBanner.alt}
              width={600}
              height={600}
              className={`w-full h-auto rounded-lg object-contain ${sizeStyles[variant]}`}
              priority
            />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
