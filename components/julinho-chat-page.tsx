"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
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

const JulinhoChatPage = () => {
  const router = useRouter()
  const whatsappNumber = "+5584999401840"
  const whatsappMessage = encodeURIComponent("Olá Julinho! Preciso de ajuda com português.")
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  useEffect(() => {
    // Track event in Google Analytics
    sendGTMEvent("julinho_whatsapp_redirect", {
      event_category: "Navigation",
      event_label: "Redirected to Julinho WhatsApp from Chat Page",
    })

    // Redirect to WhatsApp
    window.location.href = whatsappLink
  }, [whatsappLink])

  return null
}

export default JulinhoChatPage
