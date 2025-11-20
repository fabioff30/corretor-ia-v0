"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextDiff } from "@/components/text-diff"
import { TextEvaluation } from "@/components/features/text-evaluation"
import {
  Loader2,
  Send,
  Copy,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Clock,
  FileText,
  Pencil,
  Wand2,
  CheckCircle,
  Crown,
  LayoutDashboard,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { StarRating } from "@/components/star-rating"
import { usePlanLimits } from "@/hooks/use-plan-limits"
import { useUser } from "@/hooks/use-user"
import { FREE_CHARACTER_LIMIT, UNLIMITED_CHARACTER_LIMIT, API_REQUEST_TIMEOUT, MIN_REQUEST_INTERVAL } from "@/utils/constants"
import { useSSECorrection } from "@/hooks/use-sse-correction"
import { ToneAdjuster } from "@/components/tone-adjuster"
import { AdvancedAIToggle } from "@/components/advanced-ai-toggle"
import { Badge } from "@/components/ui/badge"
import { SupabaseConfigNotice } from "@/components/supabase-config-notice"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RetryButton } from "@/components/ui/retry-button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

// Importar o utilitário do Meta Pixel
import { trackPixelCustomEvent } from "@/utils/meta-pixel"

// Importar componentes de reescrita
import { RewriteStyleSelector } from "@/components/rewrite/rewrite-style-selector"
import { PremiumRewriteUpsellModal } from "@/components/rewrite/premium-rewrite-upsell-modal"
import {
  RewriteStyleInternal,
  STYLE_DISPLAY_TO_INTERNAL,
  STYLE_INTERNAL_TO_DISPLAY,
  convertToApiFormat,
  getRewriteStyle,
} from "@/utils/rewrite-styles"

// Importar componentes de pain banner
import { PainBanner } from "@/components/ads/pain-banner"
import { PainBannerData } from "@/lib/api/response-normalizer"
import { wasPainBannerDismissedThisSession, markPainBannerDismissed } from "@/utils/banner-frequency"

// Importar componente de upload de arquivo
import { FileToTextUploader } from "@/components/file-to-text-uploader"

// Tipos globais para window.gtag estão em types/global.d.ts

interface TextCorrectionFormProps {
  onTextCorrected?: () => void
  initialMode?: OperationMode
  enableCrossNavigation?: boolean // Se habilitado, permite navegação entre páginas
}

// Tipos para os modos de operação
type OperationMode = "correct" | "rewrite"

// Tipos de estilo (mantém retrocompatibilidade com código antigo)
type RewriteStyle = "formal" | "humanized" | "academic" | "creative" | "childlike"

const FREE_CORRECTIONS_STORAGE_KEY = "corretoria:free-corrections-usage"
const LAST_REWRITE_STYLE_KEY = "corretoria:last-rewrite-style"
const SSE_THRESHOLD_CHARS = 5000 // Use SSE streaming for texts > 5000 chars

// Interface para a avaliação de reescrita
interface RewriteEvaluation {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  score: number
  toneChanges: string[]
  styleApplied?: string
  changes?: string[]
  toneApplied?: string
  painBanner?: PainBannerData
}

