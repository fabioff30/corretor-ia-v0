"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { MobileHero } from "./mobile-hero"
import { MobileFAB } from "./mobile-fab"
import { MobileCorrectionLoading } from "./mobile-correction-loading"
import { MobileCorrectionResult } from "./mobile-correction-result"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { usePlanLimits } from "@/hooks/use-plan-limits"
import { FREE_CHARACTER_LIMIT, UNLIMITED_CHARACTER_LIMIT, API_REQUEST_TIMEOUT } from "@/utils/constants"
import { sendGTMEvent } from "@/utils/gtm-helper"

const FREE_CORRECTIONS_STORAGE_KEY = "corretoria:free-corrections-usage"

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
  const [aiEnabled, setAIEnabled] = useState(false)
  const [viewState, setViewState] = useState<"INPUT" | "LOADING" | "RESULT">("INPUT")
  const [result, setResult] = useState<any>(null)
  const [originalText, setOriginalText] = useState("")
  const [isLoading, setIsLoading] = useState(propIsLoading)
  const [freeCorrectionsCount, setFreeCorrectionsCount] = useState(0)
  const [selectedTone, setSelectedTone] = useState<string>("Padrão")
  const [customTone, setCustomTone] = useState<string>("")

  const { toast } = useToast()
  const { profile } = useUser()
  const { limits } = usePlanLimits()

  const isPremium = profile?.plan_type === "pro" || profile?.plan_type === "admin" || profile?.plan_type === "lifetime"
  const correctionsDailyLimit = limits?.corrections_per_day ?? 3

  // Função para ler o uso de correções gratuitas do localStorage
  const readFreeCorrectionUsage = useCallback(() => {
    if (typeof window === "undefined") {
      return { date: "", count: 0 }
    }
    const today = new Date().toISOString().split("T")[0]

    try {
      const raw = window.localStorage.getItem(FREE_CORRECTIONS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { date?: string; count?: number }
        if (parsed.date === today) {
          return { date: today, count: parsed.count ?? 0 }
        }
      }
    } catch {
      // Ignore parse errors
    }

    const initialValue = { date: today, count: 0 }
    window.localStorage.setItem(FREE_CORRECTIONS_STORAGE_KEY, JSON.stringify(initialValue))
    return initialValue
  }, [])

  // Carregar uso ao montar o componente
  useEffect(() => {
    if (isPremium) {
      setFreeCorrectionsCount(0)
      return
    }
    const usage = readFreeCorrectionUsage()
    setFreeCorrectionsCount(usage.count)
  }, [isPremium, readFreeCorrectionUsage])
  const resolvedCharacterLimit = isPremium ? UNLIMITED_CHARACTER_LIMIT : limits?.max_characters ?? FREE_CHARACTER_LIMIT
  const isUnlimited = resolvedCharacterLimit === UNLIMITED_CHARACTER_LIMIT || resolvedCharacterLimit === -1
  const characterLimit = isUnlimited ? null : resolvedCharacterLimit

  // Set default AI toggle for premium users
  useEffect(() => {
    if (isPremium) {
      setAIEnabled(true)
    }
  }, [isPremium])

  const handleAIToggle = (enabled: boolean) => {
    // Permite marcar o toggle mesmo para usuários free
    // O bloqueio visual será feito pelo overlay no input
    setAIEnabled(enabled)
  }

  const handleToneChange = (tone: string, customInstruction?: string) => {
    setSelectedTone(tone)
    if (tone === "Personalizado" && customInstruction) {
      setCustomTone(customInstruction)
    }
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

    // Scroll para o topo ao iniciar correção
    window.scrollTo({ top: 0, behavior: 'smooth' })

    setOriginalText(text)
    setViewState("LOADING")
    setIsLoading(true)

    try {
      // Verificar limite de caracteres
      if (!isUnlimited && characterLimit !== null && text.length > characterLimit) {
        throw new Error(`O texto excede o limite de ${characterLimit} caracteres.`)
      }

      // Determinar tom atual
      const currentTone = selectedTone === "Personalizado" ? customTone : selectedTone

      // Escolher endpoint baseado no tom
      const endpoint = currentTone !== "Padrão" ? "/api/tone" : "/api/correct"

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          isMobile: true,
          tone: currentTone,
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

      // Processar resposta (diferente para /api/tone)
      if (endpoint === "/api/tone") {
        setResult({
          correctedText: data.adjustedText,
          evaluation: data.evaluation
        })
      } else {
        setResult({
          correctedText: data.correctedText,
          evaluation: data.evaluation
        })
      }
      setViewState("RESULT")

      // Incrementar contagem de correções gratuitas se for usuário free
      if (!isPremium) {
        const usage = readFreeCorrectionUsage()
        const newCount = usage.count + 1
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            FREE_CORRECTIONS_STORAGE_KEY,
            JSON.stringify({ date: usage.date, count: newCount })
          )
        }
        setFreeCorrectionsCount(newCount)
      }

      sendGTMEvent("text_corrected", {
        text_length: text.length,
        score: data.evaluation?.score || 0,
        is_premium: isPremium,
        tone: currentTone,
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
        usageCount={freeCorrectionsCount}
        usageLimit={correctionsDailyLimit}
        onToneChange={handleToneChange}
      />

      {/* Floating Action Button - desabilitado temporariamente */}
      {/* <MobileFAB
        onFileUpload={onFileUpload}
        onAIToggle={() => handleAIToggle(!aiEnabled)}
        onHistoryClick={handleHistoryClick}
        onHelpClick={handleHelpClick}
      /> */}
    </div>
  )
}
