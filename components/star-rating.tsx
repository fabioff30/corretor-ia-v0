"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { motion } from "framer-motion"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { RatingStatsDisplay } from "@/components/rating-stats-display"

interface StarRatingProps {
  onRatingSubmit?: (rating: number) => void
  correctionId?: string
  textLength?: number
}

export function StarRating({ onRatingSubmit, correctionId, textLength }: StarRatingProps) {
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
        sendGTMEvent("correction_rating_submitted", {
          rating: rating,
          feedback: feedback.trim() || "No feedback provided",
        })

        // Enviar para a API
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating,
            feedback: feedback.trim(),
            correctionId,
            textLength,
          }),
        })

        if (!response.ok) {
          console.error("Erro ao enviar feedback:", await response.text())
          // Continue mesmo com erro - não queremos interromper a experiência do usuário
        }

        // Enviar o comentário para o webhook especificado
        if (feedback.trim()) {
          try {
            const webhookResponse = await fetch("https://auto.ffmedia.com.br/webhook/avaliacao-122312234234", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                rating,
                feedback: feedback.trim(),
                correctionId,
                timestamp: new Date().toISOString(),
              }),
            })

            if (webhookResponse.ok) {
              setFeedbackSubmitted(true)
            }
          } catch (webhookError) {
            console.error("Erro ao enviar para webhook:", webhookError)
          }
        }

        // Chamar o callback se existir
        if (onRatingSubmit) {
          onRatingSubmit(rating)
        }

        // Se já estiver na tela de avaliação, apenas atualizar o feedback
        // Caso contrário, mostrar a tela de avaliação
        if (!submitted) {
          setSubmitted(true)
        }
      } catch (error) {
        console.error("Erro ao enviar feedback:", error)

        // Ainda assim, marcar como enviado para não bloquear o usuário
        // Para uma melhor experiência do usuário, podemos assumir que a avaliação foi registrada
        // mesmo que tenha havido um erro na comunicação
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
    if (rating <= 2) return "O que poderíamos melhorar?"
    return "O que você mais gostou?"
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="p-3 sm:p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
          <p className="text-green-600 dark:text-green-400 font-medium mb-1 text-sm sm:text-base">
            Obrigado pelo seu feedback!
          </p>
          <p className="text-xs sm:text-sm text-foreground/70">Sua avaliação nos ajuda a melhorar o serviço.</p>
        </div>

        {/* Seção de feedback de texto */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full p-3 sm:p-4 bg-muted/30 rounded-lg border"
        >
          <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Compartilhe sua opinião</h3>
          <p className="text-xs sm:text-sm text-foreground/80 mb-2 sm:mb-3">
            Conte-nos mais sobre sua experiência com o corretor de texto. Seu feedback nos ajuda a melhorar!
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={getFeedbackPlaceholder()}
            className="w-full p-2 sm:p-3 border rounded-md text-xs sm:text-sm mb-3 bg-background min-h-[80px] sm:min-h-[100px]"
            rows={4}
            disabled={feedbackSubmitted}
          />
          {feedbackSubmitted ? (
            <div className="p-2 sm:p-3 bg-green-500/10 border border-green-500/30 rounded-md text-green-600 dark:text-green-400 text-xs sm:text-sm mb-3">
              Seu comentário foi enviado com sucesso! Agradecemos por compartilhar sua opinião.
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground rounded-md text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors"
              disabled={!feedback.trim()}
            >
              Enviar comentário
            </button>
          )}
        </motion.div>

        <div className="mt-4 sm:mt-6">
          <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-center">Depoimentos de usuários</h3>
          <RatingStatsDisplay />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
      {/* Seção de estrelas */}
      <div className="p-3 sm:p-4 bg-primary/5 rounded-lg border w-full text-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">O que achou da correção?</h3>

        <div className="flex justify-center space-x-1 sm:space-x-2 mb-2">
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
                className={`h-6 w-6 sm:h-8 sm:w-8 transition-colors ${
                  (hoveredRating !== null ? star <= hoveredRating : star <= (rating || 0))
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>

        {rating === null && <p className="text-xs text-foreground/60 mt-1">Clique nas estrelas para avaliar</p>}

        {rating !== null && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors relative overflow-hidden"
          >
            {isSubmitting ? (
              <>
                <span className="opacity-0">Enviar avaliação</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
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
      </div>
    </motion.div>
  )
}
