"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, X, AlertCircle, PauseCircle, PlayCircle } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import Image from "next/image"
import { useTheme } from "next-themes"
import ReactMarkdown from "react-markdown"

interface JulinhoAssistantProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isComplete?: boolean
}

interface BatchResponse {
  batches: string[]
  isBatched: true
}

interface SimpleResponse {
  response: string
  isBatched: false
}

type ApiResponse = BatchResponse | SimpleResponse

export function JulinhoAssistant({ position = "bottom-right" }: JulinhoAssistantProps) {
  const [open, setOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionId] = useState<string>(`session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Eu sou o Julinho, seu tutor de língua portuguesa. Como posso ajudar você hoje? Pode me perguntar sobre gramática, ortografia, sintaxe ou qualquer dúvida relacionada ao português!",
      isComplete: true,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)
  const [batchedResponse, setBatchedResponse] = useState<string[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(300) // ms between batches
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 640px)")
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Process batched responses
  useEffect(() => {
    if (batchedResponse.length > 0 && currentBatchIndex < batchedResponse.length && !isPaused) {
      const timer = setTimeout(() => {
        // If this is the first batch, add a new message
        if (currentBatchIndex === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant_batch_${Date.now()}`,
              role: "assistant",
              content: batchedResponse[0],
              isComplete: batchedResponse.length === 1,
            },
          ])
        } else {
          // Otherwise update the last message
          setMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]

            // Append the new batch to the existing content
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + "\n\n" + batchedResponse[currentBatchIndex],
              isComplete: currentBatchIndex === batchedResponse.length - 1,
            }

            return newMessages
          })
        }

        // Move to the next batch
        setCurrentBatchIndex(currentBatchIndex + 1)
      }, typingSpeed) // Delay between batches

      return () => clearTimeout(timer)
    } else if (batchedResponse.length > 0 && currentBatchIndex >= batchedResponse.length) {
      // Reset when all batches are processed
      setBatchedResponse([])
      setCurrentBatchIndex(0)
      setIsLoading(false)
      setIsPaused(false)
    }
  }, [batchedResponse, currentBatchIndex, isPaused, typingSpeed])

  // Log the session ID when component mounts
  useEffect(() => {
    console.log("Julinho session ID:", sessionId)
  }, [sessionId])

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
  }, [messages, errorMessage])

  // Limpar mensagem de erro quando o usuário digita
  useEffect(() => {
    if (input && errorMessage) {
      setErrorMessage(null)
    }
  }, [input, errorMessage])

  // Função para enviar mensagem para o webhook
  const sendMessage = async (userMessage: string) => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      setIsPaused(false)

      // Adicionar a mensagem do usuário à lista
      const userMessageObj = {
        id: `user_${Date.now()}`,
        role: "user" as const,
        content: userMessage,
        isComplete: true,
      }
      setMessages((prev) => [...prev, userMessageObj])

      // Enviar a mensagem para a API
      const response = await fetch("/api/julinho", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessageObj],
          sessionId: sessionId, // Passar o ID da sessão para a API
        }),
      })

      if (!response.ok) {
        throw new Error(`API respondeu com status: ${response.status}`)
      }

      const data = (await response.json()) as ApiResponse

      // Processar a resposta
      if (data.isBatched && data.batches.length > 0) {
        // Se for uma resposta em batches, configurar para processamento
        setBatchedResponse(data.batches)
        setCurrentBatchIndex(0)
        // O estado de loading será desativado quando todos os batches forem processados
      } else {
        // Se for uma resposta simples, adicionar diretamente
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant_${Date.now()}`,
            role: "assistant",
            content: "isBatched" in data ? data.response : "Desculpe, não consegui processar sua pergunta.",
            isComplete: true,
          },
        ])
        setIsLoading(false)
      }

      setInput("")
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setErrorMessage("Não foi possível conectar ao Julinho. Por favor, tente novamente mais tarde.")
      setIsLoading(false)
    }
  }

  // Função para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage(input.trim())
  }

  // Função para pausar/retomar a digitação
  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  // Função para completar imediatamente a resposta
  const completeResponse = () => {
    if (batchedResponse.length > 0 && currentBatchIndex < batchedResponse.length) {
      // Concatenar todos os batches restantes
      const remainingContent = batchedResponse.slice(currentBatchIndex).join("\n\n")

      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]

        // Se estamos no primeiro batch, criar uma nova mensagem
        if (currentBatchIndex === 0) {
          return [
            ...prev,
            {
              id: `assistant_complete_${Date.now()}`,
              role: "assistant",
              content: remainingContent,
              isComplete: true,
            },
          ]
        }

        // Caso contrário, atualizar a última mensagem
        newMessages[newMessages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + "\n\n" + remainingContent,
          isComplete: true,
        }

        return newMessages
      })

      // Resetar o estado de batches
      setBatchedResponse([])
      setCurrentBatchIndex(0)
      setIsLoading(false)
      setIsPaused(false)
    }
  }

  // Determinar a posição do widget
  const positionClasses = {
    "bottom-right": isMobile ? "bottom-4 right-4" : "bottom-6 right-6",
    "bottom-left": isMobile ? "bottom-4 left-4" : "bottom-6 left-6",
    "top-right": isMobile ? "top-20 right-4" : "top-24 right-6",
    "top-left": isMobile ? "top-20 left-4" : "top-24 left-6",
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
                  className={`${
                    isMobile ? "h-14 w-14" : "h-12 w-12"
                  } rounded-full shadow-lg bg-yellow-400 hover:bg-yellow-500 text-black p-0 overflow-hidden`}
                  aria-label="Abrir assistente Julinho"
                >
                  <Image
                    src="/images/julinho-avatar.webp"
                    alt="Julinho"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "top" : "left"}>
                <p>Julinho - Tutor de Português</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        <DialogContent
          className={`${
            isMobile ? "w-[calc(100%-32px)] h-[80vh] max-h-[600px]" : "sm:max-w-[400px] h-[500px]"
          } flex flex-col p-0 gap-0 rounded-xl overflow-hidden border-0`}
        >
          <DialogHeader className={`p-4 border-b ${isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-400">
                  <Image
                    src="/images/julinho-avatar.webp"
                    alt="Julinho"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <DialogTitle className={`text-lg font-bold ${isDarkMode ? "text-white" : ""}`}>Julinho</DialogTitle>
                  <DialogDescription className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Tutor de Português
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className={`h-8 w-8 rounded-full ${isDarkMode ? "hover:bg-gray-800 text-gray-200" : ""}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                    <Image
                      src="/images/julinho-avatar.webp"
                      alt="Julinho"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : isDarkMode
                        ? "bg-gray-800 text-gray-100 border border-gray-700 shadow-sm rounded-tl-none"
                        : "bg-white text-gray-900 border border-gray-200 shadow-sm rounded-tl-none"
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {!message.isComplete && (
                    <span className="inline-block ml-1 animate-pulse">
                      <span className="sr-only">Digitando...</span>▌
                    </span>
                  )}
                </div>
                {message.role === "assistant" && !message.isComplete && (
                  <div className="flex flex-col ml-2 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full"
                      onClick={togglePause}
                      title={isPaused ? "Continuar" : "Pausar"}
                    >
                      {isPaused ? (
                        <PlayCircle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <PauseCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full"
                      onClick={completeResponse}
                      title="Completar"
                    >
                      <span className="text-xs font-bold text-yellow-500">⏭️</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {errorMessage && (
              <div className="flex justify-center">
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isDarkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-800"
                  } flex items-center gap-2`}
                >
                  <AlertCircle className="h-4 w-4" />
                  {errorMessage}
                </div>
              </div>
            )}
            {isLoading && batchedResponse.length === 0 && currentBatchIndex === 0 && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                  <Image
                    src="/images/julinho-avatar.webp"
                    alt="Julinho"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isDarkMode
                      ? "bg-gray-800 border border-gray-700 shadow-sm rounded-tl-none"
                      : "bg-white border border-gray-200 shadow-sm rounded-tl-none"
                  }`}
                >
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className={`border-t p-3 flex gap-2 ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white"}`}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida sobre português..."
              className={`flex-1 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              }`}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-yellow-400 hover:bg-yellow-500 text-black min-w-[40px] h-[40px] flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
