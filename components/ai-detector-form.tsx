"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Search, RotateCcw, AlertCircle, Clock, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AI_DETECTOR_CHARACTER_LIMIT } from "@/utils/constants"
import { AIDetectionResult } from "@/components/ai-detection-result"
import { sendGTMEvent } from "@/utils/gtm-helper"
import Link from "next/link"

interface AIDetectionResponse {
  result: {
    verdict: "ai" | "human" | "uncertain"
    probability: number
    confidence: "low" | "medium" | "high"
    signals: string[]
  }
  textStats: {
    words: number
    characters: number
    paragraphs: number
  }
  brazilianism?: {
    found: boolean
    terms?: Array<{ term: string; count: number }>
  }
  grammarSummary?: {
    errors: number
    details?: string[]
  }
  metadata: {
    promptVersion?: string
    termsVersion?: string
    models?: string[]
    grammarErrors?: number
  }
}

interface AIDetectorFormProps {
  isPremium?: boolean
  onAnalysisComplete?: () => void
}

export function AIDetectorForm({ isPremium = false, onAnalysisComplete }: AIDetectorFormProps = {}) {
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AIDetectionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitError, setRateLimitError] = useState<{ message: string; resetAt: string } | null>(null)
  const { toast } = useToast()

  const charCount = text.length
  const isOverLimit = !isPremium && charCount > AI_DETECTOR_CHARACTER_LIMIT
  const canAnalyze = text.trim().length > 0 && !isOverLimit

  const handleAnalyze = async () => {
    if (!canAnalyze) return

    setIsLoading(true)
    setError(null)
    setRateLimitError(null)
    setResult(null)

    try {
      const response = await fetch("/api/ai-detector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, isPremium }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded
          const resetDate = new Date(data.resetAt)
          const resetTime = resetDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
          const resetDay = resetDate.toLocaleDateString("pt-BR")
          setRateLimitError({
            message: data.message,
            resetAt: `${resetDay} às ${resetTime}`,
          })
        } else {
          throw new Error(data.message || "Erro ao analisar texto")
        }
        return
      }

      setResult(data)

      // Send Google Analytics event
      sendGTMEvent('ai_detection_completed', {
        verdict: data.result.verdict,
        probability: data.result.probability,
        confidence: data.result.confidence,
        text_length: text.length,
        words_count: data.textStats.words,
        grammar_errors: data.grammarSummary?.errors || 0,
        brazilianism_found: data.brazilianism?.found || false,
      })

      toast({
        title: "Análise concluída!",
        description: "O texto foi analisado com sucesso.",
      })

      // Call callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao analisar o texto"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setText("")
    setResult(null)
    setError(null)
    setRateLimitError(null)
  }

  const formatResetTime = (resetAt: string) => {
    const parts = resetAt.split(" às ")
    if (parts.length === 2) {
      return { date: parts[0], time: parts[1] }
    }
    return { date: resetAt, time: "" }
  }

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          {/* Donation Banner */}
          <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start">
            <Heart className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/80">
              Ajude a manter este serviço gratuito! Aceitamos doações a partir de R$1 via PIX. Sua contribuição é fundamental para continuarmos oferecendo correções de texto de qualidade.{" "}
              <Link
                href="/apoiar"
                className="font-medium text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 underline decoration-dotted underline-offset-2 transition-colors px-1 rounded hover:bg-green-500/10"
              >
                Faça sua doação aqui
              </Link>.
            </p>
          </div>

          <CardTitle>Analisar Texto</CardTitle>
          <CardDescription>
            Cole o texto que deseja analisar. Limite: {AI_DETECTOR_CHARACTER_LIMIT} caracteres.
            Você pode usar esta ferramenta 2 vezes por dia gratuitamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Cole seu texto aqui..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex justify-between items-center text-sm">
              <span className={`${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                {charCount} / {AI_DETECTOR_CHARACTER_LIMIT} caracteres
              </span>
              {isOverLimit && (
                <span className="text-destructive">
                  {charCount - AI_DETECTOR_CHARACTER_LIMIT} caracteres excedidos
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={!canAnalyze || isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analisar Texto
                </>
              )}
            </Button>
            {(text || result) && (
              <Button onClick={handleReset} variant="outline" disabled={isLoading}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Error */}
      {rateLimitError && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
          <Clock className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-300">Limite Diário Atingido</AlertTitle>
          <AlertDescription className="text-yellow-800 dark:text-yellow-400">
            <p className="mb-2">{rateLimitError.message}</p>
            <p className="font-medium">
              Volte {rateLimitError.resetAt} para uma nova análise.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* General Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro na Análise</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && <AIDetectionResult {...result} />}
    </div>
  )
}
