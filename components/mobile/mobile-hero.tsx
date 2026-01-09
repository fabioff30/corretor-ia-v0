"use client"

import React, { useState } from "react"
import Image from "next/image"
import { MobileCorrectionInput } from "./mobile-correction-input"
import { MobileQuickStats } from "./mobile-quick-stats"
import { useUser } from "@/hooks/use-user"
import { FREE_CHARACTER_LIMIT, PREMIUM_CHARACTER_LIMIT } from "@/utils/constants"
import { motion } from "framer-motion"

interface MobileHeroProps {
  onSubmit?: (text: string) => void
  onFileUpload?: () => void
  isLoading?: boolean
  onAIToggle?: (enabled: boolean) => void
  aiEnabled?: boolean
  title?: React.ReactNode
  subtitle?: string
  badges?: Array<{ text: string; icon: string; color: string }>
  placeholder?: string
  showStats?: boolean
  // Custom button text
  submitButtonText?: string
  loadingButtonText?: string
  // Style selector props
  showStyleSelector?: boolean
  selectedStyle?: string
  selectedStyleLabel?: string
  onStyleClick?: () => void
  // Control AI toggle visibility
  showAIToggle?: boolean
  // Usage tracking props
  usageCount?: number
  usageLimit?: number
  // Tone adjustment props
  onToneChange?: (tone: string, customInstruction?: string) => void
  showToneAdjuster?: boolean
  // Quick mode props
  quickMode?: boolean
  onQuickModeChange?: (enabled: boolean) => void
  // SEO: Allow pages with desktop H1 to use H2 on mobile
  headingAs?: 'h1' | 'h2'
  // File upload controlled state
  initialText?: string
  onTextChange?: (text: string) => void
  isConvertingFile?: boolean
  // Operation mode for analytics
  operationMode?: "correct" | "rewrite"
}

export function MobileHero({
  onSubmit,
  onFileUpload,
  isLoading = false,
  onAIToggle,
  aiEnabled = false,
  title = <>Corretor de Texto e<br />Ortográfico com IA</>,
  subtitle = "Corrija erros gramaticais, ortográficos e de estilo em português com inteligência artificial.",
  badges = [
    { text: "Gratuito", icon: "✓", color: "text-green-500" },
    { text: "Rápido", icon: "⚡", color: "text-blue-500" },
    { text: "Preciso", icon: "✨", color: "text-purple-500" },
  ],
  placeholder = "Cole ou digite seu texto aqui...",
  showStats = true,
  submitButtonText,
  loadingButtonText,
  showStyleSelector,
  selectedStyle,
  selectedStyleLabel,
  onStyleClick,
  showAIToggle,
  usageCount = 0,
  usageLimit = 3,
  onToneChange,
  showToneAdjuster = true,
  quickMode = false,
  onQuickModeChange,
  headingAs = 'h1',
  initialText = "",
  onTextChange,
  isConvertingFile = false,
  operationMode = "correct",
}: MobileHeroProps) {
  const HeadingTag = headingAs
  const [localText, setLocalText] = useState("")
  const { user, profile } = useUser()

  // Use controlled text if provided, otherwise use local state
  const text = onTextChange ? initialText : localText
  const setText = onTextChange || setLocalText

  // Sync local state with initialText when it changes (for file upload)
  React.useEffect(() => {
    if (initialText && !onTextChange) {
      setLocalText(initialText)
    }
  }, [initialText, onTextChange])

  const isPremium = profile?.plan_type === 'pro' || profile?.plan_type === 'admin' || profile?.plan_type === 'lifetime'
  const characterLimit = isPremium ? PREMIUM_CHARACTER_LIMIT : FREE_CHARACTER_LIMIT

  const handleSubmit = () => {
    if (onSubmit && text.trim()) {
      onSubmit(text)
    }
  }

  return (
    <motion.section
      className="min-h-[100dvh] flex flex-col px-4 pt-safe pb-safe bg-gradient-to-b from-background via-background to-muted/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header - Compacto */}
      <motion.div
        className="flex flex-col items-center justify-center pt-8 pb-6 px-4 text-center space-y-4 shrink-0"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="space-y-3">
          <Image
            src="/images/logo-corretoria.png"
            alt="CorretorIA"
            width={180}
            height={40}
            priority
            className="h-10 w-auto mx-auto"
          />
          <HeadingTag className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight pb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {title}
          </HeadingTag>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-full border shadow-sm">
              <span className={badge.color}>{badge.icon}</span> {badge.text}
            </div>
          ))}
        </div>

        {showStats && (
          <MobileQuickStats
            rating={4.8}
            reviewCount={5000}
            usageCount={usageCount}
            usageLimit={usageLimit}
            isPremium={isPremium}
          />
        )}
      </motion.div>

      {/* Main Input Area - Centralizado */}
      <motion.div
        className="flex-1 flex items-center justify-center py-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="w-full max-w-2xl">
          <MobileCorrectionInput
            value={text}
            onChange={setText}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            characterLimit={characterLimit}
            onFileUpload={onFileUpload}
            placeholder={placeholder}
            onAIToggle={onAIToggle}
            aiEnabled={aiEnabled}
            submitButtonText={submitButtonText}
            loadingButtonText={loadingButtonText}
            showStyleSelector={showStyleSelector}
            selectedStyle={selectedStyle}
            selectedStyleLabel={selectedStyleLabel}
            onStyleClick={onStyleClick}
            showAIToggle={showAIToggle}
            isLoggedIn={!!user}
            isPremium={isPremium}
            usageCount={usageCount}
            usageLimit={usageLimit}
            onToneChange={onToneChange}
            showToneAdjuster={showToneAdjuster}
            quickMode={quickMode}
            onQuickModeChange={onQuickModeChange}
            operationMode={operationMode}
          />
        </div>
      </motion.div>

      {/* Footer - Premium Badge (if applicable) */}
      {isPremium && (
        <motion.div
          className="flex items-center justify-center h-12 shrink-0"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Premium Ativo</span>
          </div>
        </motion.div>
      )}
    </motion.section>
  )
}
