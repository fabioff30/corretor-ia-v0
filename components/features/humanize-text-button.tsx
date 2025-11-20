"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { HumanizeUpgradeModal } from "@/components/features/humanize-upgrade-modal"
import { HumanizeResult } from "@/components/features/humanize-result"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { RetryButton } from "@/components/ui/retry-button"

interface HumanizeTextButtonProps {
  text: string
  isPremium: boolean
  aiProbability?: number
  onHumanizeComplete?: () => void
}

interface HumanizeResponse {
  humanizedText: string
  explanation: string
}

export function HumanizeTextButton({
  text,
  isPremium,
  aiProbability,
  onHumanizeComplete,
}: HumanizeTextButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<HumanizeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { toast } = useToast()

  const handleClick = () => {
    if (!isPremium) {
      // Show upgrade modal for free users
      setShowUpgradeModal(true)

      // Track upgrade modal shown
      sendGTMEvent("humanize_upgrade_modal_shown", {
        text_length: text.length,
        ai_probability: aiProbability || 0,
      })

      return
    }

    // Process humanization for premium users
    handleHumanize()
  }

  const handleHumanize = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    // Track humanization attempt
    sendGTMEvent("humanize_text_clicked", {
      plan_type: isPremium ? "premium" : "free",
      text_length: text.length,
      ai_probability: aiProbability || 0,
    })

    try {
      const response = await fetch("/api/humanizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          text,
          mode: "default",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Erro ${response.status}`)
      }

      const data: HumanizeResponse = await response.json()

      if (!data.humanizedText || !data.explanation) {
        throw new Error("Resposta incompleta do servidor")
      }

      setResult(data)

      // Track successful humanization
      sendGTMEvent("humanize_text_completed", {
        text_length: text.length,
        humanized_length: data.humanizedText.length,
      })

      toast({
        title: "Texto humanizado!",
        description: "Seu texto foi humanizado com sucesso.",
      })

      if (onHumanizeComplete) {
        onHumanizeComplete()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao humanizar o texto"
      console.error("Humanization error:", errorMessage)
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Erro ao humanizar",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleHumanize()
  }

  return (
    <div className="space-y-6">
      {/* Humanize Button */}
      {!result && (
        <div className="flex justify-center">
          <Button
            onClick={handleClick}
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Humanizando texto...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Humanizar Texto
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao Humanizar</AlertTitle>
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
      {result && (
        <HumanizeResult
          humanizedText={result.humanizedText}
          explanation={result.explanation}
          originalText={text}
        />
      )}

      {/* Upgrade Modal */}
      <HumanizeUpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  )
}
