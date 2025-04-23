"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Send, ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import { useMediaQuery } from "@/hooks/use-media-query"
import { sendGTMEvent } from "@/utils/gtm-helper"

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

export function JulinhoChatPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)
  const [batchedResponse, setBatchedResponse] = useState<string[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const [newMessageCount, setNewMessageCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastScrollPositionRef = useRef<number>(0)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Redirect desktop users back to the main page
  useEffect(() => {
    if (isDesktop) {
      router.push("/")
    }
  }, [isDesktop, router])

  // Initialize the chat
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      // Get session ID from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search)
      const urlSessionId = urlParams.get("session")
      const storedSessionId = localStorage.getItem("julinho-session-id")

      const activeSessionId =
        urlSessionId || storedSessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      setSessionId(activeSessionId)
      localStorage.setItem("julinho-session-id", activeSessionId)

      // Get stored messages or set welcome message
      const storedMessages = localStorage.getItem(`julinho-messages-${activeSessionId}`)
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages))
      } else {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Olá! Eu sou o Julinho, seu tutor de língua portuguesa. Como posso ajudar você hoje? Pode me perguntar sobre gramática, ortografia, sintaxe ou qualquer dúvida relacionada ao português!",
            isComplete: true,
          },
        ])
      }

      setIsInitialized(true)

      // Track page view
      sendGTMEvent("julinho_chat_page_view", {
        event_category: "Engagement",
        event_label: "Julinho Chat Page Viewed",
        session_id: activeSessionId,
      })

      // Mark as interacted
      localStorage.setItem("julinho-interacted", "true")
    }
  }, [isInitialized, router])

  // Save messages to localStorage when they change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      localStorage.setItem(`julinho-messages-${sessionId}`, JSON.stringify(messages))
    }
  }, [messages, sessionId])

  // Focus input when page loads
  useEffect(() => {
    if (inputRef.current && isInitialized) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 500)
    }
  }, [isInitialized])

  // More robust function to check if user is near bottom of chat
  const isNearBottom = useCallback(() => {
    if (!chatContainerRef.current) return true

    const container = chatContainerRef.current
    const threshold = 150 // pixels from bottom to consider "near bottom"
    const position = container.scrollHeight - container.scrollTop - container.clientHeight

    return position < threshold
  }, [])

  // Handle scroll events with debounce to determine if auto-scroll should be enabled
  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Store the current scroll position
      lastScrollPositionRef.current = chatContainerRef.current.scrollTop

      // Mark that the user has manually scrolled
      setUserHasScrolled(true)

      // Debounce the scroll event to avoid excessive state updates
      scrollTimeoutRef.current = setTimeout(() => {
        const isAtBottom = isNearBottom()
        setShouldAutoScroll(isAtBottom)

        // If we're at the bottom, reset the new message counter
        if (isAtBottom) {
          setNewMessageCount(0)
        }
      }, 100)
    }

    const chatContainer = chatContainerRef.current
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll, { passive: true })
      return () => {
        chatContainer.removeEventListener("scroll", handleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [isNearBottom])

  // Controlled scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!messagesEndRef.current || !chatContainerRef.current) return

    const chatContainer = chatContainerRef.current
    const scrollHeight = chatContainer.scrollHeight

    chatContainer.scrollTo({
      top: scrollHeight,
      behavior: behavior,
    })

    // Reset state after scrolling to bottom
    setShouldAutoScroll(true)
    setNewMessageCount(0)
    setUserHasScrolled(false)
  }, [])

  // Handle initial scroll and new messages
  useEffect(() => {
    // On initial load, scroll to bottom immediately
    if (messages.length > 0 && !userHasScrolled) {
      scrollToBottom("auto")
      return
    }

    // For new messages, only auto-scroll if we were already at the bottom
    if (shouldAutoScroll && messagesEndRef.current && chatContainerRef.current) {
      // Use requestAnimationFrame to ensure the DOM has updated before scrolling
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    } else if (!shouldAutoScroll && messages.length > 0) {
      // If we're not at the bottom and a new message arrives, increment the counter
      setNewMessageCount((prev) => prev + 1)
    }
  }, [messages, shouldAutoScroll, userHasScrolled, scrollToBottom])

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
        // Add a new message for each batch without triggering auto-scroll
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

      // Add the user's message to the list without triggering auto-scroll
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
          sessionId: sessionId,
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

    // Prevent default form behavior that might cause scrolling
    e.preventDefault()

    sendMessage(input.trim())
  }

  // Function to go back to the main page
  const handleBack = () => {
    router.push("/")
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#128C7E]"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-100">
      {/* Header - WhatsApp style with fixed height */}
      <header className="bg-[#075E54] text-white p-3 flex items-center gap-3 shadow-md z-10 h-16 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-8 w-8 rounded-full hover:bg-[#128C7E]/20 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
          <Image
            src="/images/julinho-avatar.webp"
            alt="Julinho"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">Julinho</h1>
          <p className="text-xs text-white/90 truncate">Tutor de Português</p>
        </div>

        {/* Scroll to bottom button - only visible when not at bottom */}
        {!shouldAutoScroll && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scrollToBottom()}
            className="h-8 w-8 rounded-full bg-[#128C7E]/20 hover:bg-[#128C7E]/40 text-white"
            aria-label="Rolar para o final da conversa"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </Button>
        )}
      </header>

      {/* Chat area with absolute positioning for typing indicator */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 bg-[#E5DDD5] relative"
        style={{
          height: "calc(100vh - 16rem)", // Subtract header (4rem) and input area (4rem) heights
          maxHeight: "calc(100vh - 16rem)",
          backgroundImage: "url('/images/chat-bg-pattern.png')",
          backgroundRepeat: "repeat",
          scrollBehavior: "auto", // Prevent smooth scrolling from interfering with manual scrolling
        }}
      >
        {/* Messages container */}
        <div className="flex flex-col space-y-4 min-h-full">
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
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-[#E1FFC7] text-gray-800 rounded-tr-none"
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

          {/* Error message - positioned in the flow */}
          {errorMessage && (
            <div className="flex justify-center">
              <div className="max-w-[80%] rounded-lg p-3 bg-destructive/10 text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errorMessage}
              </div>
            </div>
          )}

          {/* Typing indicator - positioned in the flow */}
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
              <div className="max-w-[75%] rounded-lg p-3 bg-white border border-gray-200 shadow-sm rounded-tl-none">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-[#128C7E] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-[#128C7E] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-[#128C7E] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Initial loading indicator - positioned in the flow */}
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
              <div className="max-w-[75%] rounded-lg p-3 bg-white border border-gray-200 shadow-sm rounded-tl-none">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-[#128C7E] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-[#128C7E] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-[#128C7E] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input area - Fixed at bottom with consistent height */}
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2 bg-white shadow-lg z-10 h-16 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua dúvida sobre português..."
          className="flex-1 px-3 py-3 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-[#128C7E] bg-background border border-input text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          className="bg-[#128C7E] hover:bg-[#075E54] text-white min-w-[44px] h-[44px] flex-shrink-0 rounded-full"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>

      {/* Floating scroll to bottom button with unread count - appears when not at bottom and new messages arrive */}
      {!shouldAutoScroll && newMessageCount > 0 && (
        <div className="absolute bottom-20 right-4 z-20">
          <Button
            onClick={() => scrollToBottom()}
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg bg-[#128C7E] hover:bg-[#075E54] text-white relative"
            aria-label={`${newMessageCount} novas mensagens, rolar para baixo`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>

            {/* Unread message counter */}
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {newMessageCount}
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}
