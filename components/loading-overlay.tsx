"use client"

import React from "react"

interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
}

/**
 * Loading Overlay Component
 * Shows a modern loading state with pulsing gradient spinner and shimmer text.
 * Used only for desktop to provide visual feedback during processing.
 */
export default function LoadingOverlay({
  message = "Processando...",
  fullScreen = false,
}: LoadingOverlayProps) {
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
