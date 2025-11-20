"use client"

import { useState } from "react"
import { MobileHero } from "./mobile-hero"
import { MobileFAB } from "./mobile-fab"
import { MobileBottomDrawer } from "./mobile-bottom-drawer"
import { MobileCorrectionLoading } from "./mobile-correction-loading"
import { MobileCorrectionResult } from "./mobile-correction-result"
import { AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { usePlanLimits } from "@/hooks/use-plan-limits"
import { FREE_CHARACTER_LIMIT, UNLIMITED_CHARACTER_LIMIT, API_REQUEST_TIMEOUT } from "@/utils/constants"
import { sendGTMEvent } from "@/utils/gtm-helper"

interface MobileCorrectionWrapperProps {
  onCorrect?: (text: string) => void
  onFileUpload?: () => void
  isLoading?: boolean
}

/**
 * Wrapper component que orquestra a experiência mobile
 * Integra Hero + FAB + Bottom Drawer
 */
export function MobileCorrectionWrapper({
  onCorrect: propOnCorrect,
  onFileUpload,
  isLoading: propIsLoading = false
}: MobileCorrectionWrapperProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [aiEnabled, setAIEnabled] = useState(false)
  const [viewState, setViewState] = useState<"INPUT" | "LOADING" | "RESULT">("INPUT")
  const [result, setResult] = useState<any>(null)
  const [originalText, setOriginalText] = useState("")
  const [isLoading, setIsLoading] = useState(propIsLoading)

  const { toast } = useToast()
  const { profile } = useUser()
  const { limits } = usePlanLimits()

  const isPremium = profile?.plan_type === "pro" || profile?.plan_type === "admin"
  const resolvedCharacterLimit = isPremium ? UNLIMITED_CHARACTER_LIMIT : limits?.max_characters ?? FREE_CHARACTER_LIMIT
  const isUnlimited = resolvedCharacterLimit === UNLIMITED_CHARACTER_LIMIT || resolvedCharacterLimit === -1
  const characterLimit = isUnlimited ? null : resolvedCharacterLimit

  const handleSettingsClick = () => {
    setIsDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
  }

  const handleAIToggle = (enabled: boolean) => {
    setAIEnabled(enabled)
  }

  const handleToneSelect = (tone: string) => {
    console.log('Tone selected:', tone)
    // TODO: Implement tone adjustment logic
  }

  const handleHelpClick = () => {
    // TODO: Navigate to help page or show help dialog
    console.log('Help clicked')
  }

  const handleHistoryClick = () => {
    // TODO: Navigate to history page or show history drawer
    console.log('History clicked')
  }

  const handleCorrect = async (text: string) => {
    if (!text.trim()) return

    setOriginalText(text)
    setViewState("LOADING")
    setIsLoading(true)

    try {
      // Verificar limite de caracteres
      if (!isUnlimited && characterLimit !== null && text.length > characterLimit) {
        throw new Error(`O texto excede o limite de ${characterLimit} caracteres.`)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT)

      const response = await fetch("/api/correct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          isMobile: true,
          tone: "Padrão", // Default tone for now
          useAdvancedAI: aiEnabled && isPremium
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao corrigir texto")
      }

      const data = await response.json()

      setResult({
        correctedText: data.correctedText,
        evaluation: data.evaluation
      })
      setViewState("RESULT")

      sendGTMEvent("correction_success", {
        is_mobile: true,
        is_premium: isPremium,
        char_count: text.length
      })

    } catch (error: any) {
      console.error("Correction error:", error)
      toast({
        title: "Erro na correção",
        description: error.message || "Ocorreu um erro ao processar seu texto.",
        variant: "destructive"
      })
      setViewState("INPUT")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setViewState("INPUT")
    setResult(null)
    setOriginalText("")
  }

  // Render based on view state
  if (viewState === "LOADING") {
    return <MobileCorrectionLoading />
  }

  if (viewState === "RESULT" && result) {
    return (
      <MobileCorrectionResult
        originalText={originalText}
        correctedText={result.correctedText}
        evaluation={result.evaluation}
        onReset={handleReset}
      />
    )
  }

  return (
    <div className="relative min-h-[100dvh]">
      {/* Main Content */}
      <MobileHero
        onSubmit={handleCorrect}
        onFileUpload={onFileUpload}
        isLoading={isLoading}
        onAIToggle={handleAIToggle}
        aiEnabled={aiEnabled}
      />

      {/* Floating Action Button */}
      <MobileFAB
        onSettingsClick={handleSettingsClick}
        onFileUpload={onFileUpload}
        onAIToggle={() => handleAIToggle(!aiEnabled)}
        onHistoryClick={handleHistoryClick}
        onHelpClick={handleHelpClick}
      />

      {/* Bottom Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <MobileBottomDrawer
            isOpen={isDrawerOpen}
            onClose={handleDrawerClose}
            onAIToggle={handleAIToggle}
            onToneSelect={handleToneSelect}
            onFileUpload={onFileUpload}
            aiEnabled={aiEnabled}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
