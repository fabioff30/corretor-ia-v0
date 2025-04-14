"use client"

import { CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import TextCorrectionForm from "@/components/text-correction-form"
import { Sparkles } from "lucide-react"
import { RatingStatsSection } from "@/components/rating-stats-section"

export function HeroSection() {
  return (
    <section className="w-full pt-8 sm:pt-12 pb-12 sm:pb-16 relative overflow-hidden">
      <div className="max-w-[1366px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full"
          >
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm font-medium">Correção de texto inteligente</span>
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance gradient-text"
          >
            Corrija seus textos com IA
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-foreground/80 max-w-xl"
          >
            Elimine erros gramaticais, ortográficos e de estilo em seus textos em português com nossa ferramenta de
            inteligência artificial.
          </motion.p>

          {/* Adicionar o componente de estatísticas de avaliação */}
          <RatingStatsSection />

          {/* Campo de Input de Texto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full"
          >
            <TextCorrectionForm />
          </motion.div>

          {/* Ícones de Recursos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-x-4 sm:gap-x-8 gap-y-3 sm:gap-y-4"
          >
            <div className="flex items-center">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary" />
              <span className="text-xs sm:text-sm text-foreground/80">100% Gratuito</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary" />
              <span className="text-xs sm:text-sm text-foreground/80">Português BR e PT</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary" />
              <span className="text-xs sm:text-sm text-foreground/80">Análise Detalhada</span>
            </div>
          </motion.div>

          {/* Aviso sobre IA */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-xs text-foreground/60 italic max-w-lg"
          >
            Atenção: A correção é realizada por inteligência artificial e pode conter erros. Revise sempre o resultado.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
