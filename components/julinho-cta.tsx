"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { X } from "lucide-react"
import { usePathname } from "next/navigation"

interface JulinhoCTAProps {
  onOpenChat: () => void
  position?: "bottom-right" | "bottom-left"
}

export function JulinhoCTA({ onOpenChat, position = "bottom-right" }: JulinhoCTAProps) {
  const pathname = usePathname()

  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const isDarkMode = false // Removed useTheme and hardcoded to false
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
    // Track event in Google Analytics
    sendGTMEvent("julinho_cta_click", {
      event_category: "Engagement",
      event_label: "Julinho CTA Clicked",
    })

    // Mark as interacted
    localStorage.setItem("julinho-interacted", "true")

    // Hide CTA
    setIsVisible(false)

    // Check if on mobile and redirect if needed
    const isMobile = window.innerWidth < 640
    if (isMobile) {
      // Get or create a session ID
      const sessionId =
        localStorage.getItem("julinho-session-id") ||
        `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Save the session ID
      localStorage.setItem("julinho-session-id", sessionId)

      // Redirect to the dedicated chat page
      window.location.href = `/chat/julinho?session=${sessionId}`
      return
    }

    // Open chat (desktop behavior)
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

  if (!shouldRender) return null

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
          <div className="bg-yellow-400 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                <Image
                  src="/images/julinho-avatar.webp"
                  alt="Julinho"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-black">Julinho</h3>
                <p className="text-xs text-gray-800">Tutor de Português</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 rounded-full bg-yellow-500/20 hover:bg-yellow-500/40"
            >
              <X className="h-3 w-3 text-gray-800" />
            </Button>
          </div>

          {/* Message */}
          <div className="p-4">
            <div className="bg-yellow-50 rounded-lg p-3 mb-3 relative">
              <p className="text-sm text-gray-800">
                Olá! Precisa de ajuda com português? Estou aqui para tirar suas dúvidas sobre gramática, ortografia e
                muito mais!
              </p>
              <div className="absolute -left-2 top-3 w-0 h-0 border-t-8 border-r-8 border-b-0 border-l-0 border-yellow-50 transform rotate-45"></div>
            </div>

            <Button onClick={handleClick} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium">
              Conversar com o Julinho
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
