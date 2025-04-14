"use client"

import { useState, useEffect } from "react"

export function FloatingEmailWidget() {
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showWidget, setShowWidget] = useState(false)
  const [textCorrected, setTextCorrected] = useState(false)
  const [adPosition, setAdPosition] = useState({ bottom: 6, right: 6 })

  // Verificar se o usuário já interagiu com o aviso de cookies
  useEffect(() => {
    const checkCookieConsent = () => {
      const consentGiven = localStorage.getItem("cookie-consent")
      if (consentGiven) {
        setShowWidget(true)
      }
    }

    // Verificar imediatamente
    checkCookieConsent()

    // Configurar um listener para detectar mudanças no localStorage
    const handleStorageChange = () => {
      checkCookieConsent()
    }

    window.addEventListener("storage", handleStorageChange)

    // Verificar periodicamente (para o caso do evento de storage não ser disparado na mesma janela)
    const interval = setInterval(checkCookieConsent, 1000)

    // Verificar se o texto foi corrigido
    const checkTextCorrected = () => {
      const wasTextCorrected = localStorage.getItem("text-corrected")
      if (wasTextCorrected === "true") {
        // Adicionar um pequeno atraso antes de mostrar o widget
        setTimeout(() => {
          setTextCorrected(true)
        }, 3500) // Atraso de 3.5 segundos para garantir que o toast já tenha desaparecido
      }
    }

    // Verificar imediatamente
    checkTextCorrected()

    // Configurar um listener para detectar mudanças no localStorage
    const handleTextCorrectedChange = () => {
      checkTextCorrected()
    }

    window.addEventListener("storage", handleTextCorrectedChange)

    // Também verificar periodicamente
    const textCorrectedInterval = setInterval(checkTextCorrected, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("storage", handleTextCorrectedChange)
      clearInterval(interval)
      clearInterval(textCorrectedInterval)
    }
  }, [])

  // Detectar a presença de anúncios e ajustar a posição
  useEffect(() => {
    const checkForAds = () => {
      // Verificar se há anúncios na parte inferior
      const bottomAds = document.querySelectorAll('[class*="ad-banner"]')
      if (bottomAds.length > 0) {
        setAdPosition({ bottom: 80, right: 6 }) // Posicionar acima dos anúncios
      } else {
        setAdPosition({ bottom: 6, right: 6 }) // Posição padrão
      }
    }

    checkForAds()
    // Verificar novamente quando a janela for redimensionada
    window.addEventListener("resize", checkForAds)

    return () => {
      window.removeEventListener("resize", checkForAds)
    }
  }, [])

  if (!isOpen || !showWidget || !textCorrected) return null

  return null
}
