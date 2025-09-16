"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextDiff } from "@/components/text-diff"
import { TextEvaluation } from "@/components/text-evaluation"
import {
  Loader2,
  Send,
  Copy,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Clock,
  Heart,
  FileText,
  Pencil,
  Wand2,
  CheckCircle,
  Crown,
  User,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { StarRating } from "@/components/star-rating"
import { getUserSubscription, type Subscription } from "@/utils/subscription"
import { FREE_CHARACTER_LIMIT, API_REQUEST_TIMEOUT, MIN_REQUEST_INTERVAL } from "@/utils/constants"
import { useSubscription, useFeatureAccess } from "@/hooks/use-subscription"
import { useAuth } from "@/contexts/auth-context"
import { ToneAdjuster } from "@/components/tone-adjuster"
import { Badge } from "@/components/ui/badge"
import { SupabaseConfigNotice } from "@/components/supabase-config-notice"
import Link from "next/link"

// Importar o utilitário do Meta Pixel
import { trackPixelCustomEvent } from "@/utils/meta-pixel"

// Tipos globais para window.gtag estão em types/global.d.ts

interface TextCorrectionFormProps {
  onTextCorrected?: () => void
  initialMode?: OperationMode
}

// Tipos para os modos de operação
type OperationMode = "correct" | "rewrite"

// Atualizar o tipo RewriteStyle para substituir "informal" por "humanized"
type RewriteStyle = "formal" | "humanized" | "academic" | "creative" | "childlike"

// Interface para a avaliação de reescrita
interface RewriteEvaluation {
  styleApplied: string
  changes: string[]
}

export default function TextCorrectionForm({ onTextCorrected, initialMode }: TextCorrectionFormProps) {
  const [originalText, setOriginalText] = useState("")
  const [charCount, setCharCount] = useState(0)
  const [result, setResult] = useState<{
    correctedText: string
    evaluation: {
      strengths: string[]
      weaknesses: string[]
      suggestions: string[]
      score: number
      toneChanges: string[]
      styleApplied?: string
      changes?: string[]
      toneApplied?: string
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [requestTimer, setRequestTimer] = useState<number | null>(null)
  const lastRequestTime = useRef<number>(0)
  const { toast } = useToast()
  const [showRating, setShowRating] = useState(false)
  const [correctionId, setCorrectionId] = useState<string>("")
  const [legacySubscription, setLegacySubscription] = useState<Subscription | null>(null)
  const subscription = useSubscription()
  const { characterLimit } = useFeatureAccess()
  const { user } = useAuth()
  const [selectedTone, setSelectedTone] = useState<
    "Padrão" | "Formal" | "Informal" | "Acadêmico" | "Criativo" | "Conciso" | "Romântico" | "Personalizado"
  >("Padrão")
  const [customTone, setCustomTone] = useState<string>("")

  // Novos estados para a funcionalidade de reescrita
  const [operationMode, setOperationMode] = useState<OperationMode>(initialMode || "correct")
  const [selectedRewriteStyle, setSelectedRewriteStyle] = useState<RewriteStyle>("formal")

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

  // Carregar a assinatura legacy como fallback
  useEffect(() => {
    const loadLegacySubscription = async () => {
      // Só carrega subscription legacy se não há usuário autenticado
      if (!user) {
        const userSubscription = await getUserSubscription()
        setLegacySubscription(userSubscription)
      }
    }

    loadLegacySubscription()
  }, [user])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    // Limitar o texto ao número máximo de caracteres
    const currentCharLimit = user ? characterLimit : (legacySubscription?.features.characterLimit || FREE_CHARACTER_LIMIT)
    if (newText.length <= currentCharLimit) {
      setOriginalText(newText)
      // Atualizar o estado isTyping quando o usuário começar a digitar
      if (newText.length > 0 && !isTyping) {
        setIsTyping(true)
      } else if (newText.length === 0 && isTyping) {
        setIsTyping(false)
      }
    } else {
      // Se o usuário tentar colar um texto maior que o limite, cortar para o tamanho máximo
      setOriginalText(newText.slice(0, currentCharLimit))
      setIsTyping(true)
      toast({
        title: "Limite de caracteres atingido",
        description: `O texto foi limitado a ${currentCharLimit} caracteres.`,
        variant: "destructive",
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

  // Função para lidar com a mudança de estilo de reescrita
  const handleRewriteStyleChange = (style: RewriteStyle) => {
    setSelectedRewriteStyle(style)
    console.log(`Estilo de reescrita selecionado: ${style}`)
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
    const currentCharLimit = user ? characterLimit : (legacySubscription?.features.characterLimit || FREE_CHARACTER_LIMIT)
    if (sanitized.length > currentCharLimit) {
      sanitized = sanitized.substring(0, currentCharLimit)
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
    const currentCharLimit = user ? characterLimit : (legacySubscription?.features.characterLimit || FREE_CHARACTER_LIMIT)
    if (originalText.length > currentCharLimit) {
      toast({
        title: "Texto muito longo",
        description: `Por favor, reduza o texto para no máximo ${currentCharLimit} caracteres.`,
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
          ? { tone: currentTone } 
          : { style: selectedRewriteStyle }
        ),
      }

      console.log(`Cliente: Enviando texto para ${endpoint}`)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      // Enviar evento para o GTM
      sendGTMEvent(operationMode === "correct" ? "text_corrected" : "text_rewritten", {
        textLength: originalText.length,
        correctionScore: processedData.evaluation.score || 0,
        mode: operationMode,
        ...(operationMode === "correct" ? { tone: selectedTone } : { rewriteStyle: selectedRewriteStyle }),
      })

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

  // Calcular a cor do contador de caracteres
  const getCounterColor = () => {
    const currentCharLimit = user ? characterLimit : (legacySubscription?.features.characterLimit || FREE_CHARACTER_LIMIT)
    if (charCount > currentCharLimit * 0.9) return "text-red-500"
    if (charCount > currentCharLimit * 0.7) return "text-yellow-500"
    return "text-muted-foreground"
  }

  // Adicionar a função para lidar com a submissão da avaliação
  const handleRatingSubmit = (rating: number) => {
    console.log(`Avaliação recebida: ${rating} estrelas`)
    // Aqui você pode implementar a lógica para enviar a avaliação para um backend
    // ou armazená-la de alguma forma
  }

  // Atualizar a função renderRewriteStyleSelector para substituir o estilo "informal" por "humanizado"
  const renderRewriteStyleSelector = () => {
    const styles = [
      { value: "formal", label: "Formal", description: "Linguagem séria e profissional" },
      { value: "humanized", label: "Humanizado", description: "Tom natural e conversacional" },
      { value: "academic", label: "Acadêmico", description: "Estilo técnico e científico" },
      { value: "creative", label: "Criativo", description: "Linguagem expressiva e original" },
      { value: "childlike", label: "Como uma Criança", description: "Linguagem simples e inocente" },
    ]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
        {styles.map((style) => (
          <div
            key={style.value}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selectedRewriteStyle === style.value
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-muted hover:border-primary/50 hover:bg-muted/50"
            }`}
            onClick={() => handleRewriteStyleChange(style.value as RewriteStyle)}
          >
            <div className="font-medium text-sm">{style.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
          </div>
        ))}
      </div>
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
                  <strong>Crie sua conta gratuita</strong> para acessar mais recursos, ou{" "}
                  <Link
                    href="/upgrade"
                    className="font-medium text-amber-500 hover:text-amber-600 underline decoration-dotted underline-offset-2 transition-colors px-1 rounded hover:bg-amber-500/10"
                  >
                    upgrade para CorretorIA Pro
                  </Link>
                  {" "}e tenha 10.000 caracteres, sem anúncios e processamento prioritário por apenas R$ 19,90/mês.
                </p>
              ) : (
                <p>
                  Ajude a manter este serviço gratuito! Aceitamos doações a partir de R$1 via PIX.{" "}
                  <Link
                    href="/apoiar"
                    onClick={() => {
                      sendGTMEvent("donation_click", {
                        location: "correction_form",
                        element_type: "notice_link",
                        section: "form_header",
                      })
                    }}
                    className="font-medium text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 underline decoration-dotted underline-offset-2 transition-colors px-1 rounded hover:bg-green-500/10"
                  >
                    Faça sua doação aqui
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center">
            <Crown className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm text-foreground/80">
              <strong>CorretorIA Pro ativado!</strong> Você tem acesso a 10.000 caracteres, sem anúncios e processamento prioritário.
            </p>
          </div>
        )}

        {/* Abas para alternar entre correção e reescrita */}
        <Tabs
          defaultValue={operationMode}
          className="w-full mb-4"
          onValueChange={(value) => setOperationMode(value as OperationMode)}
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
              className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-blue-800 data-[state=active]:text-white"
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
          <div className="relative">
            <Textarea
              placeholder={
                operationMode === "correct"
                  ? "Digite ou cole seu texto aqui para correção..."
                  : "Digite ou cole seu texto aqui para reescrita..."
              }
              className="min-h-[180px] resize-y text-base p-4 focus-visible:ring-primary bg-background border rounded-lg text-foreground"
              value={originalText}
              onChange={handleTextChange}
              disabled={isLoading}
              maxLength={user ? characterLimit : (legacySubscription?.features.characterLimit || FREE_CHARACTER_LIMIT)}
              aria-label={operationMode === "correct" ? "Texto para correção" : "Texto para reescrita"}
            />
            <div className="absolute top-3 right-3">
              <div
                className={`transition-opacity duration-300 ${
                  isTyping ? "opacity-0" : "opacity-100"
                } hidden md:flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs`}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                <span>IA Avançada</span>
              </div>
            </div>
          </div>

          {/* Contador de caracteres */}
          <div className={`text-xs text-right ${getCounterColor()}`}>
            {charCount}/{user ? characterLimit : (legacySubscription?.features.characterLimit || FREE_CHARACTER_LIMIT)} caracteres
            {user && subscription.isPremium && (
              <Badge variant="outline" className="ml-2 text-xs">
                Premium
              </Badge>
            )}
          </div>

          {/* Adicionar o componente de ajuste de tom */}
          {operationMode === "correct" && (
            <div className="mb-4">
              <ToneAdjuster onToneChange={handleToneChange} disabled={isLoading} />
            </div>
          )}

          {/* Melhorar a responsividade dos botões */}
          <div className="flex flex-wrap gap-3 justify-end">
            {originalText && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className="w-full sm:w-auto order-3 sm:order-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20 relative group w-full sm:w-auto order-2 sm:order-2"
              onClick={() => {
                sendGTMEvent("donation_button_click", {
                  location: "correction_form",
                })
              }}
              asChild
            >
              <Link
                href="/apoiar"
                onClick={() => {
                  sendGTMEvent("donation_click", {
                    location: "correction_form",
                    element_type: "donate_button",
                    section: "form_actions",
                  })
                }}
              >
                <Heart className="mr-2 h-4 w-4 transition-transform group-hover:animate-heartbeat" />
                <span className="relative z-10">Doar</span>
                <span className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/10 transition-colors duration-300 rounded-md"></span>
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !originalText.trim() ||
                charCount > (user ? characterLimit : (legacySubscription?.features.characterLimit || FREE_CHARACTER_LIMIT))
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
          {isLoading && (
            <div className="flex items-center justify-center text-xs text-muted-foreground mt-2">
              <Clock className="h-3 w-3 mr-1" />
              <span>Textos maiores podem levar até 1 minuto para processar</span>
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
                      <Button
                        onClick={() => {
                          // Registrar evento no GTM
                          sendGTMEvent("donation_button_click", {
                            source: operationMode === "correct" ? "text_correction_result" : "text_rewrite_result",
                            textLength: result.correctedText.length,
                            amount: 5,
                            location: "result_actions",
                          })

                          // Redirecionar para a página de doação
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
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white px-8 w-full sm:w-auto"
                onClick={() => {
                  sendGTMEvent("donation_button_click", {
                    location: "after_rating",
                  })
                }}
                asChild
              >
                <Link
                  href="/apoiar"
                  onClick={() => {
                    sendGTMEvent("donation_click", {
                      location: "after_rating",
                      element_type: "support_button",
                      section: "rating_section",
                    })
                  }}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Apoiar o CorretorIA
                </Link>
              </Button>
            </motion.div>
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
