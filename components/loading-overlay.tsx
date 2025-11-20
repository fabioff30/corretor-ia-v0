"use client"

import React from "react"
import { Loader2 } from "lucide-react"

export default function LoadingOverlay({
  message = "Processando...",
  fullScreen = false,
}: {
  message?: string
  fullScreen?: boolean
}) {
  return (
    <div
      className={`loading-overlay ${fullScreen ? "fullscreen" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="loading-overlay__box">
        <div className="loading-spinner" aria-hidden="true" />
        <div className="loading-text">{message}</div>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  )
}
