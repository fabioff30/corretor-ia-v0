"use client"

import { useState, useRef } from "react"
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion"
import { X, Settings, Sparkles, FileText, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/hooks/use-haptic"

interface MobileBottomDrawerProps {
  isOpen: boolean
  onClose: () => void
  onAIToggle?: (enabled: boolean) => void
  onToneSelect?: (tone: string) => void
  onFileUpload?: () => void
  aiEnabled?: boolean
  children?: React.ReactNode
  toneOptions?: Array<{ id: string; label: string; icon: string }>
  toneLabel?: string
}

const DRAG_THRESHOLD = 50 // pixels to drag before closing

export function MobileBottomDrawer({
  isOpen,
  onClose,
  onAIToggle,
  onToneSelect,
  onFileUpload,
  aiEnabled = false,
  children,
  toneOptions = [
    { id: 'formal', label: 'Formal', icon: '🎩' },
    { id: 'casual', label: 'Casual', icon: '😊' },
    { id: 'professional', label: 'Profissional', icon: '💼' },
    { id: 'friendly', label: 'Amigável', icon: '👋' },
  ],
  toneLabel = "Tom do Texto"
}: MobileBottomDrawerProps) {
  const haptic = useHaptic()
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 200], [1, 0])

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > DRAG_THRESHOLD) {
      haptic.light()
      onClose()
    }
  }

  const handleClose = () => {
    haptic.medium()
    onClose()
  }

  const handleAIToggle = () => {
    haptic.light()
    onAIToggle?.(!aiEnabled)
  }

  const handleToneClick = (tone: string) => {
    haptic.light()
    onToneSelect?.(tone)
  }

  const handleFileUpload = () => {
    haptic.medium()
    onFileUpload?.()
  }



  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <motion.div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-background rounded-t-3xl shadow-2xl",
          "border-t border-border"
        )}
        style={{ y, opacity }}
        initial={{ y: "100%" }}
        animate={{ y: isOpen ? 0 : "100%" }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-base">Opções Avançadas</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-6">
          {/* AI Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={cn(
                  "h-5 w-5 transition-colors",
                  aiEnabled ? "text-primary" : "text-muted-foreground"
                )} />
                <div>
                  <p className="font-medium text-sm">IA Avançada</p>
                  <p className="text-xs text-muted-foreground">
                    {aiEnabled ? "GPT-4 ativado" : "GPT-3.5 padrão"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAIToggle}
                className={cn(
                  "relative w-14 h-8 rounded-full transition-colors",
                  aiEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <motion.div
                  className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ x: aiEnabled ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>

          {/* Tone Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium text-sm">{toneLabel}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {toneOptions.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => handleToneClick(tone.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl",
                    "border-2 transition-all",
                    "hover:bg-muted active:scale-95",
                    "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-xl">{tone.icon}</span>
                  <span className="text-sm font-medium">{tone.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          {onFileUpload && (
            <button
              onClick={handleFileUpload}
              className={cn(
                "w-full flex items-center justify-center gap-2",
                "px-4 py-3 rounded-xl",
                "border-2 border-dashed border-border",
                "hover:bg-muted hover:border-primary/50",
                "transition-all active:scale-95"
              )}
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Enviar Arquivo</span>
            </button>
          )}

          {/* Custom Children */}
          {children}
        </div>

        {/* Bottom Safe Area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </motion.div>
    </>
  )
}
