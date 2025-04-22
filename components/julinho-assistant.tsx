"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sparkles, Send, X } from "lucide-react"
import { useChat } from "ai/react"

interface JulinhoAssistantProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

export function JulinhoAssistant({ position = "bottom-right" }: JulinhoAssistantProps) {
  const [open, setOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/julinho",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Olá! Eu sou o Julinho, seu tutor de língua portuguesa. Como posso ajudar você hoje? Pode me perguntar sobre gramática, ortografia, sintaxe ou qualquer dúvida relacionada ao português!",
      },
    ],
  })

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

  // Scroll para o final da conversa quando novas mensagens são adicionadas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
                  className="h-12 w-12 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
                  aria-label="Abrir assistente Julinho"
                >
                  <Sparkles className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Julinho - Tutor de Português</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        <DialogContent className="sm:max-w-[400px] h-[500px] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Julinho - Tutor de Português
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>Tire suas dúvidas sobre a língua portuguesa</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Digite sua dúvida sobre português..."
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
