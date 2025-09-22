"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextDiff } from "@/components/text-diff"
import {
  Loader2,
  Copy,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Clock,
  Heart,
  Shield,
  CheckCircle,
  Crown,
  User,
  Brain,
  Target,
  BarChart3,
  Info,
  Languages,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { useSubscription } from "@/hooks/use-subscription"
import { useAuth} from "@/contexts/unified-auth-context"
import { Badge } from "@/components/ui/badge"
import { SupabaseConfigNotice } from "@/components/supabase-config-notice"
import Link from "next/link"
import {
  HUMANIZE_LIMITS,
  HUMANIZE_MODES,
  API_REQUEST_TIMEOUT,
  MIN_REQUEST_INTERVAL
} from "@/utils/constants"

// Importar o utilitário do Meta Pixel
import { trackPixelCustomEvent } from "@/utils/meta-pixel"

interface HumanizeFormProps {
  onTextHumanized?: () => void
}

interface AiDetectionSignal {
  category: string
  direction: string
  description: string
  terms: string[]
  count: number
}

interface BrasileirismoTerm {
  term: string
  region?: string
  occurrences?: number
  examples?: string[]
}

interface BrasileirismoMetadata {
  score?: number
  label?: string
  level?: string
  description?: string
  explanation?: string
  summary?: string
  terms?: Array<BrasileirismoTerm | string>
  regionalTerms?: Array<BrasileirismoTerm | string>
  markers?: Array<BrasileirismoTerm | string>
  suggestions?: string[]
  recommendation?: string
  hasRegionalisms?: boolean
  missingRegionalisms?: boolean
}

interface AiAnalysisResult {
  verdict: string
  probability: number
  confidence: string
  explanation: string
  signals: AiDetectionSignal[]
  metadata?: {
    promptVersion?: string
    termsVersion?: string
    models?: string[]
    brasileirismo?: BrasileirismoMetadata
    brasileirismos?: BrasileirismoMetadata
  }
}

interface AiAnalysisResponse {
  result: AiAnalysisResult
  termsSnapshot?: {
    totalHits?: number
    uniqueTerms?: string[]
    weightedScore?: number
    collections?: Array<{ name: string; count: number }>
  }
  textStats?: {
    charCount?: number
    wordCount?: number
    sentenceCount?: number
    avgSentenceLength?: number
    avgWordLength?: number
  }
  metadata?: {
    promptVersion?: string
    termsVersion?: string
    termsSignature?: string
    models?: string[]
    brasileirismo?: BrasileirismoMetadata
    brasileirismos?: BrasileirismoMetadata
  }
}

// Interface para o resultado da humanização
interface HumanizeResult {
  analysis: {
    aiTermsFound: string[]
    aiTermsCount: number
    density: number
    probability: number
    confidence: "low" | "medium" | "high"
    patterns: string[]
    // Extended analysis fields
    aiTermOccurrences?: Record<string, number>
    aiUniqueTermsCount?: number
    densityByCategory?: Record<string, number>
    score?: number
    spans?: Record<string, any>
    length?: number
  }
  humanizedText: string
  changes: string[]
  blockedTermsRemoved: Record<string, number>
  mode: string
  fallback?: boolean
  explanation?: {
    probability: number
    confidence: string
    breakdown: Array<{
      factor: string
      name: string
      value: number
      percentage: number
      description: string
    }>
    termContributions?: Array<{
      term: string
      category: string
      weight: number
      contribution: number
    }>
    whyNoTerms?: string
    improvementTips?: string[]
    textStats: {
      wordCount: number
      termsFound: number
      uniqueTerms: number
      density: number
    }
    domainAdjustments: {
      mode: string
      description: string
    }
  }
}

// Interface para informações de uso
interface UsageInfo {
  usage: number
  limit: number
  remaining: number
  resetTime: number
  period: 'daily' | 'monthly'
  isPremium: boolean
}

const ANALYSIS_API_URL = process.env.NEXT_PUBLIC_ANALYSIS_AI_URL ?? "/api/analyze"
const IS_INTERNAL_ANALYSIS_ENDPOINT = ANALYSIS_API_URL.startsWith("/")

export default function HumanizeForm({ onTextHumanized }: HumanizeFormProps) {
  const [originalText, setOriginalText] = useState("")
  const [charCount, setCharCount] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResponse | null>(null)
  const [humanizeResult, setHumanizeResult] = useState<HumanizeResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [requestTimer, setRequestTimer] = useState<number | null>(null)
  const lastRequestTime = useRef<number>(0)
  const { toast } = useToast()
  const subscription = useSubscription()
  const { user } = useAuth()
  const selectedMode = "DEFAULT" as keyof typeof HUMANIZE_MODES
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)
  const [currentStep, setCurrentStep] = useState<"input" | "analysis" | "rewrite">("input")

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Limpar o timer quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (requestTimer) {
        clearTimeout(requestTimer)
      }
    }
  }, [requestTimer])

  // Atualizar a contagem de caracteres quando o texto mudar
  useEffect(() => {
    setCharCount(originalText.length)
  }, [originalText])

  // Calcular contagem de palavras
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Carregar informações de uso
  useEffect(() => {
    const loadUsageInfo = async () => {
      try {
        const headers: Record<string, string> = {}

        if (subscription.isPremium) {
          headers["x-user-premium"] = "true"
          headers["x-user-plan"] = "premium"
        }

        if (user?.id) {
          headers["x-user-id"] = user.id
        }

        const response = await fetch("/api/analyze", {
          method: "GET",
          headers,
        })

        if (response.ok) {
          const data = await response.json()
          setUsageInfo(data.usage)
        }
      } catch (error) {
        console.error("Erro ao carregar informações de uso:", error)
      }
    }

    loadUsageInfo()
  }, [subscription.isPremium, user?.id])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value

    if (newText.length <= HUMANIZE_LIMITS.CHARACTER_LIMIT) {
      setOriginalText(newText)
      setIsTyping(newText.length > 0)
    } else {
      setOriginalText(newText.slice(0, HUMANIZE_LIMITS.CHARACTER_LIMIT))
      setIsTyping(true)
      toast({
        title: "Limite de caracteres atingido",
        description: `O texto foi limitado a ${HUMANIZE_LIMITS.CHARACTER_LIMIT} caracteres.`,
        variant: "destructive",
      })
    }
  }

  // Função para sanitizar texto
  const sanitizeText = (text: string) => {
    let sanitized = text
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/[\r\n]+/g, "\n")

    sanitized = sanitized.replace(/<(?!br\s*\/?)[^>]+>/gi, "")

    if (sanitized.length > HUMANIZE_LIMITS.CHARACTER_LIMIT) {
      sanitized = sanitized.substring(0, HUMANIZE_LIMITS.CHARACTER_LIMIT)
    }

    return sanitized
  }

  // Verificar se o texto contém conteúdo suspeito
  const containsSuspiciousContent = (text: string): boolean => {
    const suspiciousPatterns = [
      /<script>/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /eval\(/i,
      /document\.cookie/i,
      /fetch\(/i,
      /localStorage/i,
      /sessionStorage/i,
    ]

    return suspiciousPatterns.some((pattern) => pattern.test(text))
  }

  // Função para análise do texto
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verificar texto vazio
    if (!originalText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, insira um texto para análise de IA.",
        variant: "destructive",
      })
      return
    }

    // Verificar limite de caracteres
    if (originalText.length > HUMANIZE_LIMITS.CHARACTER_LIMIT) {
      toast({
        title: "Texto muito longo",
        description: `Por favor, reduza o texto para no máximo ${HUMANIZE_LIMITS.CHARACTER_LIMIT} caracteres.`,
        variant: "destructive",
      })
      return
    }

    // Verificar conteúdo suspeito
    if (containsSuspiciousContent(originalText)) {
      toast({
        title: "Conteúdo não permitido",
        description: "O texto contém conteúdo que não é permitido. Por favor, remova qualquer código ou script.",
        variant: "destructive",
      })
      return
    }

    // Verificar limite de uso
    if (usageInfo && usageInfo.usage >= usageInfo.limit) {
      const resetMessage = usageInfo.isPremium
        ? "Tente novamente amanhã"
        : "Tente novamente no próximo mês"

      toast({
        title: "Limite de uso excedido",
        description: `Você atingiu o limite de ${usageInfo.limit} ${usageInfo.isPremium ? 'uso(s) por dia' : 'uso por mês'}. ${resetMessage}`,
        variant: "destructive",
      })
      return
    }

    // Verificar intervalo entre requisições
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime.current

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000)
      toast({
        title: "Muitas requisições",
        description: `Por favor, aguarde ${waitTime} segundos antes de enviar outra solicitação.`,
        variant: "destructive",
      })
      return
    }

    lastRequestTime.current = now

    // Sanitizar o texto antes de enviar
    const textToSend = sanitizeText(originalText)

    setIsAnalyzing(true)
    setError(null)

    // Configurar um timeout para a requisição
    const timeoutId = window.setTimeout(() => {
      if (isAnalyzing) {
        setIsAnalyzing(false)
        setError("O servidor demorou muito para responder. Por favor, tente novamente.")
        toast({
          title: "Tempo limite excedido",
          description: "O servidor demorou muito para responder. Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    }, API_REQUEST_TIMEOUT)

    setRequestTimer(timeoutId)

    try {
      console.log("Cliente: Iniciando requisição de análise")

      // Configurar o controller para o timeout
      const controller = new AbortController()
      const signal = controller.signal

      // Preparar o payload
      const payload = IS_INTERNAL_ANALYSIS_ENDPOINT
        ? {
            text: textToSend,
            mode: HUMANIZE_MODES[selectedMode],
          }
        : {
            text: textToSend,
          }

      console.log(`Cliente: Enviando texto para análise no modo: ${HUMANIZE_MODES[selectedMode]}`)

      // Preparar headers incluindo informações premium
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (IS_INTERNAL_ANALYSIS_ENDPOINT) {
        // Apenas encaminhar cabeçalhos especiais para o backend Next.js
        if (subscription.isPremium) {
          headers["x-user-premium"] = "true"
          headers["x-user-plan"] = "premium"
        }

        if (user?.id) {
          headers["x-user-id"] = user.id
        }
      }

      const response = await fetch(ANALYSIS_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal,
      })

      console.log(`Cliente: Resposta recebida com status ${response.status}`)

      // Limpar o timeout se a resposta chegar
      clearTimeout(timeoutId)
      setRequestTimer(null)

      if (!response.ok) {
        let errorMessage = "Erro na resposta do servidor"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || `Erro na resposta do servidor: ${response.status}`
        } catch (e) {
          errorMessage = `Erro na resposta do servidor: ${response.status}`
        }

        // Mensagens específicas para diferentes códigos de status
        if (response.status === 504) {
          errorMessage = "O servidor demorou muito para responder. Por favor, tente novamente."
        } else if (response.status === 429) {
          errorMessage = "Você atingiu o limite de uso. Por favor, aguarde antes de tentar novamente."
        } else if (response.status === 413) {
          errorMessage = "O texto é muito grande. Por favor, reduza o tamanho do texto."
        }

        throw new Error(errorMessage)
      }

      // Processar a resposta
      console.log("Cliente: Processando resposta JSON")
      const data: AiAnalysisResponse = await response.json()
      console.log("Cliente: Resposta JSON processada com sucesso", data)

      setAnalysisResult(data)
      setCurrentStep("analysis")

      // Atualizar informações de uso
      if (usageInfo) {
        setUsageInfo({
          ...usageInfo,
          usage: usageInfo.usage + 1,
          remaining: Math.max(0, usageInfo.remaining - 1)
        })
      }

      // Marcar que o texto foi analisado
      localStorage.setItem("text-analyzed", "true")

      // Enviar evento para o GTM
      sendGTMEvent("text_analyzed", {
        textLength: originalText.length,
        mode: selectedMode,
        verdict: data.result?.verdict || "unknown",
        probability: data.result?.probability || 0,
        confidence: data.result?.confidence || "low",
        signalsCount: data.result?.signals?.length || 0,
      })

      // Rastrear evento no Meta Pixel
      trackPixelCustomEvent("TextAnalyzed", {
        text_length: originalText.length,
        mode: selectedMode,
        verdict: data.result?.verdict || "unknown",
        probability: data.result?.probability || 0,
        confidence: data.result?.confidence || "low",
      })

      toast({
        title: "Análise de IA concluída!",
        description: "Confira os resultados da análise abaixo.",
      })

      // Chamar o callback se existir
      if (onTextHumanized) {
        onTextHumanized()
      }
    } catch (error) {
      const err = error as Error
      // Limpar o timeout se ocorrer um erro
      clearTimeout(timeoutId)
      setRequestTimer(null)

      console.error("Cliente: Erro ao processar o texto:", err)

      // Mensagem de erro específica para AbortError (timeout do fetch)
      if (err.name === "AbortError") {
        setError("O servidor demorou muito para responder. Por favor, tente novamente.")
      } else {
        setError(`Erro ao processar o texto: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      }

      toast({
        title: "Erro na análise de IA",
        description: err instanceof Error ? err.message : "Não foi possível processar a solicitação. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Função para reescrita do texto
  const handleRewrite = async () => {
    if (!originalText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, insira um texto para reescrita.",
        variant: "destructive",
      })
      return
    }

    setIsRewriting(true)
    setError(null)

    // Configurar um timeout para a requisição
    const timeoutId = window.setTimeout(() => {
      if (isRewriting) {
        setIsRewriting(false)
        setError("O servidor demorou muito para responder. Por favor, tente novamente.")
        toast({
          title: "Tempo limite excedido",
          description: "O servidor demorou muito para responder. Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    }, API_REQUEST_TIMEOUT)

    setRequestTimer(timeoutId)

    try {
      console.log("Cliente: Iniciando requisição de reescrita")

      const controller = new AbortController()
      const signal = controller.signal

      const payload = {
        text: originalText,
        mode: HUMANIZE_MODES[selectedMode],
      }

      console.log(`Cliente: Enviando texto para reescrita no modo: ${HUMANIZE_MODES[selectedMode]}`)

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (subscription.isPremium) {
        headers["x-user-premium"] = "true"
        headers["x-user-plan"] = "premium"
      }

      if (user?.id) {
        headers["x-user-id"] = user.id
      }

      const response = await fetch("/api/humanize", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal,
      })

      console.log(`Cliente: Resposta de reescrita recebida com status ${response.status}`)

      clearTimeout(timeoutId)
      setRequestTimer(null)

      if (!response.ok) {
        let errorMessage = "Erro na resposta do servidor"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || `Erro na resposta do servidor: ${response.status}`
        } catch (e) {
          errorMessage = `Erro na resposta do servidor: ${response.status}`
        }

        if (response.status === 504) {
          errorMessage = "O servidor demorou muito para responder. Por favor, tente novamente."
        } else if (response.status === 429) {
          errorMessage = "Você atingiu o limite de uso. Por favor, aguarde antes de tentar novamente."
        } else if (response.status === 413) {
          errorMessage = "O texto é muito grande. Por favor, reduza o tamanho do texto."
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Cliente: Resposta de reescrita processada com sucesso", data)

      setHumanizeResult(data)
      setCurrentStep("rewrite")

      // Enviar evento para o GTM
      sendGTMEvent("text_rewritten", {
        textLength: originalText.length,
        mode: selectedMode,
      })

      // Rastrear evento no Meta Pixel
      trackPixelCustomEvent("TextRewritten", {
        text_length: originalText.length,
        mode: selectedMode,
      })

      toast({
        title: "Texto reescrito com sucesso!",
        description: "Confira o texto humanizado abaixo.",
      })

    } catch (error) {
      const err = error as Error
      clearTimeout(timeoutId)
      setRequestTimer(null)

      console.error("Cliente: Erro ao reescrever o texto:", err)

      if (err.name === "AbortError") {
        setError("O servidor demorou muito para responder. Por favor, tente novamente.")
      } else {
        setError(`Erro ao reescrever o texto: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      }

      toast({
        title: "Erro na reescrita",
        description: err instanceof Error ? err.message : "Não foi possível processar a solicitação. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsRewriting(false)
    }
  }

  const handleCopy = () => {
    if (humanizeResult) {
      navigator.clipboard.writeText(humanizeResult.humanizedText)

      // Enviar evento para o GTM
      sendGTMEvent("humanized_text_copied", {
        textLength: humanizeResult.humanizedText.length,
      })

      toast({
        title: "Copiado!",
        description: "O texto humanizado foi copiado para a área de transferência.",
      })
    }
  }

  const handleReset = () => {
    setOriginalText("")
    setAnalysisResult(null)
    setHumanizeResult(null)
    setError(null)
    setIsTyping(false)
    setCurrentStep("input")
  }

  // Calcular a cor do contador de caracteres
  const getCounterColor = () => {
    if (charCount > HUMANIZE_LIMITS.CHARACTER_LIMIT * 0.9) return "text-red-500"
    if (charCount > HUMANIZE_LIMITS.CHARACTER_LIMIT * 0.7) return "text-yellow-500"
    return "text-muted-foreground"
  }

  // Renderizar análise de IA com linguagem visual da plataforma
  const renderAIAnalysis = () => {
    if (!analysisResult?.result) return null

    const { result, textStats, metadata, termsSnapshot } = analysisResult
    const probabilityPercentage = Math.round((result.probability ?? 0) * 1000) / 10

    const verdictKey = result.verdict?.toLowerCase?.() || "indefinido"

    const verdictTheme: Record<string, { label: string; badge: string; accent: string; chip: string; contrast: string }> = {
      human: {
        label: "Provável autoria humana",
        badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        accent: "text-emerald-500",
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        contrast: "text-emerald-900",
      },
      ai: {
        label: "Provável texto gerado por IA",
        badge: "bg-rose-100 text-rose-700 border border-rose-200",
        accent: "text-rose-500",
        chip: "bg-rose-50 text-rose-700 border-rose-200",
        contrast: "text-rose-900",
      },
      mixed: {
        label: "Mistura de traços humanos e IA",
        badge: "bg-amber-100 text-amber-700 border border-amber-200",
        accent: "text-amber-500",
        chip: "bg-amber-50 text-amber-700 border-amber-200",
        contrast: "text-amber-900",
      },
    }

    const verdictConfig = verdictTheme[verdictKey] ?? {
      label: "Resultado disponível",
      badge: "bg-blue-100 text-blue-700 border border-blue-200",
      accent: "text-blue-500",
      chip: "bg-blue-50 text-blue-700 border-blue-200",
      contrast: "text-blue-900",
    }

    const confidenceLabel = result.confidence === "high" ? "Alta confiança" : result.confidence === "medium" ? "Confiança moderada" : "Confiança baixa"

    const renderSignalBadge = (direction: string) => {
      const dir = direction?.toLowerCase?.()
      if (dir === "ai") return "bg-rose-50 text-rose-700 border border-rose-200"
      if (dir === "human") return "bg-emerald-50 text-emerald-700 border border-emerald-200"
      return "bg-slate-50 text-slate-700 border border-slate-200"
    }

    const accentColorMap: Record<string, string> = {
      "text-emerald-500": "#10B981",
      "text-rose-500": "#F43F5E",
      "text-amber-500": "#F59E0B",
      "text-blue-500": "#3B82F6",
    }

    const strokeColor = accentColorMap[verdictConfig.accent] ?? "#3B82F6"

    const brasileirismoData = (result.metadata?.brasileirismo ??
      result.metadata?.brasileirismos ??
      analysisResult.metadata?.brasileirismo ??
      analysisResult.metadata?.brasileirismos) as BrasileirismoMetadata | undefined

    const getBrasileirismoTerms = (data?: BrasileirismoMetadata) => {
      if (!data) return []
      const candidates = [data.terms, data.regionalTerms, data.markers]
      const flattened = candidates
        .filter((entry): entry is Array<BrasileirismoTerm | string> => Array.isArray(entry) && entry.length > 0)
        .flat()
      return flattened.map((item) => (typeof item === "string" ? { term: item } : item)).filter(Boolean)
    }

    const brasileirismoTerms = getBrasileirismoTerms(brasileirismoData)
    const brasileirismoSuggestions = Array.isArray(brasileirismoData?.suggestions)
      ? (brasileirismoData?.suggestions as string[]).filter((tip) => typeof tip === "string" && tip.trim().length > 0)
      : []
    const hasBrasileirismoBlock =
      (brasileirismoData &&
        (typeof brasileirismoData.score === "number" ||
          brasileirismoData.label ||
          brasileirismoData.level ||
          brasileirismoData.description ||
          brasileirismoData.explanation ||
          brasileirismoData.summary ||
          brasileirismoTerms.length > 0 ||
          brasileirismoSuggestions.length > 0)) ||
      false

    const brasileirismoScorePercentage =
      typeof brasileirismoData?.score === "number"
        ? Math.round(Math.min(Math.max(brasileirismoData.score, 0), 1) * 1000) / 10
        : null

    const derivedBrasileirismoLabel =
      brasileirismoData?.label ||
      brasileirismoData?.level ||
      (brasileirismoScorePercentage !== null
        ? brasileirismoScorePercentage >= 60
          ? "Presença forte"
          : brasileirismoScorePercentage >= 30
            ? "Presença moderada"
            : "Presença baixa"
        : null)

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${verdictConfig.badge}`}>
                  <Brain className="h-4 w-4" />
                  {verdictConfig.label}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className={`text-2xl font-semibold ${verdictConfig.contrast}`}>Probabilidade associada</h3>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Interpretamos os principais sinais do texto para estimar se ele foi escrito por pessoas ou por modelos de IA. A porcentagem abaixo está diretamente ligada ao veredito destacado.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Veredito</p>
                  <p className={`text-lg font-semibold ${verdictConfig.contrast}`}>{verdictConfig.label}</p>
                  <p className="text-xs text-muted-foreground">Probabilidade de que o texto tenha sido gerado por IA.</p>
                </div>
                <div className="flex items-center justify-center sm:justify-end">
                  <div className="relative flex h-28 w-28 items-center justify-center">
                    <svg className="h-28 w-28 -rotate-90" viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r="60" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                      <circle
                        cx="70"
                        cy="70"
                        r="60"
                        fill="none"
                        strokeWidth="10"
                        strokeLinecap="round"
                        stroke={strokeColor}
                        strokeDasharray={`${(probabilityPercentage / 100) * 377} 377`}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${verdictConfig.contrast}`}>{probabilityPercentage.toFixed(1)}%</span>
                      <span className="text-[10px] text-muted-foreground">{confidenceLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {result.signals?.length > 0 && (
          <div className="rounded-xl border border-border bg-background/80 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Principais sinais identificados</h4>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {result.signals.map((signal, index) => (
                <div key={`${signal.category}-${index}`} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground capitalize">{signal.category}</p>
                      <p className="text-xs text-muted-foreground">{signal.description}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`min-w-[84px] text-[11px] font-medium leading-tight tracking-tight whitespace-nowrap px-3 py-1 text-center ${renderSignalBadge(signal.direction)}`}
                    >
                      {signal.direction === "ai" ? "Sinal de IA" : signal.direction === "human" ? "Sinal humano" : signal.direction}
                    </Badge>
                  </div>
                  {signal.terms?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {signal.terms.map((term) => (
                        <Badge key={term} variant="outline" className="bg-white text-[11px] font-medium text-muted-foreground">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">Ocorrências: {signal.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasBrasileirismoBlock && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
            <div className="mb-3 flex items-center gap-2">
              <Languages className="h-5 w-5 text-emerald-500" />
              <h4 className="text-lg font-semibold text-emerald-900">Brasileirismos e regionalismos</h4>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr,2fr]">
              <div className="space-y-2">
                {derivedBrasileirismoLabel && (
                  <div className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1 text-sm font-medium text-emerald-700 shadow-sm">
                    <span>{derivedBrasileirismoLabel}</span>
                    {brasileirismoScorePercentage !== null && (
                      <span className="text-xs text-emerald-500/80">{brasileirismoScorePercentage.toFixed(1)}% de termos regionais</span>
                    )}
                  </div>
                )}
                {brasileirismoData?.description && (
                  <p className="text-sm text-emerald-800/90">{brasileirismoData.description}</p>
                )}
                {!brasileirismoData?.description && brasileirismoData?.explanation && (
                  <p className="text-sm text-emerald-800/90">{brasileirismoData.explanation}</p>
                )}
                {!brasileirismoData?.description && !brasileirismoData?.explanation && brasileirismoData?.summary && (
                  <p className="text-sm text-emerald-800/90">{brasileirismoData.summary}</p>
                )}
                {brasileirismoData?.missingRegionalisms && (
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/80">
                    Nenhum brasileirismo típico identificado.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {brasileirismoTerms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Termos em destaque</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {brasileirismoTerms.map((term, index) => (
                        <Badge key={`${term.term}-${index}`} variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                          <span>{term.term}</span>
                          {term.region && <span className="ml-1 text-[10px] text-emerald-500">({term.region})</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {brasileirismoSuggestions.length > 0 && (
                  <div className="rounded-lg border border-emerald-200/80 bg-white/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Como aproveitar</p>
                    <ul className="mt-2 space-y-1 text-sm text-emerald-800/90">
                      {brasileirismoSuggestions.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {brasileirismoData?.recommendation && (
                  <div className="rounded-lg border border-emerald-200/80 bg-white/70 p-3 text-sm text-emerald-800/90">
                    {brasileirismoData.recommendation}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(textStats || termsSnapshot) && (
          <div className="rounded-xl border border-border bg-background/80 p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Como seu texto se comporta</h4>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Palavras</p>
                <p className="text-2xl font-semibold text-foreground">{textStats?.wordCount ?? "--"}</p>
                <p className="text-xs text-muted-foreground">Quantidade analisada</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sentenças</p>
                <p className="text-2xl font-semibold text-foreground">{textStats?.sentenceCount ?? "--"}</p>
                <p className="text-xs text-muted-foreground">Fluxos avaliados</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tamanho médio</p>
                <p className="text-2xl font-semibold text-foreground">{textStats?.avgSentenceLength ? `${textStats.avgSentenceLength.toFixed(1)} palavras` : "--"}</p>
                <p className="text-xs text-muted-foreground">por sentença</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Termos únicos</p>
                <p className="text-2xl font-semibold text-foreground">{termsSnapshot?.uniqueTerms?.length ?? textStats?.wordCount ?? "--"}</p>
                <p className="text-xs text-muted-foreground">Diversidade lexical</p>
              </div>
            </div>
          </div>
        )}

        {metadata?.models && metadata.models.length > 0 && (
          <div className="rounded-xl border border-border bg-background/80 p-6">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Modelos consultados</h4>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Unimos múltiplos detectores para reduzir falsos positivos e entregar um resultado mais confiável.
            </p>
            <div className="flex flex-wrap gap-2">
              {metadata.models.map((model) => (
                <Badge key={model} variant="outline" className={`${verdictConfig.chip} text-xs`}>
                  {model}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  // Renderizar mudanças de humanização
  const renderHumanizationChanges = () => {
    if (!humanizeResult || !humanizeResult.changes || humanizeResult.changes.length === 0) return null

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center mb-4">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <h4 className="text-lg font-semibold text-green-800">Melhorias Aplicadas</h4>
        </div>
        <ul className="space-y-3">
          {humanizeResult.changes.map((change, index) => (
            <li key={index} className="bg-white border border-green-100 p-3 rounded-md shadow-sm">
              <div className="flex items-start">
                <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-green-700">{change}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderRewriteInsights = () => {
    if (!humanizeResult) return null

    const improvements = humanizeResult.changes || []
    const termsRemoved = humanizeResult.blockedTermsRemoved || {}
    const termsEntries = Object.entries(termsRemoved)

    return (
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-primary mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Como o texto foi ajustado
          </h4>
          <p className="text-sm text-muted-foreground">
            O texto foi reescrito para soar mais natural e reduzir sinais típicos de inteligência artificial, mantendo o significado original.
          </p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <h4 className="text-lg font-semibold text-foreground">Melhorias aplicadas</h4>
          </div>
          {improvements.length > 0 ? (
            <ul className="space-y-3">
              {improvements.map((change, index) => (
                <li key={`${change}-${index}`} className="bg-white dark:bg-slate-800 p-3 rounded-md border shadow-sm">
                  <div className="flex items-start">
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground/90">{change}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma melhoria específica foi informada pelo serviço.</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Shield className="h-5 w-5 text-blue-500 mr-2" />
            <h4 className="text-lg font-semibold text-blue-800">Termos removidos</h4>
          </div>
          {termsEntries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {termsEntries.map(([term, count]) => (
                <Badge key={term} variant="outline" className="bg-white text-blue-700 border-blue-200 text-xs">
                  {term} ({count}x)
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-blue-700">Nenhum termo específico precisou ser removido durante a humanização.</p>
          )}
        </div>
      </div>
    )
  }

  // Função para formatar o texto preservando quebras de linha
  const formatText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    ))
  }

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-4 sm:p-6">
        {/* Aviso de configuração do Supabase */}
        <SupabaseConfigNotice />

        {error && (
          <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro no serviço</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Informações de uso */}
        {usageInfo && (
          <div className="mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Brain className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">
                    Detector de IA - {usageInfo.usage}/{usageInfo.limit} usos {usageInfo.isPremium ? 'hoje' : 'este mês'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {usageInfo.remaining > 0
                      ? `${usageInfo.remaining} ${usageInfo.remaining === 1 ? 'uso restante' : 'usos restantes'}`
                      : 'Limite atingido'
                    }
                  </p>
                </div>
              </div>
              {usageInfo.isPremium && (
                <Badge className="bg-amber-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
        )}

        {!user || !subscription.isPremium ? (
          <div className="mb-4 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start">
            <div className="flex-shrink-0 mr-2 mt-0.5">
              {!user ? (
                <User className="h-5 w-5 text-amber-500" />
              ) : (
                <Heart className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="text-sm text-foreground/80">
              {!user ? (
                <p>
                  <strong>Detector de IA:</strong> Identifica padrões artificiais e, se quiser, permite reescrever o texto com linguagem mais humana.{" "}
                  <Link
                    href="/upgrade"
                    className="font-medium text-amber-500 hover:text-amber-600 underline decoration-dotted underline-offset-2 transition-colors px-1 rounded hover:bg-amber-500/10"
                  >
                    Upgrade para CorretorIA Pro
                  </Link>
                  {" "}para 2 usos por dia por apenas R$ 19,90/mês.
                </p>
              ) : (
                <p>
                  <strong>Detector de IA:</strong> Analise textos com precisão para descobrir indícios de autoria artificial.{" "}
                  <Link
                    href="/apoiar"
                    className="font-medium text-green-500 hover:text-green-600 underline decoration-dotted underline-offset-2 transition-colors px-1 rounded hover:bg-green-500/10"
                  >
                    Apoie nosso projeto
                  </Link>
                  {" "}para manter este serviço ativo.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center">
            <Crown className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm text-foreground/80">
              <strong>CorretorIA Pro ativado!</strong> Você tem acesso a 2 análises completas por dia.
            </p>
          </div>
        )}

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="Cole o texto para descobrir a probabilidade de ter sido escrito por IA... (até 10.000 palavras)"
              className="min-h-[200px] max-h-[400px] resize-y text-base p-4 focus-visible:ring-primary bg-background border rounded-lg text-foreground"
              value={originalText}
              onChange={handleTextChange}
              disabled={isAnalyzing || isRewriting}
              maxLength={HUMANIZE_LIMITS.CHARACTER_LIMIT}
              aria-label="Texto para detecção de autoria por IA (até 10.000 palavras)"
            />
            <div className="absolute top-3 right-3">
              <div
                className={`transition-opacity duration-300 ${
                  isTyping ? "opacity-0" : "opacity-100"
                } hidden md:flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs`}
              >
                <Brain className="h-3 w-3 mr-1" />
                <span>Detecção de IA</span>
              </div>
            </div>
          </div>

          {/* Contador de caracteres e palavras */}
          <div className={`text-xs text-right ${getCounterColor()}`}>
            <div className="flex items-center justify-end gap-4">
              <span>{getWordCount(originalText)} palavras</span>
              <span>{charCount}/{HUMANIZE_LIMITS.CHARACTER_LIMIT} caracteres</span>
              {subscription.isPremium && (
                <Badge variant="outline" className="text-xs">
                  Premium
                </Badge>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3 justify-end">
            {originalText && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isAnalyzing || isRewriting}
                className="w-full sm:w-auto order-3 sm:order-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20 relative group w-full sm:w-auto order-2 sm:order-2"
              asChild
            >
              <Link href="/apoiar">
                <Heart className="mr-2 h-4 w-4 transition-transform group-hover:animate-heartbeat" />
                <span className="relative z-10">Doar</span>
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={
                isAnalyzing ||
                !originalText.trim() ||
                charCount > HUMANIZE_LIMITS.CHARACTER_LIMIT ||
                (usageInfo && usageInfo.usage >= usageInfo.limit) ||
                currentStep !== "input"
              }
              className="px-6 relative overflow-hidden group w-full sm:w-auto order-1 sm:order-3"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando IA...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  Analisar IA
                </>
              )}
            </Button>
          </div>

          {/* Aviso de tempo de processamento */}
          {(isAnalyzing || isRewriting) && (
            <div className="flex items-center justify-center text-xs text-muted-foreground mt-2">
              <Clock className="h-3 w-3 mr-1" />
              <span>Análise pode levar até 45 segundos para ser concluída</span>
            </div>
          )}
        </form>

        {/* Resultado da análise */}
        {analysisResult && currentStep === "analysis" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">Análise de IA Concluída</h3>
                    <p className="text-sm text-blue-700/80">Revise os sinais detectados antes de optar pela reescrita.</p>
                  </div>
                </div>
                <Button
                  onClick={handleRewrite}
                  disabled={isRewriting}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  {isRewriting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reescrevendo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Reescrever Texto
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-6">
              {renderAIAnalysis()}
            </div>
          </motion.div>
        )}

        {/* Resultado da reescrita */}
        {humanizeResult && currentStep === "rewrite" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <Tabs defaultValue="humanized" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 bg-muted/50 p-0.5 sm:p-1 rounded-lg text-xs sm:text-sm">
                <TabsTrigger
                  value="humanized"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                >
                  Texto reescrito
                </TabsTrigger>
                <TabsTrigger
                  value="diff"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                >
                  Comparação
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                >
                  Melhorias & termos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="humanized" className="mt-0">
                <Card className="shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap mb-4 text-foreground border text-left text-sm sm:text-base leading-relaxed">
                      {formatText(humanizeResult.humanizedText)}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="diff" className="mt-0">
                <Card>
                  <CardContent className="p-2 sm:p-4 md:p-6">
                    <TextDiff
                      original={originalText}
                      corrected={humanizeResult.humanizedText}
                      originalLabel="Texto original"
                      correctedLabel="Texto reescrito"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="mt-0">
                <Card>
                  <CardContent className="p-4 md:p-6">
                    {renderRewriteInsights()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {false && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4 md:mb-6 bg-muted/50 p-0.5 sm:p-1 rounded-lg text-xs sm:text-sm">
                <TabsTrigger
                  value="analysis"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                >
                  Análise IA
                </TabsTrigger>
                <TabsTrigger
                  value="humanized"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                >
                  Humanizado
                </TabsTrigger>
                <TabsTrigger
                  value="diff"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                >
                  Comparação
                </TabsTrigger>
                <TabsTrigger
                  value="changes"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                >
                  Mudanças
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="mt-0">
                <Card className="shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    {renderAIAnalysis()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="humanized" className="mt-0">
                <Card className="shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap mb-4 text-foreground border text-left text-sm sm:text-base leading-relaxed">
                      {formatText(humanizeResult?.humanizedText || "")}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto text-xs sm:text-sm py-2 h-auto"
                      >
                        <Copy className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Copiar Texto
                      </Button>
                      <Button
                        onClick={() => {
                          sendGTMEvent("donation_button_click", {
                            source: "humanization_result",
                            textLength: humanizeResult?.humanizedText?.length || 0,
                            amount: 5,
                            location: "result_actions",
                          })
                          window.location.href = "/apoiar?valor=5"
                        }}
                        size="sm"
                        className="w-full sm:w-auto text-xs sm:text-sm py-2 h-auto bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
                      >
                        <Heart className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-pulse" />
                        Doar R$5
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="diff" className="mt-0">
                <Card>
                  <CardContent className="p-2 sm:p-4 md:p-6">
                    <TextDiff original={originalText} corrected={humanizeResult?.humanizedText || ""} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="changes" className="mt-0">
                <Card>
                  <CardContent className="p-4 md:p-6">
                    {renderHumanizationChanges()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        <style jsx global>{`
         @keyframes heartbeat {
           0%, 100% { transform: scale(1); }
           25% { transform: scale(1.4); }
           50% { transform: scale(1); }
           75% { transform: scale(1.2); }
         }

         .animate-heartbeat {
           animation: heartbeat 1.2s ease-in-out infinite;
         }
       `}</style>
      </CardContent>
    </Card>
  )
}
