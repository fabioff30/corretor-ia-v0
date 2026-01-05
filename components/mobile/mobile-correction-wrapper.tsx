"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { createClient } from "@/lib/supabase/client"
import {
  uploadToStorage,
  deleteFromStorage,
  shouldUseStorageUpload,
} from "@/lib/supabase/storage"

const FREE_CORRECTIONS_STORAGE_KEY = "corretoria:free-corrections-usage"

// File upload constants
const FREE_FORMATS = ["pdf", "docx", "txt", "html"]
const PREMIUM_FORMATS = ["pdf", "docx", "xlsx", "pptx", "txt", "html", "csv", "xml", "json"]
const FREE_MAX_SIZE_MB = 10
const PREMIUM_MAX_SIZE_MB = 50

/**
 * Sanitizes text extracted from documents
 */
function sanitizeExtractedText(text: string): string {
  if (!text) return text
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

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
  const [isConvertingFile, setIsConvertingFile] = useState(false)
  const [inputText, setInputText] = useState("")
  const [quickMode, setQuickMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    // Modo rápido e IA Avançada são mutuamente exclusivos
    if (enabled) {
      setQuickMode(false)
    }
  }

  const handleQuickModeToggle = (enabled: boolean) => {
    setQuickMode(enabled)
    // Modo rápido e IA Avançada são mutuamente exclusivos
    if (enabled) {
      setAIEnabled(false)
    }
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

  // File upload handler
  const allowedFormats = isPremium ? PREMIUM_FORMATS : FREE_FORMATS
  const maxSizeMB = isPremium ? PREMIUM_MAX_SIZE_MB : FREE_MAX_SIZE_MB

  const handleFileUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files[0]) return

    const file = files[0]
    const ext = file.name.toLowerCase().split(".").pop() || ""
    const sizeMB = file.size / 1024 / 1024

    // Validate format
    if (!allowedFormats.includes(ext)) {
      toast({
        title: "Formato não suportado",
        description: isPremium
          ? `Formato .${ext} não é suportado.`
          : `Formatos permitidos: ${FREE_FORMATS.join(", ").toUpperCase()}`,
        variant: "destructive",
      })
      e.target.value = ""
      return
    }

    // Validate size
    if (sizeMB > maxSizeMB) {
      toast({
        title: "Arquivo muito grande",
        description: `Tamanho máximo: ${maxSizeMB}MB. Seu arquivo: ${sizeMB.toFixed(1)}MB`,
        variant: "destructive",
      })
      e.target.value = ""
      return
    }

    // Start conversion
    setIsConvertingFile(true)
    const useStorageUpload = shouldUseStorageUpload(file.size)

    sendGTMEvent('file_upload_started', {
      file_type: ext,
      file_size_mb: sizeMB.toFixed(2),
      plan: isPremium ? 'premium' : 'free',
      upload_method: useStorageUpload ? 'storage' : 'direct',
      device: 'mobile',
    })

    let storagePath: string | undefined

    try {
      // Get session (optional)
      let session = null
      let userId: string | undefined

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          userId = user.id
          const { data: sessionData } = await supabase.auth.getSession()
          session = sessionData?.session || null
        }
      } catch {
        // Continue as guest
      }

      let data: any

      if (useStorageUpload) {
        toast({
          title: "Enviando arquivo...",
          description: "Processando arquivo grande...",
        })

        const uploadResult = await uploadToStorage(file, userId)

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error("Falha no upload do arquivo")
        }

        storagePath = uploadResult.path

        toast({
          title: "Convertendo documento...",
          description: "Extraindo texto do arquivo.",
        })

        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (session) {
          headers.Authorization = `Bearer ${session.access_token}`
        }

        const response = await fetch("/api/convert-from-url", {
          method: "POST",
          headers,
          body: JSON.stringify({
            fileUrl: uploadResult.url,
            filename: file.name,
            storagePath: storagePath,
          }),
        })

        const responseText = await response.text()
        try {
          data = JSON.parse(responseText)
        } catch {
          throw new Error("Erro ao processar resposta do servidor")
        }

        if (!response.ok) {
          throw new Error(data.message || data.error || "Conversão falhou")
        }
      } else {
        // Direct upload for small files
        toast({
          title: "Convertendo documento...",
          description: "Extraindo texto do arquivo.",
        })

        const formData = new FormData()
        formData.append("file", file)

        const headers: HeadersInit = {}
        if (session) {
          headers.Authorization = `Bearer ${session.access_token}`
        }

        const response = await fetch("/api/convert", {
          method: "POST",
          headers,
          body: formData,
        })

        const responseText = await response.text()
        try {
          data = JSON.parse(responseText)
        } catch {
          if (response.status === 413) {
            throw new Error(`Arquivo muito grande (${sizeMB.toFixed(1)}MB).`)
          }
          throw new Error("Erro ao processar resposta do servidor")
        }

        if (!response.ok) {
          throw new Error(data.message || data.error || "Conversão falhou")
        }
      }

      // Extract and set text
      const extractedText = data.plain_text || data.markdown
      const sanitizedText = sanitizeExtractedText(extractedText)

      // Limit text if needed
      const finalText = characterLimit && sanitizedText.length > characterLimit
        ? sanitizedText.slice(0, characterLimit)
        : sanitizedText

      setInputText(finalText)

      sendGTMEvent('file_upload_completed', {
        file_type: ext,
        file_size_mb: sizeMB.toFixed(2),
        words_extracted: data.metadata?.words || 0,
        plan: isPremium ? 'premium' : 'free',
        device: 'mobile',
      })

      toast({
        title: "Arquivo convertido!",
        description: `${data.metadata?.words || 0} palavras extraídas`,
      })

      // Clean up storage file
      if (storagePath) {
        deleteFromStorage(storagePath).catch(() => {})
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"

      sendGTMEvent('file_upload_error', {
        file_type: ext,
        error_message: errorMessage,
        plan: isPremium ? 'premium' : 'free',
        device: 'mobile',
      })

      toast({
        title: "Erro na conversão",
        description: errorMessage,
        variant: "destructive",
      })

      if (storagePath) {
        deleteFromStorage(storagePath).catch(() => {})
      }
    } finally {
      setIsConvertingFile(false)
      e.target.value = ""
    }
  }

  const handleCorrect = async (text: string) => {
    if (!text.trim()) return

    // Verificar limite de correções para usuários gratuitos ANTES de processar
    if (!isPremium) {
      const usage = readFreeCorrectionUsage()
      if (usage.count >= correctionsDailyLimit) {
        sendGTMEvent("free_correction_limit_reached", {
          limit: correctionsDailyLimit,
          usage: usage.count,
        })

        // Redirect to premium page
        window.location.href = "/premium"
        return
      }
    }

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

      // Determinar tom atual (ignorado no modo rápido)
      const currentTone = quickMode ? "Padrão" : (selectedTone === "Personalizado" ? customTone : selectedTone)

      // Escolher endpoint baseado no tom (modo rápido sempre usa /api/correct)
      const endpoint = quickMode ? "/api/correct" : (currentTone !== "Padrão" ? "/api/tone" : "/api/correct")

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
          useAdvancedAI: aiEnabled && isPremium,
          quickMode: quickMode
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
        quick_mode: quickMode,
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept={allowedFormats.map((f) => `.${f}`).join(",")}
        onChange={handleFileChange}
        disabled={isConvertingFile}
      />

      {/* Main Content */}
      <MobileHero
        onSubmit={handleCorrect}
        onFileUpload={handleFileUploadClick}
        isLoading={isLoading || isConvertingFile}
        onAIToggle={handleAIToggle}
        aiEnabled={aiEnabled}
        usageCount={freeCorrectionsCount}
        usageLimit={correctionsDailyLimit}
        onToneChange={handleToneChange}
        showToneAdjuster={false}
        quickMode={quickMode}
        onQuickModeChange={handleQuickModeToggle}
        initialText={inputText}
        onTextChange={setInputText}
        isConvertingFile={isConvertingFile}
      />

      {/* Floating Action Button - desabilitado temporariamente */}
      {/* <MobileFAB
        onFileUpload={handleFileUploadClick}
        onAIToggle={() => handleAIToggle(!aiEnabled)}
        onHistoryClick={handleHistoryClick}
        onHelpClick={handleHelpClick}
      /> */}
    </div>
  )
}
