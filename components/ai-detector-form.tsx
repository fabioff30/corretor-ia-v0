"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Search, RotateCcw, AlertCircle, Clock, Sparkles, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RetryButton } from "@/components/ui/retry-button"
import { AI_DETECTOR_CHARACTER_LIMIT, AI_DETECTOR_DAILY_LIMIT } from "@/utils/constants"
import { AIDetectionResult } from "@/components/ai-detection-result"
import { sendGTMEvent } from "@/utils/gtm-helper"
import Link from "next/link"
import { useUser } from "@/hooks/use-user"
import { safeJsonParse, extractValidJson, createAIDetectionResponseValidator } from "@/utils/safe-json-fetch"
import { FileToTextUploader } from "@/components/file-to-text-uploader"

interface AIDetectionResponse {
  result?: {
    verdict: "ai" | "human" | "uncertain"
    probability: number
    confidence: "low" | "medium" | "high"
    signals: string[]
    explanation?: string
  }
  textStats?: {
    words: number
    characters: number
    sentences?: number
    paragraphs?: number
    avgSentenceLength?: number
    avgWordLength?: number
    uppercaseRatio?: number
    digitRatio?: number
    punctuationRatio?: number
  }
  brazilianism?: {
    found: boolean
    count?: number
    score?: number
    explanation?: string
    terms?: Array<{ term: string; count: number }>
    source?: string
    version?: string
  }
  grammarSummary?: {
    errors: number
    grammarErrors?: number
    orthographyErrors?: number
    concordanceErrors?: number
    evaluation?: string
    confidence?: string
    model?: string
    details?: string[]
  }
  metadata?: {
    promptVersion?: string
    termsVersion?: string
    termsSignature?: string
    models?: string[]
    grammarErrors?: number
  }
  correctionId?: string | null
}

interface AIDetectorFormProps {
  isPremium?: boolean
  onAnalysisComplete?: () => void
}

