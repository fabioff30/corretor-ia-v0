"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { X, Cookie } from "lucide-react"

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Verificar se estamos no cliente para evitar erros de hidratação
  useEffect(() => {
    setIsClient(true)

    // Verificar se o usuário já aceitou os cookies
    const consentGiven = localStorage.getItem("cookie-consent")
    if (!consentGiven) {
      setShowConsent(true)
    }
  }, [])

  const acceptCookies = () => {
    // Salvar a preferência e disparar um evento de storage
    localStorage.setItem("cookie-consent", "accepted")

    // Disparar um evento para notificar outras partes da aplicação
    window.dispatchEvent(new Event("storage"))

    // Disparar evento customizado para notificar componentes específicos
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: { consent: "accepted" } }))

    setShowConsent(false)

    // Ativar o Google Tag Manager completamente
    if (window.dataLayer) {
      window.dataLayer.push({ event: "cookie_consent_accepted" })
    }

    // Inicializar o Meta Pixel se o usuário aceitou cookies
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("init", "698603379497206")
      window.fbq("track", "PageView")
    }

    // Ativar o Hotjar se o usuário aceitou cookies
    if (window.hj && typeof window.hj === "function") {
      window.hj("consent", "granted")
    }
  }

  const declineCookies = () => {
    // Salvar a preferência e disparar um evento de storage
    localStorage.setItem("cookie-consent", "declined")

    // Disparar um evento para notificar outras partes da aplicação
    window.dispatchEvent(new Event("storage"))

    // Disparar evento customizado para notificar componentes específicos
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: { consent: "declined" } }))

    setShowConsent(false)

    // Configurar o Google Tag Manager para respeitar a recusa
    if (window.dataLayer) {
      window.dataLayer.push({ event: "cookie_consent_declined" })
    }

    // Desativar o Hotjar se o usuário recusou cookies
    if (window.hj && typeof window.hj === "function") {
      window.hj("consent", "denied")
      window._hjSettings = null
      window.hj = null
    }
  }

  if (!isClient || !showConsent) return null

  return (
    <AnimatePresence>
      {showConsent && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg"
        >
          <div className="max-w-[1366px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full flex-shrink-0 mt-1">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">Este site utiliza cookies</h3>
                <p className="text-sm text-muted-foreground">
                  Utilizamos cookies para melhorar sua experiência, personalizar conteúdo, analisar o tráfego e coletar
                  dados de comportamento com Hotjar. Ao clicar em "Aceitar", você concorda com o uso de cookies conforme
                  descrito em nossa{" "}
                  <Link href="/cookies" className="text-primary hover:underline">
                    Política de Cookies
                  </Link>{" "}
                  e{" "}
                  <Link href="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex gap-3 ml-auto md:ml-0">
              <Button variant="outline" size="sm" onClick={declineCookies}>
                Recusar
              </Button>
              <Button size="sm" onClick={acceptCookies}>
                Aceitar
              </Button>
            </div>
            <button
              onClick={declineCookies}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Fechar aviso de cookies"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
