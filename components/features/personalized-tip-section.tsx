"use client"

import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { MessageSquare, Sparkles, Quote } from "lucide-react"

interface PersonalizedTipSectionProps {
  tip: string
}

/**
 * PersonalizedTipSection
 *
 * Componente premium que exibe uma dica personalizada baseada no texto do usuario.
 * Apresenta feedback especifico e contextualizado.
 */
export function PersonalizedTipSection({ tip }: PersonalizedTipSectionProps) {
  if (!tip) return null

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl p-5 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-background"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/20">
            <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h4 className="text-base font-semibold text-purple-600 dark:text-purple-400">
            Dica Personalizada
          </h4>
        </div>
        <Badge
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      </div>

      {/* Conteudo da dica */}
      <motion.div
        className="relative pl-4 border-l-2 border-purple-500/40"
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Icone de citacao */}
        <Quote className="absolute -left-3 -top-1 h-5 w-5 text-purple-500/50 bg-background rounded" />

        {/* Texto da dica */}
        <p className="text-foreground/90 leading-relaxed italic">
          {tip}
        </p>
      </motion.div>

      {/* Footer decorativo */}
      <motion.div
        className="mt-4 flex items-center justify-center gap-2 text-xs text-purple-500/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Analise personalizada com IA</span>
      </motion.div>
    </motion.div>
  )
}
