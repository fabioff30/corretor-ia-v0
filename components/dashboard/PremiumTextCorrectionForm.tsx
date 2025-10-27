/**
 * Premium Text Correction Form
 * Formulário de correção de texto para usuários Premium (Pro/Admin)
 * - Até 300.000 caracteres (limite técnico do middleware)
 * - Sem anúncios
 * - Usa webhook premium
 */

"use client"

import React, { useState, useEffect, useRef } from "react"
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
  Zap,
  Crown,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { StarRating } from "@/components/star-rating"
import { API_REQUEST_TIMEOUT, MIN_REQUEST_INTERVAL } from "@/utils/constants"
import { ToneAdjuster } from "@/components/tone-adjuster"
import { Badge } from "@/components/ui/badge"
import { trackPixelCustomEvent } from "@/utils/meta-pixel"
import { sanitizeUserInput } from "@/utils/html-sanitizer"

interface PremiumTextCorrectionFormProps {
  onTextCorrected?: () => void
}

export default function PremiumTextCorrectionForm({ onTextCorrected }: PremiumTextCorrectionFormProps) {
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
      toneApplied?: string
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [requestTimer, setRequestTimer] = useState<number | null>(null)
  const lastRequestTime = useRef<number>(0)
  const { toast } = useToast()
  const [showRating, setShowRating] = useState(false)
  const [correctionId, setCorrectionId] = useState<string>("")
  const [selectedTone, setSelectedTone] = useState<
    "Padrão" | "Formal" | "Informal" | "Acadêmico" | "Criativo" | "Conciso" | "Romântico" | "Personalizado"
  >("Padrão")
  const [customTone, setCustomTone] = useState<string>("")

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    // Limite de 300k caracteres para usuários premium (validado no middleware)
    setOriginalText(newText)
  }

  const handleToneChange = (tone: string, customInstruction?: string) => {
    setSelectedTone(tone as "Padrão" | "Formal" | "Informal" | "Acadêmico" | "Criativo" | "Conciso" | "Romântico" | "Personalizado")
    if (tone === "Personalizado" && customInstruction) {
      setCustomTone(customInstruction)
    }
  }

  const sanitizeText = (text: string) => {
    const normalized = text
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/\r\n/g, "\n")

    const sanitized = sanitizeUserInput(normalized)

    return sanitized
  }

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

    if (!originalText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, insira um texto para correção.",
        variant: "destructive",
      })
      return
    }

    // Verificar tamanho do payload (limite do Vercel: 4.5MB)
    const sizeInMB = new Blob([originalText]).size / 1024 / 1024
    if (sizeInMB > 4) {
      toast({
        title: "⚠️ Texto muito grande",
        description: `Seu texto tem ${sizeInMB.toFixed(2)}MB. O limite do Vercel é 4.5MB. Por favor, divida o texto em partes menores.`,
        variant: "destructive",
      })
      return
    }

    if (containsSuspiciousContent(originalText)) {
      toast({
        title: "Conteúdo não permitido",
        description: "O texto contém conteúdo que não é permitido.",
        variant: "destructive",
      })
      return
    }

    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime.current

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000)
      toast({
        title: "Muitas requisições",
        description: `Por favor, aguarde ${waitTime} segundos.`,
        variant: "destructive",
      })
      return
    }

    lastRequestTime.current = now
    const textToSend = sanitizeText(originalText)
    setIsLoading(true)
    setError(null)
    setShowRating(false)
    setCorrectionId("")

    const timeoutId = window.setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
        setError("O servidor demorou muito para responder. Por favor, tente novamente.")
        toast({
          title: "Tempo limite excedido",
          description: "O servidor demorou muito para responder.",
          variant: "destructive",
        })
      }
    }, API_REQUEST_TIMEOUT)

    setRequestTimer(timeoutId)

    try {
      const controller = new AbortController()
      const timeoutSignal = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT)

      // Enviar evento de início
      sendGTMEvent("premium_correction_started", {
        char_count: textToSend.length,
        tone: selectedTone,
      })
      trackPixelCustomEvent("PremiumCorrectionStarted", {
        charCount: textToSend.length,
      })

      const response = await fetch("/api/correct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          text: textToSend,
          isMobile,
          tone: selectedTone,
          customTone: selectedTone === "Personalizado" ? customTone : undefined,
          isPremium: true, // Flag para indicar usuário premium
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutSignal)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      setResult({
        correctedText: data.correctedText,
        evaluation: data.evaluation,
      })

      if (data.correctionId) {
        setCorrectionId(data.correctionId)
        setShowRating(true)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("user-corrections:refresh"))
        }
      } else {
        setShowRating(false)
        setCorrectionId("")
      }

      // Enviar evento de sucesso para Google Analytics 4
      sendGTMEvent("premium_correction_completed", {
        charCount: textToSend.length,
        score: data.evaluation?.score || 0,
      })
      trackPixelCustomEvent("PremiumCorrectionCompleted", {
        charCount: textToSend.length,
      })

      if (onTextCorrected) {
        onTextCorrected()
      }

      toast({
        title: "✅ Correção Premium concluída!",
        description: "Seu texto foi corrigido com sucesso.",
      })
    } catch (error: any) {
      console.error("Erro ao corrigir texto:", error)

      if (error.name === "AbortError") {
        setError("A requisição demorou muito tempo. Por favor, tente novamente.")
      } else {
        setError(error.message || "Erro desconhecido ao processar o texto.")
      }

      toast({
        title: "Erro na correção",
        description: error.message || "Erro ao processar o texto.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      clearTimeout(timeoutId)
    }
  }

  const handleCopyResult = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result.correctedText)
        toast({
          title: "Copiado!",
          description: "Texto corrigido copiado para a área de transferência.",
        })
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o texto.",
          variant: "destructive",
        })
      }
    }
  }

  const handleReset = () => {
    setOriginalText("")
    setResult(null)
    setError(null)
    setShowRating(false)
    setCorrectionId("")
    setSelectedTone("Padrão")
    setCustomTone("")
  }

  return (
    <div className="space-y-6">
      {/* Premium Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
        <Badge variant="outline" className="border-purple-500 text-purple-700">
          <Zap className="h-3 w-3 mr-1" />
          Caracteres Ilimitados
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="originalText" className="text-sm font-medium">
              Texto para Correção Premium
            </label>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {charCount.toLocaleString()} caracteres
            </span>
          </div>
          <Textarea
            id="originalText"
            value={originalText}
            onChange={handleTextChange}
            placeholder="Cole ou digite seu texto aqui... Sem limites! 🚀"
            className="min-h-[300px] resize-y"
            disabled={isLoading}
          />
        </div>

        <ToneAdjuster onToneChange={handleToneChange} selectedTone={selectedTone} />

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isLoading || !originalText.trim()}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando com IA Premium...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Corrigir Texto Premium
              </>
            )}
          </Button>
          {result && (
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Nova Correção
            </Button>
          )}
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resultado da Correção Premium
            </h3>
            <Button variant="outline" size="sm" onClick={handleCopyResult}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
          </div>

          <Tabs defaultValue="diff" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diff">Comparação</TabsTrigger>
              <TabsTrigger value="result">Texto Corrigido</TabsTrigger>
              <TabsTrigger value="evaluation">Avaliação</TabsTrigger>
            </TabsList>

            <TabsContent value="diff" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <TextDiff original={originalText} corrected={result.correctedText} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="result" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{result.correctedText}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evaluation" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <TextEvaluation evaluation={result.evaluation} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {showRating && (
            <Card>
              <CardContent className="pt-6">
                <StarRating correctionId={correctionId} />
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  )
}