export default function TextCorrectionForm({ onTextCorrected, initialMode, enableCrossNavigation = false }: TextCorrectionFormProps) {
  const router = useRouter()
  const [originalText, setOriginalText] = useState("")
  const [charCount, setCharCount] = useState(0)
  const [result, setResult] = useState<{
    correctedText: string
    evaluation: RewriteEvaluation
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isConvertingFile, setIsConvertingFile] = useState(false)
  const [requestTimer, setRequestTimer] = useState<number | null>(null)
  const lastRequestTime = useRef<number>(0)
  const { toast } = useToast()
  const [showRating, setShowRating] = useState(false)
  const [correctionId, setCorrectionId] = useState<string>("")
  const { user, profile } = useUser()
  const { limits, loading: limitsLoading, error: limitsError } = usePlanLimits()

  // Hook para SSE streaming (usado para textos grandes)
  const sseCorrection = useSSECorrection()
  const isAdmin = profile?.plan_type === "admin"
  const isPremium = profile?.plan_type === "pro" || isAdmin
  const resolvedCharacterLimit =
    isPremium ? UNLIMITED_CHARACTER_LIMIT : limits?.max_characters ?? FREE_CHARACTER_LIMIT
  const isUnlimited = resolvedCharacterLimit === UNLIMITED_CHARACTER_LIMIT || resolvedCharacterLimit === -1
  const characterLimit = isUnlimited ? null : resolvedCharacterLimit
  const isOverCharacterLimit = !isUnlimited && characterLimit !== null && charCount > characterLimit
  const [selectedTone, setSelectedTone] = useState<
    "Padrão" | "Formal" | "Informal" | "Acadêmico" | "Criativo" | "Conciso" | "Romântico" | "Personalizado"
  >("Padrão")
  const [customTone, setCustomTone] = useState<string>("")
  const [useAdvancedAI, setUseAdvancedAI] = useState(false)

  // Novos estados para a funcionalidade de reescrita
  const [operationMode, setOperationMode] = useState<OperationMode>(initialMode || "correct")
  const [selectedRewriteStyle, setSelectedRewriteStyle] = useState<RewriteStyle>("formal")
  const [selectedRewriteStyleInternal, setSelectedRewriteStyleInternal] = useState<RewriteStyleInternal>("formal")
  const [showPremiumUpsellModal, setShowPremiumUpsellModal] = useState(false)
  const [pendingPremiumStyle, setPendingPremiumStyle] = useState<RewriteStyleInternal | undefined>(undefined)
  const [freeCorrectionsCount, setFreeCorrectionsCount] = useState(0)
  const correctionsDailyLimit = limits?.corrections_per_day ?? 5
  const remainingCorrections = Math.max(correctionsDailyLimit - freeCorrectionsCount, 0)

  // Estado para controlar o pain banner
  const [painBannerData, setPainBannerData] = useState<PainBannerData | null>(null)
  const [showPainBanner, setShowPainBanner] = useState(false)

  const readFreeCorrectionUsage = () => {
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
    } catch (error) {
      console.warn("Não foi possível ler o uso diário de correções gratuitas:", error)
    }

    const initialValue = { date: today, count: 0 }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FREE_CORRECTIONS_STORAGE_KEY, JSON.stringify(initialValue))
    }
    return initialValue
  }

  useEffect(() => {
    if (isPremium) {
      setFreeCorrectionsCount(0)
      return
    }
    const usage = readFreeCorrectionUsage()
    setFreeCorrectionsCount(usage.count)
  }, [isPremium])

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Verificar inicialmente
    checkMobile()

    // Adicionar listener para redimensionamento
    window.addEventListener("resize", checkMobile)

    // Limpar listener
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Carregar último estilo de reescrita do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const saved = window.localStorage.getItem(LAST_REWRITE_STYLE_KEY)
      if (saved && (["formal", "humanized", "academic", "creative", "childlike", "technical", "journalistic", "advertising", "blog_post", "reels_script", "youtube_script", "presentation"] as RewriteStyleInternal[]).includes(saved as RewriteStyleInternal)) {
        const style = saved as RewriteStyleInternal
        setSelectedRewriteStyleInternal(style)
        // Para retrocompatibilidade, também atualiza o antigo estado se for um dos 5 estilos free
        if (["formal", "humanized", "academic", "creative", "childlike"].includes(style)) {
          setSelectedRewriteStyle(style as RewriteStyle)
        }
      }
    } catch (error) {
      console.warn("Não foi possível carregar o último estilo de reescrita:", error)
    }
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

  // Monitorar conclusão do SSE e atualizar o resultado
  useEffect(() => {
    // Only process completed or error states
    if (sseCorrection.status === 'completed' && sseCorrection.result) {
      console.log('SSE completed, updating result')
      setResult({
        correctedText: sseCorrection.result.correctedText,
        evaluation: sseCorrection.result.evaluation as any,
      })
      setIsLoading(false)

      // Incrementar contagem de correções gratuitas se for usuário free
      if (!isPremium && operationMode === "correct") {
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

      toast({
        title: "Processamento concluído!",
        description: "Seu texto foi corrigido com sucesso.",
      })
    } else if (sseCorrection.status === 'error' && sseCorrection.error) {
      console.error('SSE error:', sseCorrection.error)
      setError(sseCorrection.error)
      setIsLoading(false)
      toast({
        title: "Erro no processamento",
        description: sseCorrection.error,
        variant: "destructive",
      })
    }
    // toast is stable from useToast hook, so we can safely omit it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sseCorrection.status, sseCorrection.result, sseCorrection.error])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    // Limitar o texto ao número máximo de caracteres
    if (characterLimit === null || newText.length <= characterLimit) {
      setOriginalText(newText)
      // Atualizar o estado isTyping quando o usuário começar a digitar
      if (newText.length > 0 && !isTyping) {
        setIsTyping(true)
      } else if (newText.length === 0 && isTyping) {
        setIsTyping(false)
      }
    } else {
      // Se o usuário tentar colar um texto maior que o limite, cortar para o tamanho máximo
      setOriginalText(newText.slice(0, characterLimit || FREE_CHARACTER_LIMIT))
      setIsTyping(true)
      toast({
        title: "Limite de caracteres atingido",
        description: `O texto foi limitado a ${characterLimit} caracteres. Assine o Premium para textos de até 5.000 caracteres sem limites!`,
        variant: "destructive",
        action: (
          <Link
            href="/premium"
            className="text-sm font-medium underline-offset-4 hover:underline whitespace-nowrap"
            onClick={() => sendGTMEvent("premium_cta_click", { location: "character_limit_toast" })}
          >
            Ver Premium
          </Link>
        ),
      })
    }
  }

  // Modificar a função handleToneChange para tratar tom personalizado
  const handleToneChange = (tone: string, customInstruction?: string) => {
    setSelectedTone(tone as "Padrão" | "Formal" | "Informal" | "Acadêmico" | "Criativo" | "Conciso" | "Romântico" | "Personalizado")
    if (tone === "Personalizado" && customInstruction) {
      setCustomTone(customInstruction)
      console.log(`Tom personalizado definido: ${customInstruction}`)
    }
    console.log(`Tom selecionado: ${tone}`)
  }

  // Função para lidar com a mudança de estilo de reescrita (novo sistema com validação premium)
  const handleRewriteStyleChange = (style: RewriteStyleInternal) => {
    // Persistir no localStorage
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LAST_REWRITE_STYLE_KEY, style)
      } catch (error) {
        console.warn("Não foi possível salvar o estilo de reescrita:", error)
      }
    }

    setSelectedRewriteStyleInternal(style)

    // Para retrocompatibilidade, também atualiza o antigo estado se for um dos 5 estilos free
    if (["formal", "humanized", "academic", "creative", "childlike"].includes(style)) {
      setSelectedRewriteStyle(style as RewriteStyle)
    }

    // Emitir evento GTM
    sendGTMEvent("rewrite_model_selected", {
      model_id: style,
      tier: ["formal", "humanized", "academic", "creative", "childlike"].includes(style) ? "free" : "premium",
    })

    // Emitir evento Meta Pixel
    trackPixelCustomEvent("RewriteModelSelected", {
      modelId: style,
      tier: ["formal", "humanized", "academic", "creative", "childlike"].includes(style) ? "free" : "premium",
    })

    console.log(`Estilo de reescrita selecionado: ${style}`)
  }

  // Função para lidar quando usuário free tenta selecionar estilo premium
  const handlePremiumStyleLocked = (style: RewriteStyleInternal) => {
    setPendingPremiumStyle(style)
    setShowPremiumUpsellModal(true)

    // Emitir evento GTM
    sendGTMEvent("rewrite_model_locked_premium", {
      model_id: style,
    })

    // Emitir evento Meta Pixel
    trackPixelCustomEvent("PremiumRewriteLocked", {
      modelId: style,
    })
  }

  // Modificar a função sanitizeText para preservar acentuação
  const sanitizeText = (text: string) => {
    // Remover caracteres invisíveis e potencialmente perigosos
    // mas preservar acentuação e caracteres especiais do português
    let sanitized = text
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remover caracteres de largura zero
      .replace(/\u00A0/g, " ") // Substituir espaços não-quebráveis por espaços normais
      .replace(/[\r\n]+/g, "\n") // Normalizar quebras de linha

    // Remover tags HTML exceto <br>, mas preservar acentuação
    sanitized = sanitized.replace(/<(?!br\s*\/?)[^>]+>/gi, "")

    // Limitar o comprimento para evitar problemas com textos muito longos
    if (!isUnlimited && characterLimit !== null && sanitized.length > characterLimit) {
      sanitized = sanitized.substring(0, characterLimit)
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

  /**
   * Retry handler - Re-submits the form with existing text
   * Per frontend-api.md spec (line 263): "Implementar botão 'Tentar novamente'"
   */
  const handleRetry = () => {
    setError(null)
    // Create synthetic event to reuse handleSubmit logic
    const syntheticEvent = {
      preventDefault: () => { },
    } as React.FormEvent
    handleSubmit(syntheticEvent)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verificar texto vazio
    if (!originalText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, insira um texto para processamento.",
        variant: "destructive",
      })
      return
    }

    // Verificar limite de caracteres
    if (!isUnlimited && characterLimit !== null && originalText.length > characterLimit) {
      toast({
        title: "Texto muito longo",
        description: `Por favor, reduza o texto para no máximo ${characterLimit} caracteres.`,
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

    if (!isPremium && operationMode === "correct") {
      const usage = readFreeCorrectionUsage()
      if (usage.count >= correctionsDailyLimit) {
        const description =
          correctionsDailyLimit === 1
            ? "Você já realizou a correção gratuita de hoje. Aproveite 50% OFF no primeiro mês e continue agora!"
            : `Você já realizou ${correctionsDailyLimit} correções gratuitas hoje. Aproveite 50% OFF no primeiro mês e continue agora!`

        toast({
          title: "Oferta Especial - 50% OFF!",
          description,
          variant: "destructive",
          action: (
            <Link
              href="/oferta-especial"
              className="text-sm font-medium underline-offset-4 hover:underline whitespace-nowrap"
              onClick={() => sendGTMEvent("special_offer_cta_click", { location: "correction_limit_toast", trigger: "correction_limit" })}
            >
              Ver Oferta →
            </Link>
          ),
        })

        sendGTMEvent("free_correction_limit_reached", {
          limit: correctionsDailyLimit,
          usage: usage.count,
        })

        // Redirect to special offer page after 2 seconds
        setTimeout(() => {
          window.location.href = "/oferta-especial"
        }, 2000)

        return
      }
    }

    // Verificar se usuário free está tentando usar estilo premium para reescrita
    if (!isPremium && operationMode === "rewrite") {
      const styleDef = getRewriteStyle(selectedRewriteStyleInternal)
      if (styleDef?.tier === "premium") {
        setShowPremiumUpsellModal(true)
        toast({
          title: "Estilo Premium",
          description: "Este estilo de reescrita é exclusivo para assinantes Premium.",
          variant: "destructive",
          action: (
            <Link
              href="/pricing"
              className="text-sm font-medium underline-offset-4 hover:underline whitespace-nowrap"
              onClick={() => sendGTMEvent("premium_cta_click", { location: "premium_style_toast" })}
            >
              Assinar Premium
            </Link>
          ),
        })

        sendGTMEvent("premium_style_blocked", {
          style: selectedRewriteStyleInternal,
          location: "rewrite_form",
        })
        return
      }
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

    // Atualizar o tempo da última requisição
    lastRequestTime.current = now

    // Sanitizar o texto antes de enviar
    const textToSend = sanitizeText(originalText)

    // Gerar um ID único para a correção/reescrita
    const newCorrectionId = crypto.randomUUID()
    setCorrectionId(newCorrectionId)

    setIsLoading(true)
    setError(null)

    // Determine if we should use SSE streaming
    const currentTone = selectedTone === "Personalizado" ? customTone : selectedTone
    const shouldUseSSE =
      textToSend.length > SSE_THRESHOLD_CHARS &&
      operationMode === "correct" &&
      currentTone === "Padrão"

    // If text is large and we're doing standard correction, use SSE streaming
    if (shouldUseSSE) {
      console.log(`Cliente: Usando SSE streaming para texto de ${textToSend.length} caracteres`)

      // For SSE, call worker directly (bypass Next.js BFF)
      // In production, this should be the worker URL from env vars
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'
      const sseEndpoint = isPremium ? '/api/premium-corrigir' : '/api/corrigir'

      // Start SSE correction calling worker directly
      sseCorrection.startCorrection({
        text: textToSend,
        authToken: process.env.NEXT_PUBLIC_WORKER_AUTH_TOKEN || 'dev-auth-token-12345',
        apiUrl: `${workerUrl}${sseEndpoint}`,
      })

      return
    }

    // Configurar um timeout para a requisição
    const timeoutId = window.setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
        setError(
          "O servidor demorou muito para responder. Por favor, tente novamente com um texto menor ou mais tarde.",
        )
        toast({
          title: "Tempo limite excedido",
          description: "O servidor demorou muito para responder. Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    }, API_REQUEST_TIMEOUT)

    setRequestTimer(timeoutId)

    try {
      console.log(
        `Cliente: Iniciando requisição para ${operationMode === "correct" ? "correção" : "reescrita"} de texto`,
      )

      // Configurar o controller para o timeout
      const controller = new AbortController()
      const signal = controller.signal

      // Determinar qual endpoint usar com base no modo de operação e tom selecionado
      const currentTone = selectedTone === "Personalizado" ? customTone : selectedTone
      const endpoint = operationMode === "correct"
        ? (currentTone !== "Padrão" ? "/api/tone" : "/api/correct")
        : "/api/rewrite"

      // Preparar o payload com base no modo de operação
      const payload = {
        text: textToSend,
        isMobile: isMobile,
        ...(operationMode === "correct"
          ? { tone: currentTone, useAdvancedAI: useAdvancedAI && isPremium }
          : { style: selectedRewriteStyle }
        ),
      }

      console.log(`Cliente: Enviando texto para ${endpoint}`)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
          // Se não conseguir parsear o JSON, usar mensagem genérica
          errorMessage = `Erro na resposta do servidor: ${response.status}`
        }

        // Mensagens específicas para diferentes códigos de status
        if (response.status === 504) {
          errorMessage =
            "O servidor demorou muito para responder. Por favor, tente novamente com um texto menor ou mais tarde."
        } else if (response.status === 429) {
          errorMessage =
            "Você fez muitas requisições em um curto período. Por favor, aguarde um momento antes de tentar novamente."
        } else if (response.status === 413) {
          errorMessage = "O texto é muito grande. Por favor, reduza o tamanho do texto."
        }

        throw new Error(errorMessage)
      }

      // Processar a resposta
      console.log("Cliente: Processando resposta JSON")
      const data = await response.json()
      console.log("Cliente: Resposta JSON processada com sucesso", data)

      // Verificar se a resposta tem o formato esperado e criar estrutura padrão se necessário
      const processedData = {
        correctedText: "",
        evaluation: {
          strengths: [],
          weaknesses: [],
          suggestions: [],
          score: 7,
          toneChanges: [], // Adicionar o novo campo toneChanges
          styleApplied: "", // Novo campo para o estilo aplicado na reescrita
          changes: [], // Novo campo para as mudanças feitas na reescrita
        },
      }

      // Processar a resposta com base no endpoint usado
      if (operationMode === "correct") {
        if (endpoint === "/api/tone") {
          // Modo de ajuste de tom dentro da correção
          console.log("Processando resposta de ajuste de tom:", data)

          if (data.adjustedText) {
            processedData.correctedText = data.adjustedText
          }

          if (data.evaluation) {
            processedData.evaluation = {
              strengths: [],
              weaknesses: [],
              suggestions: data.evaluation.suggestions || [],
              score: 0,
              toneChanges: data.evaluation.changes || [],
              styleApplied: "",
              changes: data.evaluation.changes || [],
              toneApplied: data.evaluation.toneApplied || currentTone,
            }
          }
        } else {
          // Modo de correção padrão - formato tradicional
          if (data.correctedText) {
            processedData.correctedText = data.correctedText
          }

          if (data.evaluation) {
            processedData.evaluation = {
              strengths: data.evaluation.strengths || [],
              weaknesses: data.evaluation.weaknesses || [],
              suggestions: data.evaluation.suggestions || [],
              score: data.evaluation.score || 7,
              toneChanges: data.evaluation.toneChanges || [],
              styleApplied: "",
              changes: [],
              // Preserve premium and pain banner fields
              ...(data.evaluation.improvements && { improvements: data.evaluation.improvements }),
              ...(data.evaluation.analysis && { analysis: data.evaluation.analysis }),
              ...(data.evaluation.model && { model: data.evaluation.model }),
              ...(data.evaluation.painBanner && { painBanner: data.evaluation.painBanner }),
            }
          }
        }
      } else {
        // Modo de reescrita - novo formato
        console.log("Processando resposta de reescrita:", data)

        // Verificar se a resposta está no formato da nova API: [{ output: { adjustedText, evaluation } }]
        if (Array.isArray(data) && data.length > 0 && data[0].output) {
          const output = data[0].output

          // Nova API usa adjustedText em vez de correctedText
          if (output.adjustedText) {
            processedData.correctedText = output.adjustedText
          }

          if (output.evaluation) {
            processedData.evaluation = {
              strengths: [],
              weaknesses: [],
              suggestions: output.evaluation.suggestions || [],
              score: 0, // Score 0 para reescrita conforme documentação
              toneChanges: [],
              styleApplied: output.evaluation.toneApplied || selectedRewriteStyle,
              changes: output.evaluation.changes || [],
              toneApplied: output.evaluation.toneApplied
            }
          }
        } else if (data.output && data.output.adjustedText) {
          // Formato alternativo com objeto output no nível superior (nova API)
          processedData.correctedText = data.output.adjustedText

          if (data.output.evaluation) {
            processedData.evaluation = {
              ...processedData.evaluation,
              styleApplied: data.output.evaluation.toneApplied || selectedRewriteStyle,
              changes: data.output.evaluation.changes || [],
              suggestions: data.output.evaluation.suggestions || [],
              score: 0,
              toneApplied: data.output.evaluation.toneApplied
            }
          }
        } else if (data.rewrittenText) {
          // Formato atual do API /api/rewrite
          processedData.correctedText = data.rewrittenText

          if (data.evaluation) {
            processedData.evaluation = {
              strengths: [],
              weaknesses: [],
              suggestions: data.evaluation.suggestions || [],
              score: 0,
              toneChanges: [],
              styleApplied: selectedRewriteStyle,
              changes: data.evaluation.strengths || [],
            }
          }
        } else if (data.correctedText) {
          // Formato alternativo - resposta do n8n webhook
          processedData.correctedText = data.correctedText

          if (data.evaluation) {
            processedData.evaluation = {
              strengths: [],
              weaknesses: [],
              suggestions: data.evaluation.suggestions || [],
              score: 0,
              toneChanges: [],
              styleApplied: data.evaluation.styleApplied || selectedRewriteStyle,
              changes: data.evaluation.changes || [],
            }
          }
        } else {
          console.error("Cliente: Formato de resposta não reconhecido", data)
          throw new Error("Formato de resposta não reconhecido")
        }
      }

      // Processar o texto corrigido (remover aspas extras se necessário)
      let processedText = processedData.correctedText
      if (typeof processedText === "string" && processedText.startsWith('"') && processedText.endsWith('"')) {
        processedText = processedText.slice(1, -1)
      }

      setResult({
        correctedText: processedText,
        evaluation: processedData.evaluation,
      })

      // Detectar e mostrar pain banner para usuários gratuitos (com delay de 5 segundos)
      if (!isPremium && operationMode === "correct" && processedData.evaluation.painBanner) {
        const painBanner = processedData.evaluation.painBanner
        const alreadyDismissed = wasPainBannerDismissedThisSession(painBanner.id)

        if (!alreadyDismissed) {
          // Armazenar dados do banner e mostrar modal após 5 segundos
          setTimeout(() => {
            setPainBannerData(painBanner)
            setShowPainBanner(true)
          }, 5000)
        }
      }

      // Modificar a parte onde definimos os flags após a correção bem-sucedida
      // Localizar a seção após setResult({...}) e antes do toast

      // Anteriormente, aqui havia código para mostrar banners automáticos
      // Removido para melhorar a experiência do usuário
      // Mantemos apenas o registro de que o texto foi corrigido para fins de análise
      localStorage.setItem("text-corrected", "true")

      // Não disparamos mais eventos para mostrar banners
      // window.dispatchEvent(new Event("storage"))
      // window.dispatchEvent(new CustomEvent("showAdBanner"))

      // Disparar eventos para notificar outras partes da aplicação
      window.dispatchEvent(new Event("storage"))
      // Disparar um evento personalizado para garantir que o banner seja exibido
      window.dispatchEvent(new CustomEvent("showAdBanner"))

      // Adicionar um pequeno atraso para garantir que o banner apareça após o toast
      setTimeout(() => {
        // Disparar os eventos novamente após um pequeno atraso
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new CustomEvent("showAdBanner"))
      }, 1000)

      // Mostrar o banner APENAS quando o texto for corrigido com sucesso
      // setShowAdPopup(true)

      // Segundo bloco de código para banners removido
      // localStorage.setItem("text-corrected", "true")
      // localStorage.removeItem("banner-closed")
      // localStorage.setItem("show-ad-banner", "true")
      // window.dispatchEvent(new Event("storage"))

      // Enviar evento para o Google Analytics 4
      if (operationMode === "correct") {
        sendGTMEvent("text_corrected", {
          textLength: originalText.length,
          correctionScore: processedData.evaluation.score || 0,
        })
      } else {
        sendGTMEvent("rewrite_text", {
          textLength: originalText.length,
          rewriteStyle: selectedRewriteStyle,
        })
      }

      // Rastrear evento de correção no Meta Pixel
      trackPixelCustomEvent(operationMode === "correct" ? "TextCorrected" : "TextRewritten", {
        text_length: originalText.length,
        correction_score: processedData.evaluation.score || 0,
        mode: operationMode,
        ...(operationMode === "correct" ? { tone: selectedTone } : { rewrite_style: selectedRewriteStyle }),
      })

      // Adicionar evento específico para Google Analytics quando for reescrita
      if (operationMode === "rewrite") {
        // Verificar se o objeto window.gtag existe
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "rewrite_text", {
            event_category: "text_processing",
            event_label: "Text Rewrite",
            rewrite_style: selectedRewriteStyle,
            applied_style: processedData.evaluation.styleApplied || selectedRewriteStyle,
            text_length: originalText.length,
          })

          console.log("GA event sent: rewrite_text with style:", selectedRewriteStyle)
        }
      }

      toast({
        title: operationMode === "correct" ? "Texto corrigido com sucesso!" : "Texto reescrito com sucesso!",
        description: "Confira os resultados abaixo.",
      })

      if (!isPremium && operationMode === "correct") {
        const usage = readFreeCorrectionUsage()
        const updatedCount = Math.min(correctionsDailyLimit, usage.count + 1)
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            FREE_CORRECTIONS_STORAGE_KEY,
            JSON.stringify({
              date: usage.date || new Date().toISOString().split("T")[0],
              count: updatedCount,
            }),
          )
        }
        setFreeCorrectionsCount(updatedCount)
      }

      // Mostrar a avaliação após a correção bem-sucedida
      setShowRating(true)

      // Chamar o callback se existir
      if (onTextCorrected) {
        onTextCorrected()
      }
    } catch (error) {
      const err = error as Error
      // Limpar o timeout se ocorrer um erro
      clearTimeout(timeoutId)
      setRequestTimer(null)

      console.error(`Cliente: Erro ao processar o texto:`, err)

      // Mensagem de erro específica para AbortError (timeout do fetch)
      if (err.name === "AbortError") {
        setError(
          "O servidor demorou muito para responder. Por favor, tente novamente com um texto menor ou mais tarde.",
        )
      } else if (err.message && err.message.includes("404")) {
        // Erro específico para webhook não encontrado
        setError(
          "O serviço está temporariamente indisponível. Estamos trabalhando para resolver o problema. Por favor, tente novamente mais tarde.",
        )
      } else {
        setError(`Erro ao processar o texto: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      }

      // Garantir que o banner não seja exibido em caso de erro
      // setShowAdPopup(false)

      toast({
        title: operationMode === "correct" ? "Erro ao corrigir texto" : "Erro ao reescrever texto",
        description:
          err instanceof Error
            ? err.message
            : "Não foi possível processar a solicitação. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.correctedText)

      // Enviar evento para o GTM
      sendGTMEvent("text_copied", {
        textLength: result.correctedText.length,
      })

      toast({
        title: "Copiado!",
        description: "O texto foi copiado para a área de transferência.",
      })
    }
  }

  const handleReset = () => {
    setOriginalText("")
    setResult(null)
    setError(null)
    setIsTyping(false)
    setShowRating(false)
  }

  // Handlers do pain banner
  const handlePainBannerClose = () => {
    if (painBannerData) {
      markPainBannerDismissed(painBannerData.id)
    }
    setShowPainBanner(false)
  }

  const handlePainBannerCta = () => {
    setShowPainBanner(false)
    router.push("/premium")
  }

  // Calcular a cor do contador de caracteres
  const getCounterColor = () => {
    if (isUnlimited || characterLimit === null) return "text-muted-foreground"
    if (charCount > characterLimit) return "text-red-500"
    if (charCount > characterLimit * 0.9) return "text-red-500"
    if (charCount > characterLimit * 0.7) return "text-yellow-500"
    return "text-muted-foreground"
  }

  // Adicionar a função para lidar com a submissão da avaliação
  const handleRatingSubmit = (rating: number) => {
    console.log(`Avaliação recebida: ${rating} estrelas`)
    // Aqui você pode implementar a lógica para enviar a avaliação para um backend
    // ou armazená-la de alguma forma
  }

  // Renderizar o novo seletor de estilos de reescrita
  const renderRewriteStyleSelector = () => {
    return (
      <RewriteStyleSelector
        value={selectedRewriteStyleInternal}
        onChange={handleRewriteStyleChange}
        isPremium={isPremium}
        onPremiumLocked={handlePremiumStyleLocked}
      />
    )
  }

  // Função para renderizar o componente de avaliação de reescrita
  const renderRewriteEvaluation = () => {
    if (!result || !result.evaluation) {
      return null
    }

    const { styleApplied, changes } = result.evaluation

    return (
      <div className="space-y-6">
        {/* Estilo Aplicado */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold flex items-center">
              <Wand2 className="h-5 w-5 text-primary mr-2" />
              Estilo Aplicado
            </h4>
            <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
              {styleApplied
                ? styleApplied.charAt(0).toUpperCase() + styleApplied.slice(1)
                : selectedRewriteStyle.charAt(0).toUpperCase() + selectedRewriteStyle.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            O texto foi reescrito seguindo o estilo selecionado, adaptando o tom e a estrutura conforme necessário.
          </p>
        </div>

        {/* Alterações Realizadas */}
        {changes && changes.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <h4 className="text-lg font-semibold">Alterações Realizadas</h4>
            </div>
            <ul className="space-y-3">
              {changes.map((change, index) => (
                <li key={index} className="bg-white dark:bg-slate-800 p-3 rounded-md border shadow-sm">
                  <div className="flex items-start">
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-foreground/90">{change}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(!changes || changes.length === 0) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-yellow-800 dark:text-yellow-200">
                Não foram fornecidos detalhes específicos sobre as alterações realizadas no texto.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Função para formatar o texto preservando quebras de linha e emojis
  const formatText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    ))
  }

  return (
    <>
      <Card className="w-full shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro no serviço</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{error}</p>
                <RetryButton
                  onClick={handleRetry}
                  isLoading={isLoading}
                  size="sm"
                  variant="outline"
                  className="border-destructive/30 hover:bg-destructive/10"
                />
              </AlertDescription>
            </Alert>
          )}

          <div
            className={`mb-4 rounded-lg border p-3 sm:p-4 ${isPremium ? "bg-primary/10 border-primary/30" : "bg-blue-500/10 border-blue-500/25"
              }`}
          >
            {isPremium ? (
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-primary">Plano Premium ativo</p>
                  <p className="text-foreground/80">
                    Correções ilimitadas liberadas. Precisa de ajuda? Escreva para{" "}
                    <a
                      href="mailto:contato@corretordetextoonline.com.br"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      contato@corretordetextoonline.com.br
                    </a>{" "}
                    e nosso time responde em até <strong>24 horas úteis</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      Desbloqueie todo o poder do CorretorIA Premium
                    </p>
                    <p className="text-foreground/80">
                      Correções ilimitadas, histórico inteligente, experiência sem anúncios e suporte prioritário. Hoje você usou{" "}
                      <strong>{freeCorrectionsCount}</strong> de{" "}
                      <strong>{correctionsDailyLimit}</strong> correções gratuitas.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:opacity-90"
                    onClick={() =>
                      sendGTMEvent("premium_banner_cta_click", {
                        location: "correction_form_header",
                      })
                    }
                    asChild
                  >
                    <Link href="/premium">
                      Conhecer o plano Premium
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Abas para alternar entre correção e reescrita */}
          <Tabs
            value={operationMode} // Usar value em vez de defaultValue para controle preciso
            className="w-full mb-4"
            onValueChange={(value) => {
              if (enableCrossNavigation) {
                if (value === "rewrite") {
                  // Redirecionar para a página dedicada de reescrita
                  router.push("/reescrever-texto")
                } else if (value === "correct") {
                  // Redirecionar para a home page
                  router.push("/")
                }
              } else {
                // Comportamento padrão na home - só navegar para reescrita
                if (value === "rewrite") {
                  router.push("/reescrever-texto")
                } else {
                  setOperationMode(value as OperationMode)
                }
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-0.5 sm:p-1 rounded-lg">
              <TabsTrigger
                value="correct"
                className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Corrigir Texto
              </TabsTrigger>
              <TabsTrigger
                value="rewrite"
                className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white cursor-pointer"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Reescrever Texto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="correct" className="mt-0">
              {/* Conteúdo da aba de correção */}
            </TabsContent>

            <TabsContent value="rewrite" className="mt-0">
              {/* Conteúdo da aba de reescrita */}
              <div className="mb-4">
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <Pencil className="h-3 w-3 mr-1.5 flex-shrink-0" />
                  <span>Selecione o estilo de reescrita</span>
                </div>
                {renderRewriteStyleSelector()}
              </div>
            </TabsContent>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Toggle de IA Avançada */}
            {operationMode === "correct" && (
              <div className="mb-4">
                <AdvancedAIToggle
                  isPremium={isPremium}
                  isEnabled={useAdvancedAI}
                  onToggle={setUseAdvancedAI}
                  isLoading={isLoading}
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {isPremium ? (
                <span className="flex items-center gap-2 font-medium text-primary">
                  <Crown className="h-3.5 w-3.5" />
                  Plano Premium ativo · correções ilimitadas
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Plano gratuito: até {correctionsDailyLimit} correções por dia
                </span>
              )}
            </div>
            <div className="relative group">
              <Textarea
                placeholder={
                  !user && originalText === ""
                    ? "" // Placeholder handled by overlay for non-logged users
                    : operationMode === "correct"
                      ? "Digite ou cole seu texto aqui para correção..."
                      : "Digite ou cole seu texto aqui para reescrita..."
                }
                className={`min-h-[180px] resize-y text-base p-4 focus-visible:ring-primary bg-background border rounded-lg text-foreground ${(!isPremium && useAdvancedAI) || isOverCharacterLimit ? "opacity-20 pointer-events-none" : ""
                  }`}
                value={originalText}
                onChange={handleTextChange}
                disabled={isLoading || isConvertingFile || (!isPremium && useAdvancedAI) || isOverCharacterLimit}
                maxLength={characterLimit ?? undefined}
                aria-label={operationMode === "correct" ? "Texto para correção" : "Texto para reescrita"}
              />

              {/* Overlay for Non-Logged Users (Custom Placeholder) */}
              {!user && originalText === "" && !((!isPremium && useAdvancedAI) || isOverCharacterLimit) && (
                <div className="absolute inset-0 p-4 pointer-events-none flex items-start z-[5]">
                  <span className="text-muted-foreground text-base">
                    Cole, digite seu texto ou{" "}
                    <Link href="/login" className="text-primary hover:underline pointer-events-auto font-medium">
                      faça login
                    </Link>{" "}
                    para começar
                  </span>
                </div>
              )}

              {/* Overlay for Locked States (Advanced AI or Limit Exceeded) */}
              {((!isPremium && useAdvancedAI) || isOverCharacterLimit) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-lg border border-primary/20 p-4 text-center z-10">
                  <div className="bg-background/95 p-6 rounded-xl shadow-lg border border-border max-w-sm w-full space-y-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Crown className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <h3 className="font-bold text-lg">
                      {isOverCharacterLimit ? "Limite de caracteres excedido" : "Recurso Premium"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isOverCharacterLimit
                        ? "Você atingiu o limite de caracteres do plano gratuito."
                        : "A IA Avançada é exclusiva para membros Premium."}
                      <br />
                      Faça login ou assine para continuar.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                      <Button asChild className="w-full font-semibold shadow-md">
                        <Link href="/premium">
                          Ver planos Premium
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="w-full">
                        <Link href="/login">
                          Já sou assinante (Login)
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute top-3 right-3">
                <div
                  className={`transition-opacity duration-300 ${isTyping ? "opacity-0" : "opacity-100"
                    } hidden md:flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs`}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  <span>IA Avançada</span>
                </div>
              </div>
            </div>

            {/* Upload de arquivo para conversão */}
            <div className="flex items-center justify-between">
              <FileToTextUploader
                onTextExtracted={(text) => {
                  // Limitar texto ao caractere limit se necessário
                  const finalText = characterLimit && text.length > characterLimit
                    ? text.slice(0, characterLimit)
                    : text;

                  setOriginalText(finalText);
                  setCharCount(finalText.length);
                  setIsTyping(finalText.length > 0);

                  // Scroll to textarea if on mobile
                  if (isMobile) {
                    setTimeout(() => {
                      const textarea = document.querySelector('textarea');
                      textarea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }
                }}
                onConversionStateChange={(converting) => {
                  setIsConvertingFile(converting);
                }}
                isPremium={isPremium}
              />
            </div>

            {/* Alerta de conversão em andamento */}
            {isConvertingFile && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">Convertendo documento...</AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Aguarde enquanto extraímos o texto do seu arquivo. Isso pode levar alguns segundos dependendo do tamanho do documento.
                </AlertDescription>
              </Alert>
            )}

            {/* Mensagem quando IA Avançada está ativa para free users */}
            {!isPremium && useAdvancedAI && (
              <Alert className="border-primary/30 bg-primary/5">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-semibold">IA Avançada Ativada</AlertTitle>
                <AlertDescription>
                  Este recurso é exclusivo para assinantes Premium. Assine agora para desbloquear correções com modelos de IA ultrapoderosos.
                  <div className="mt-3">
                    <Button
                      onClick={() => {
                        sendGTMEvent("premium_cta_click", {
                          location: "advanced_ai_textarea_blocked",
                        })
                        router.push("/premium")
                      }}
                      size="sm"
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Assinar Premium
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Contador de caracteres */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`text-xs text-right ${getCounterColor()} ${!isUnlimited && characterLimit && charCount > characterLimit * 0.7 ? 'font-semibold' : ''}`}>
                    {isUnlimited || characterLimit === null
                      ? `${charCount.toLocaleString("pt-BR")} caracteres (sem limite)`
                      : `${charCount.toLocaleString("pt-BR")}/${characterLimit.toLocaleString("pt-BR")} caracteres`}
                  </div>
                </TooltipTrigger>
                {!isUnlimited && !isPremium && characterLimit && charCount > characterLimit * 0.7 && (
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium mb-1">Chegando no limite!</p>
                    <p className="text-xs">
                      Com o Premium você pode usar até <strong>5.000 caracteres</strong> por texto.{" "}
                      <Link href="/premium" className="underline font-medium">
                        Saiba mais
                      </Link>
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            {!isPremium && (
              <div className="text-xs text-right text-muted-foreground">
                Correções gratuitas restantes hoje: {remainingCorrections} de {correctionsDailyLimit}
              </div>
            )}
            {!isUnlimited && limitsLoading && (
              <div className="text-xs text-right text-muted-foreground">Atualizando limite...</div>
            )}
            {limitsError && (
              <div className="text-xs text-right text-amber-600">
                Não foi possível carregar o limite mais recente. Usando valor padrão.
              </div>
            )}

            {/* Adicionar o componente de ajuste de tom */}
            {operationMode === "correct" && (
              <div className="mb-4">
                <ToneAdjuster onToneChange={handleToneChange} disabled={isLoading || isConvertingFile} />
              </div>
            )}

            {/* Melhorar a responsividade dos botões */}
            <div className="flex flex-wrap gap-3 justify-end">
              {originalText && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading || isConvertingFile}
                  className="w-full sm:w-auto order-3 sm:order-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              )}
              {!isPremium ? (
                <Button
                  className="w-full sm:w-auto order-2 sm:order-2 bg-green-600 text-white hover:bg-green-700 border-0"
                  asChild
                >
                  <Link
                    href="/premium"
                    onClick={() =>
                      sendGTMEvent("premium_cta_click", {
                        location: "correction_form_actions",
                      })
                    }
                    className="inline-flex items-center"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Assinar Premium
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto order-2 sm:order-2"
                  asChild
                >
                  <a
                    href="mailto:contato@corretordetextoonline.com.br"
                    className="inline-flex items-center"
                    onClick={() =>
                      sendGTMEvent("premium_support_click", {
                        location: "correction_form_actions",
                      })
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Falar com suporte
                  </a>
                </Button>
              )}
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  isConvertingFile ||
                  !originalText.trim() ||
                  isOverCharacterLimit
                }
                className="px-6 relative overflow-hidden group w-full sm:w-auto order-1 sm:order-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {operationMode === "correct" ? "Corrigindo..." : "Reescrevendo..."}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    {operationMode === "correct" ? "Corrigir" : "Reescrever"}
                  </>
                )}
              </Button>
            </div>

            {/* Aviso de tempo de processamento */}
            {isLoading && sseCorrection.status === 'idle' && (
              <div className="flex items-center justify-center text-xs text-muted-foreground mt-2">
                <Clock className="h-3 w-3 mr-1" />
                <span>Textos maiores podem levar até 1 minuto para processar</span>
              </div>
            )}

            {/* Indicador de progresso SSE */}
            {isLoading && (sseCorrection.status === 'processing' || sseCorrection.status === 'connecting') && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="font-medium text-foreground">
                      {sseCorrection.status === 'connecting' ? 'Conectando...' : 'Processando texto em paralelo'}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {sseCorrection.progress}%
                  </span>
                </div>

                <Progress value={sseCorrection.progress} className="h-2" />

                {sseCorrection.totalChunks > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Chunk {sseCorrection.completedChunks} de {sseCorrection.totalChunks}
                    </span>
                    <span>
                      {sseCorrection.chunks.length} {sseCorrection.chunks.length === 1 ? 'chunk completado' : 'chunks completados'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </form>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              <Tabs defaultValue="corrected" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 bg-muted/50 p-0.5 sm:p-1 rounded-lg text-xs sm:text-sm">
                  <TabsTrigger
                    value="corrected"
                    className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                  >
                    <span className="hidden sm:inline">Texto </span>
                    {operationMode === "correct" ? "Corrigido" : "Reescrito"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="diff"
                    className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                  >
                    Comparação
                  </TabsTrigger>
                  <TabsTrigger
                    value="evaluation"
                    className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                  >
                    Avaliação
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="corrected" className="mt-0">
                  <Card className="shadow-sm">
                    <CardContent className="p-4 md:p-6">
                      <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap mb-4 text-foreground border text-left text-sm sm:text-base leading-relaxed">
                        {formatText(result.correctedText)}
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
                        {!isPremium ? (
                          <Button
                            size="sm"
                            className="w-full sm:w-auto text-xs sm:text-sm py-2 h-auto bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center"
                            asChild
                          >
                            <Link
                              href="/premium"
                              onClick={() =>
                                sendGTMEvent("premium_result_cta_click", {
                                  location: "result_actions",
                                  mode: operationMode,
                                })
                              }
                            >
                              <Crown className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Migrar para o Premium
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto text-xs sm:text-sm py-2 h-auto flex items-center justify-center"
                            asChild
                          >
                            <Link
                              href="/dashboard"
                              onClick={() =>
                                sendGTMEvent("premium_dashboard_cta_click", {
                                  location: "result_actions",
                                })
                              }
                            >
                              <LayoutDashboard className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Ver no Dashboard
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="diff" className="mt-0">
                  <Card>
                    <CardContent className="p-2 sm:p-4 md:p-6">
                      <TextDiff original={originalText} corrected={result.correctedText} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="evaluation" className="mt-0">
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      {operationMode === "correct" ? (
                        <TextEvaluation evaluation={result.evaluation} />
                      ) : (
                        renderRewriteEvaluation()
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {result && showRating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6"
            >
              <StarRating
                onRatingSubmit={handleRatingSubmit}
                correctionId={correctionId}
                textLength={originalText.length}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="mt-6 flex justify-center"
              >
                {!isPremium ? (
                  <Button
                    size="lg"
                    className="bg-primary hover:opacity-90 text-primary-foreground px-8 w-full sm:w-auto"
                    asChild
                  >
                    <Link
                      href="/premium"
                      onClick={() =>
                        sendGTMEvent("premium_after_rating_cta_click", {
                          location: "rating_section",
                        })
                      }
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      Assinar Premium agora
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 w-full sm:w-auto"
                    asChild
                  >
                    <a
                      href="mailto:contato@corretordetextoonline.com.br"
                      onClick={() =>
                        sendGTMEvent("premium_support_click", {
                          location: "rating_section",
                        })
                      }
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Falar com o suporte Premium
                    </a>
                  </Button>
                )}
              </motion.div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Upsell para Estilo Premium */}
      <PremiumRewriteUpsellModal
        open={showPremiumUpsellModal}
        onOpenChange={setShowPremiumUpsellModal}
        selectedStyle={pendingPremiumStyle}
      />

      {/* Pain Banner Modal */}
      {painBannerData && (
        <PainBanner
          painBanner={painBannerData}
          open={showPainBanner}
          onOpenChange={setShowPainBanner}
          onCtaClick={handlePainBannerCta}
        />
      )}
    </>
  )
}
