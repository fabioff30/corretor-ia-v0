"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ContactForm } from "@/components/contact-form"
import { MessageSquare } from "lucide-react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FloatingContactWidgetProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

export function FloatingContactWidget({ position = "bottom-right" }: FloatingContactWidgetProps) {
  const [open, setOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Verificar se o aviso de cookies foi fechado
  useEffect(() => {
    // Função para verificar o consentimento de cookies
    const checkCookieConsent = () => {
      const consentGiven = localStorage.getItem("cookie-consent")
      if (consentGiven) {
        // Se o consentimento foi dado ou recusado, mostrar o widget após um delay
        setTimeout(() => {
          setIsVisible(true)
        }, 1000)
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

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Determinar a posição do widget
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-24 right-6",
    "top-left": "top-24 left-6",
  }

  if (!isVisible) return null

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`fixed ${positionClasses[position]} z-50`}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setOpen(true)}
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
                  aria-label="Abrir formulário de contato"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sugestões e críticas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Entre em contato</DialogTitle>
            <DialogDescription>
              Preencha o formulário abaixo para enviar uma mensagem. Responderemos o mais breve possível.
            </DialogDescription>
          </DialogHeader>
          <ContactForm />
        </DialogContent>
      </Dialog>
    </>
  )
}
