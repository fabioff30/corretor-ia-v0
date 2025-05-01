"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"

export function JulinhoDesktopRedirect() {
  const router = useRouter()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  useEffect(() => {
    // This component no longer redirects desktop users away from the chat page
    // It's kept for potential future use or modifications
  }, [isDesktop, router])

  return null
}