export function AIDetectorForm({ isPremium: isPremiumOverride, onAnalysisComplete }: AIDetectorFormProps = {}) {
  const { profile } = useUser()
  const derivedPlanIsPremium = profile?.plan_type === "pro" || profile?.plan_type === "admin"
  const resolvedIsPremium = isPremiumOverride !== undefined ? isPremiumOverride : !!derivedPlanIsPremium
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AIDetectionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitError, setRateLimitError] = useState<{ message: string; resetAt: string } | null>(null)
  const [correctionId, setCorrectionId] = useState<string | null>(null)
  const [isConvertingFile, setIsConvertingFile] = useState(false)
  const { toast } = useToast()

  const charCount = text.length
  const isOverLimit = !resolvedIsPremium && charCount > AI_DETECTOR_CHARACTER_LIMIT
  const canAnalyze = text.trim().length > 0 && !isOverLimit
  const formattedCharacterLimit = AI_DETECTOR_CHARACTER_LIMIT.toLocaleString("pt-BR")
  const formattedDailyLimit = AI_DETECTOR_DAILY_LIMIT.toLocaleString("pt-BR")

  /**
   * Retry handler - Re-runs analysis with existing text
   * Per frontend-api.md spec (line 263): "Implementar botão 'Tentar novamente'"
   */
  const handleRetry = () => {
    setError(null)
    setRateLimitError(null)
    handleAnalyze()
  }

  const handleAnalyze = async () => {
    if (!canAnalyze) return

    setIsLoading(true)
    setError(null)
    setRateLimitError(null)
    setResult(null)
    setCorrectionId(null)

    try {
      const response = await fetch("/api/ai-detector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text, isPremium: resolvedIsPremium }),
      })

      if (!response.ok) {
        // Handle error responses
        const responseText = await response.text()
        console.error("API error response:", { status: response.status, text: responseText })

        // Try to parse error response
        const parseResult = safeJsonParse(responseText)
        if (parseResult.success && typeof parseResult.data === "object" && parseResult.data !== null) {
          const data = parseResult.data as any
          if (response.status === 429 && data.resetAt) {
            const resetDate = new Date(data.resetAt)
            const resetTime = resetDate.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
            const resetDay = resetDate.toLocaleDateString("pt-BR")
            setRateLimitError({
              message: data.message || "Limite diário atingido",
              resetAt: `${resetDay} às ${resetTime}`,
            })
            return
          }
        }

        throw new Error(`Erro na análise (${response.status})`)
      }

      // Get response text first
      const responseText = await response.text()

      if (!responseText) {
        throw new Error("Servidor retornou resposta vazia")
      }

      // Try safe parsing with validation
      const validator = createAIDetectionResponseValidator()
      let parseResult = safeJsonParse<AIDetectionResponse>(responseText)

      // If parsing fails, try to extract valid JSON
      if (!parseResult.success) {
        console.info("Attempting to recover from malformed response...")
        parseResult = extractValidJson<AIDetectionResponse>(responseText)
      }

      if (!parseResult.success) {
        console.error("Failed to parse AI detection response:", parseResult)
        throw new Error(`Erro ao processar resposta: ${parseResult.error}`)
      }

      if (!parseResult.data) {
        throw new Error("Resposta do servidor está vazia")
      }

      // Validate response structure
      if (!validator.isValid(parseResult.data)) {
        console.warn("Response failed validation, using fallback:", parseResult.data)
        parseResult.data = validator.getDefaultFallback()
      }

      const data = parseResult.data
      const { correctionId: savedId, ...analysisData } = data
      setResult(analysisData)

      if (savedId) {
        setCorrectionId(savedId)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("user-corrections:refresh"))
        }
      } else {
        setCorrectionId(null)
      }

      // Send Google Analytics event - safely access nested properties
      if (data.result) {
        sendGTMEvent('ai_detection_completed', {
          verdict: data.result.verdict,
          probability: data.result.probability,
          confidence: data.result.confidence,
          text_length: text.length,
          words_count: data.textStats?.words || 0,
          grammar_errors: data.grammarSummary?.errors || 0,
          brazilianism_found: data.brazilianism?.found || false,
          plan: resolvedIsPremium ? "premium" : "free",
        })
      }

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
      console.error("Analysis error:", errorMessage)
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
    setCorrectionId(null)
  }

  const handleFileTextExtracted = (extractedText: string) => {
    setText(extractedText)
    if (extractedText) {
      toast({
        title: "Arquivo carregado!",
        description: "O texto foi extraído do arquivo. Clique em 'Analisar Texto' para continuar.",
      })
    }
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
          <div
            className={`mb-4 rounded-lg border p-3 ${
              resolvedIsPremium ? "bg-primary/10 border-primary/25" : "bg-blue-500/10 border-blue-500/25"
            }`}
          >
            {resolvedIsPremium ? (
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground/80">
                  Plano Premium ativo. Execute detecções ilimitadas e conte com suporte respondendo em até{" "}
                  <strong>24 horas úteis</strong> pelo{" "}
                  <a
                    href="mailto:contato@corretordetextoonline.com.br"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    contato@corretordetextoonline.com.br
                  </a>
                  .
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="text-foreground/80">
                    Libere detecções ilimitadas, histórico completo e suporte dedicado no plano Premium.
                  </p>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:opacity-90"
                    asChild
                  >
                    <Link
                      href="/premium"
                      onClick={() =>
                        sendGTMEvent("premium_detector_banner_cta_click", {
                          location: "detector_form_header",
                        })
                      }
                    >
                      Conhecer o plano Premium
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <CardTitle>Analisar Texto</CardTitle>
          <CardDescription>
            {resolvedIsPremium
              ? "Detecção sem limite diário para assinantes Premium. Cole o texto que deseja analisar."
              : `Cole o texto que deseja analisar. Limite: ${formattedCharacterLimit} caracteres. Você pode usar esta ferramenta ${formattedDailyLimit} vezes por dia gratuitamente.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {resolvedIsPremium ? (
                <span className="flex items-center gap-2 font-medium text-primary">
                  <Crown className="h-3.5 w-3.5" /> Plano Premium ativo · detecção sem limite diário
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> Gratuito: até {formattedDailyLimit} análises por dia
                </span>
              )}
            </div>
            <Textarea
              placeholder="Cole seu texto aqui ou envie um arquivo..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading || isConvertingFile}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex items-center gap-3">
              <FileToTextUploader
                onTextExtracted={handleFileTextExtracted}
                isPremium={resolvedIsPremium}
                onConversionStateChange={setIsConvertingFile}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={`${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                {resolvedIsPremium
                  ? `${charCount.toLocaleString("pt-BR")} caracteres (sem limite)`
                  : `${charCount.toLocaleString("pt-BR")} / ${formattedCharacterLimit} caracteres`}
              </span>
              {isOverLimit && (
                <span className="text-destructive">
                  {charCount - AI_DETECTOR_CHARACTER_LIMIT} caracteres excedidos
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={!canAnalyze || isLoading || isConvertingFile} className="flex-1">
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
              <Button onClick={handleReset} variant="outline" disabled={isLoading || isConvertingFile}>
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

      {/* Result */}
      {result && correctionId && (
        <Alert>
          <AlertTitle>Análise salva</AlertTitle>
          <AlertDescription>
            Este resultado foi adicionado ao histórico em "Meus textos" para consulta futura.
          </AlertDescription>
        </Alert>
      )}

      {result && result.result && result.textStats && (
        <AIDetectionResult
          result={result.result}
          textStats={result.textStats}
          brazilianism={result.brazilianism}
          grammarSummary={result.grammarSummary}
          metadata={result.metadata || {}}
          originalText={text}
          isPremium={resolvedIsPremium}
        />
      )}

      {result && (!result.result || !result.textStats) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro na Análise</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>A resposta do servidor está incompleta ou malformada. Por favor, tente novamente.</p>
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
    </div>
  )
}
