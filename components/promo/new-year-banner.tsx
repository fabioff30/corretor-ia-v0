"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Páginas onde o banner deve aparecer
const ALLOWED_PATHS = ["/", "/reescrever-texto", "/premium", "/blog"]

// Data de término da promoção: 01/01/2026 às 23:59 BRT (UTC-3)
const END_DATE = new Date("2026-01-02T02:59:00Z")

// Chave do localStorage para persistência
const STORAGE_KEY = "ny-banner-2025-dismissed"

// Horas para esconder após fechar
const DISMISS_HOURS = 24

export function NewYearBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)

    // Verificar se a promoção ainda está ativa
    if (new Date() > END_DATE) {
      return
    }

    // Verificar se está em página permitida
    const isAllowedPage = ALLOWED_PATHS.some(
      (path) => pathname === path || pathname.startsWith("/blog/")
    )

    if (!isAllowedPage) {
      return
    }

    // Verificar se não foi fechado recentemente
    const dismissedAt = localStorage.getItem(STORAGE_KEY)
    if (dismissedAt) {
      const hoursAgo = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60)
      if (hoursAgo < DISMISS_HOURS) {
        return
      }
    }

    // Mostrar o banner com um pequeno delay para a animação funcionar
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
  }

  // Não renderizar no servidor ou se não deve mostrar
  if (!mounted || !isVisible) {
    return null
  }

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-[60] animate-slide-down">
      <div className="relative">
        {/* Link para a oferta */}
        <Link
          href="/oferta-fim-de-ano?utm_source=banner&utm_medium=mobile&utm_campaign=fimdeano2025"
          className="block"
        >
          <Image
            src="/banner-dsk.webp"
            alt="Oferta de Fim de Ano - 2 produtos pelo preço de 1 - R$19,90/mês"
            width={1200}
            height={400}
            className="w-full h-auto"
            priority
          />
        </Link>

        {/* Botão fechar */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleClose()
          }}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
          aria-label="Fechar banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
