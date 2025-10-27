"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { motion } from "framer-motion"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { Card, CardContent } from "@/components/ui/card"

interface AIDetectorRatingProps {
  verdict: "ai" | "human" | "uncertain"
  probability: number
  textLength: number
}

export function AIDetectorRating({ verdict, probability, textLength }: AIDetectorRatingProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRatingClick = (selectedRating: number) => {
    if (!submitted) {
      setRating(selectedRating)
    }
  }

  const handleSubmit = async () => {
    if (rating !== null) {
      try {
        setIsSubmitting(true)

        // Enviar evento para o GTM
        sendGTMEvent("ai_detector_rating_submitted", {
          rating: rating,
          feedback: feedback.trim() || "No feedback provided",
          verdict: verdict,
          probability: probability,
          text_length: textLength,
        })

        // Enviar para a API
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            rating,
            feedback: feedback.trim(),
            correctionId: `ai-detector-${Date.now()}`,
            textLength,
          }),
        })

        if (!response.ok) {
          console.error("Erro ao enviar feedback:", await response.text())
        }

        // Enviar para o webhook
        if (feedback.trim()) {
          try {
            await fetch("https://auto.ffmedia.com.br/webhook/avaliacao-122312234234", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                rating,
                feedback: feedback.trim(),
                verdict,
                probability,
                textLength,
                timestamp: new Date().toISOString(),
              }),
            })
            setFeedbackSubmitted(true)
          } catch (webhookError) {
            console.error("Erro ao enviar para webhook:", webhookError)
          }
        }

        if (!submitted) {
          setSubmitted(true)
        }
      } catch (error) {
        console.error("Erro ao enviar feedback:", error)
        if (!submitted) {
          setSubmitted(true)
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const getFeedbackPlaceholder = () => {
    if (rating === null) return "Primeiro selecione uma avaliação..."
    if (rating <= 2) return "O que poderíamos melhorar na detecção?"
    return "O que você achou da análise?"
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium mb-1">
              Obrigado pelo seu feedback!
            </p>
            <p className="text-sm text-muted-foreground">Sua avaliação nos ajuda a melhorar o detector.</p>
          </CardContent>
        </Card>

        {/* Feedback de texto */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-3">Compartilhe sua opinião</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Conte-nos mais sobre sua experiência com o detector de IA. Seu feedback é muito importante!
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={getFeedbackPlaceholder()}
              className="w-full p-3 border rounded-md text-sm mb-3 bg-background min-h-[100px]"
              rows={4}
              disabled={feedbackSubmitted}
            />
            {feedbackSubmitted ? (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md text-green-600 dark:text-green-400 text-sm mb-3">
                Seu comentário foi enviado com sucesso! Agradecemos por compartilhar sua opinião.
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                disabled={!feedback.trim()}
              >
                Enviar comentário
              </button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-primary/5">
        <CardContent className="pt-6 text-center">
          <h3 className="text-lg font-medium mb-3">O que achou da análise?</h3>

          <div className="flex justify-center space-x-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(null)}
                className="focus:outline-none transition-transform hover:scale-110 p-1"
                aria-label={`${star} estrelas`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    (hoveredRating !== null ? star <= hoveredRating : star <= (rating || 0))
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            ))}
          </div>

          {rating === null && <p className="text-xs text-muted-foreground mt-1">Clique nas estrelas para avaliar</p>}

          {rating !== null && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors relative overflow-hidden"
            >
              {isSubmitting ? (
                <>
                  <span className="opacity-0">Enviar avaliação</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                </>
              ) : (
                "Enviar avaliação"
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
