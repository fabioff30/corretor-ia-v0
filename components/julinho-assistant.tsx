"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, X, AlertCircle } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import { JulinhoCTA } from "./julinho-cta"
import { sendGTMEvent } from "@/utils/gtm-helper"

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
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 640px)")
  const theme = "light"
  // const isDarkMode = theme === "dark"

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Calculate a natural delay based on message length and add some randomness
  const calculateNaturalDelay = (message: string) => {
    // Base delay between messages (in milliseconds)
    const baseDelay = 1200

    // Additional delay based on message length (50ms per character, capped at 2000ms)
    const lengthDelay = Math.min(message.length * 50, 2000)

    // Add some randomness (±20% variation)
    const randomFactor = 0.8 + Math.random() * 0.4

    return Math.round((baseDelay + lengthDelay) * randomFactor)
  }

  // Process batched responses - now each batch is a separate message with natural timing
  useEffect(() => {
    if (batchedResponse.length > 0 && currentBatchIndex < batchedResponse.length && !isPaused) {
      // Show typing indicator before sending the message
      setIsTyping(true)

      // Calculate a natural delay based on message content
      const currentMessage = batchedResponse[currentBatchIndex]
      const typingDelay = calculateNaturalDelay(currentMessage)

      const timer = setTimeout(() => {
        // Add a new message for each batch
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant_batch_${Date.now()}_${currentBatchIndex}`,
            role: "assistant" as const,
            content: currentMessage,
            isComplete: true, // Each message is complete on its own
          },
        ])

        // Hide typing indicator
        setIsTyping(false)

        // Move to the next batch after a short pause
        setTimeout(() => {
          setCurrentBatchIndex(currentBatchIndex + 1)
        }, 300) // Small pause after message appears before starting to type the next one
      }, typingDelay) // Natural delay for typing

      return () => clearTimeout(timer)
    } else if (batchedResponse.length > 0 && currentBatchIndex >= batchedResponse.length) {
      // Reset when all batches are processed
      setBatchedResponse([])
      setCurrentBatchIndex(0)
      setIsLoading(false)
      setIsPaused(false)
      setIsTyping(false)
    }
  }, [batchedResponse, currentBatchIndex, isPaused])

  // Log the session ID when component mounts
  useEffect(() => {
    console.log("Julinho session ID:", sessionId)
  }, [sessionId])

  // Verify cookie consent and set initial theme
  useEffect(() => {
    // Function to check cookie consent
    const checkCookieConsent = () => {
      const consentGiven = localStorage.getItem("cookie-consent")
      if (consentGiven) {
        // Show the widget after a delay
        setTimeout(() => {
          setIsVisible(true)
        }, 1000)
      }
    }

    // Check immediately
    checkCookieConsent()

    // Set initial theme after component mounts
    // setTheme(theme)

    // Configure a listener for storage changes
    const handleStorageChange = () => {
      checkCookieConsent()
    }

    window.addEventListener("storage", handleStorageChange)

    // Periodic check
    const interval = setInterval(checkCookieConsent, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [theme])

  // Scroll to the end of the conversation when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, errorMessage, isTyping])

  // Clear error message when the user types
  useEffect(() => {
    if (input && errorMessage) {
      setErrorMessage(null)
    }
  }, [input, errorMessage])

  // Function to send message to the webhook
  const sendMessage = async (userMessage: string) => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      setIsPaused(false)

      // Add the user's message to the list
      const userMessageObj = {
        id: `user_${Date.now()}`,
        role: "user" as const,
        content: userMessage,
        isComplete: true,
      }
      setMessages((prev) => [...prev, userMessageObj])

      // Send the message to the API
      const response = await fetch("/api/julinho", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessageObj],
          sessionId: sessionId, // Pass the session ID to the API
        }),
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = (await response.json()) as ApiResponse

      // Process the response
      if (data.isBatched && data.batches.length > 0) {
        // If it's a batched response, configure for processing
        setBatchedResponse(data.batches)
        setCurrentBatchIndex(0)
        // The loading state will be deactivated when all batches are processed
      } else {
        // If it's a simple response, add directly
        setIsTyping(true)

        // Calculate a natural delay for typing
        const typingDelay = calculateNaturalDelay(
          "isBatched" in data ? data.response : "Desculpe, não consegui processar sua pergunta.",
        )

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant_${Date.now()}`,
              role: "assistant" as const,
              content: "isBatched" in data ? data.response : "Desculpe, não consegui processar sua pergunta.",
              isComplete: true,
            },
          ])
          setIsTyping(false)
          setIsLoading(false)
        }, typingDelay)
      }

      setInput("")
    } catch (error) {
      console.error("Error sending message:", error)
      setErrorMessage("Não foi possível conectar ao Julinho. Por favor, tente novamente mais tarde.")
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage(input.trim())
  }

  // Function to pause/resume typing
  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  // Function to immediately complete the response
  const completeResponse = () => {
    if (batchedResponse.length > 0 && currentBatchIndex < batchedResponse.length) {
      // Add all remaining messages at once
      const remainingBatches = batchedResponse.slice(currentBatchIndex)

      setMessages((prev) => [
        ...prev,
        ...remainingBatches.map((content, index) => ({
          id: `assistant_complete_${Date.now()}_${index}`,
          role: "assistant" as const,
          content,
          isComplete: true,
        })),
      ])

      // Reset the batch state
      setBatchedResponse([])
      setCurrentBatchIndex(0)
      setIsLoading(false)
      setIsPaused(false)
      setIsTyping(false)
    }
  }

  // Determine the position of the widget
  const positionClasses = {
    "bottom-right": isMobile ? "bottom-4 right-4" : "bottom-6 right-6",
    "bottom-left": isMobile ? "bottom-4 left-4" : "bottom-6 left-6",
  }

  // Handle opening the chat
  const handleOpenChat = () => {
    setOpen(true)

    // Track conversation start in Google Analytics
    sendGTMEvent("julinho_conversation_start", {
      event_category: "Engagement",
      event_label: "Julinho Conversation Started",
      session_id: sessionId,
    })

    // Mark as interacted
    localStorage.setItem("julinho-interacted", "true")
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
                  onClick={handleOpenChat}
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
          <DialogHeader className={`p-4 border-b bg-yellow-500 text-black`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-foreground">
                  <Image
                    src="/images/julinho-avatar.webp"
                    alt="Julinho"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <DialogTitle className={`text-lg font-bold julinho-text`}>Julinho</DialogTitle>
                  <DialogDescription className={`text-xs julinho-text`}>Tutor de Português</DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className={`h-8 w-8 rounded-full hover:bg-yellow-500/70 text-black`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30`}>
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
                      : "bg-white text-gray-900 border border-gray-200 shadow-sm rounded-tl-none"
                  }`}
                >
                  <div className="julinho-text">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {!message.isComplete && (
                    <span className="inline-block ml-1 animate-pulse">
                      <span className="sr-only">Digitando...</span>▌
                    </span>
                  )}
                </div>
              </div>
            ))}
            {errorMessage && (
              <div className="flex justify-center">
                <div
                  className={`max-w-[80%] rounded-lg p-3 bg-destructive/10 text-destructive flex items-center gap-2`}
                >
                  <AlertCircle className="h-4 w-4" />
                  {errorMessage}
                </div>
              </div>
            )}
            {/* Typing indicator */}
            {isTyping && (
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
                <div className={`max-w-[75%] rounded-lg p-3 bg-card border border-border shadow-sm rounded-tl-none`}>
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
            {/* Initial loading indicator */}
            {isLoading && !isTyping && batchedResponse.length === 0 && currentBatchIndex === 0 && (
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
                <div className={`max-w-[75%] rounded-lg p-3 bg-card border border-border shadow-sm rounded-tl-none`}>
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

          <form onSubmit={handleSubmit} className={`border-t p-3 flex gap-2 bg-card`}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida sobre português..."
              className={`flex-1 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background border border-input text-foreground placeholder:text-muted-foreground`}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className={`bg-primary hover:bg-primary/90 text-primary-foreground min-w-[40px] h-[40px] flex-shrink-0`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add the CTA component */}
      <JulinhoCTA onOpenChat={handleOpenChat} position={position} />
    </>
  )
}
