"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"

interface SupportButtonProps {
  className?: string
}

export function SupportButton({ className = "" }: SupportButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const button = buttonRef.current

    const handleClick = () => {
      // Enviar evento para o Google Analytics
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "click", {
          event_category: "blog",
          event_label: "support_button",
          value: 1,
        })
      }

      // Enviar evento para o Meta Pixel se disponível
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("trackCustom", "SupportButtonClick", {
          location: "blog_post",
        })
      }
    }

    if (button) {
      button.addEventListener("click", handleClick)
    }

    return () => {
      if (button) {
        button.removeEventListener("click", handleClick)
      }
    }
  }, [])

  return (
    <Link
      ref={buttonRef}
      href="/apoiar"
      className={`bg-white text-primary border border-primary px-6 py-3 rounded-md font-medium hover:bg-primary/10 transition-colors ${className}`}
    >
      Apoiar
    </Link>
  )
}
