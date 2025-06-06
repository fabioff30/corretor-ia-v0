"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { X, AlertCircle } from "lucide-react"
import { usePathname } from "next/navigation"
import { JULINHO_DISABLED } from "@/utils/constants"

interface JulinhoCTAProps {
  onOpenChat: () => void
  position?: "bottom-right" | "bottom-left"
}

export function JulinhoCTA({ onOpenChat, position = "bottom-right" }: JulinhoCTAProps) {
  const pathname = usePathname()

  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    if (pathname === "/chat/julinho") {
      setShouldRender(false)
      return
    } else {
      setShouldRender(true)
    }
  }, [pathname])

  // Show CTA after a delay
  useEffect(() => {
    // Don't show if disabled
    if (JULINHO_DISABLED) return

    // Check if the CTA has been dismissed before
    const ctaDismissed = localStorage.getItem("julinho-cta-dismissed")
    if (ctaDismissed) {
      return
    }

    // Check if the user has already interacted with Julinho
    const julinhoInteracted = localStorage.getItem("julinho-interacted")
    if (julinhoInteracted) {
      return
    }

    // Show the CTA after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  // Handle CTA click
  const handleClick = () => {
    if (JULINHO_DISABLED) return

    // Track event in Google Analytics
    sendGTMEvent("julinho_whatsapp_cta_click", {
      event_category: "Engagement",
      event_label: "Julinho WhatsApp CTA Clicked",
    })

    // Mark as interacted
    localStorage.setItem("julinho-interacted", "true")

    // Hide CTA
    setIsVisible(false)

    // Open chat
    onOpenChat()
  }

  // Handle dismiss
  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem("julinho-cta-dismissed", "true")

    // Track dismissal in Google Analytics
    sendGTMEvent("julinho_cta_dismissed", {
      event_category: "Engagement",
      event_label: "Julinho CTA Dismissed",
    })

    // Hide after animation completes
    setTimeout(() => {
      setIsVisible(false)
    }, 300)
  }

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-24 right-6",
    "bottom-left": "bottom-24 left-6",
  }

  if (!shouldRender || JULINHO_DISABLED) return null

  if (!isVisible || isDismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        className={`fixed ${positionClasses[position]} z-40 max-w-[300px]`}
      >
        <div className={`rounded-lg shadow-lg overflow-hidden bg-white border border-gray-200`}>
          {/* Header */}
          <div className={`${JULINHO_DISABLED ? "bg-gray-400" : "bg-green-500"} p-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white relative">
                <Image
                  src="/images/julinho-avatar.webp"
                  alt="Julinho"
                  width={40}
                  height={40}
                  className={`w-full h-full object-cover ${JULINHO_DISABLED ? "grayscale" : ""}`}
                />
                <div
                  className={`absolute bottom-0 right-0 ${
                    JULINHO_DISABLED ? "bg-gray-600" : "bg-green-600"
                  } rounded-full p-0.5 shadow-sm`}
                >
                  {JULINHO_DISABLED ? (
                    <AlertCircle className="h-3 w-3 text-white" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white">
                  {JULINHO_DISABLED ? "Julinho Indisponível" : "Julinho no WhatsApp"}
                </h3>
                <p className="text-xs text-white/90">{JULINHO_DISABLED ? "Em manutenção" : "Tutor de Português"}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 rounded-full bg-white/20 hover:bg-white/40 text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Message */}
          <div className="p-4">
            <div className={`${JULINHO_DISABLED ? "bg-gray-50" : "bg-green-50"} rounded-lg p-3 mb-3 relative`}>
              <p className="text-sm text-gray-800">
                {JULINHO_DISABLED
                  ? "O Julinho está temporariamente indisponível para manutenção. Voltaremos em breve com melhorias!"
                  : "Olá! Agora você pode tirar suas dúvidas de português diretamente pelo WhatsApp! Estou pronto para ajudar com gramática, ortografia e muito mais!"}
              </p>
              <div
                className={`absolute -left-2 top-3 w-0 h-0 border-t-8 border-r-8 border-b-0 border-l-0 ${
                  JULINHO_DISABLED ? "border-gray-50" : "border-green-50"
                } transform rotate-45`}
              ></div>
            </div>

            <Button
              onClick={handleClick}
              disabled={JULINHO_DISABLED}
              className={`w-full ${
                JULINHO_DISABLED
                  ? "bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              } text-white font-medium flex items-center justify-center gap-2`}
            >
              {JULINHO_DISABLED ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Indisponível
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Conversar com o Julinho
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
