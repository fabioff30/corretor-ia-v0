"use client"

import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Lightbulb, Sparkles, ArrowRight } from "lucide-react"

export interface ImproveTip {
  what: string
  why: string
  how: string
}

interface ImproveTipsSectionProps {
  tips: ImproveTip[]
}

/**
 * ImproveTipsSection
 *
 * Componente premium que exibe dicas de melhoria estruturadas.
 * Cada dica contem: O QUE melhorar, POR QUE e COMO fazer.
 */
export function ImproveTipsSection({ tips }: ImproveTipsSectionProps) {
  if (!tips || tips.length === 0) return null

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl p-5 border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-background"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/20">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="text-base font-semibold text-blue-600 dark:text-blue-400">
            Dicas de Melhoria
          </h4>
        </div>
        <Badge
          className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      </div>

      {/* Lista de dicas */}
      <div className="space-y-4">
        {tips.map((tip, index) => (
          <motion.div
            key={index}
            className="p-4 rounded-lg bg-background/50 border border-blue-500/20 space-y-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            {/* O QUE */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                >
                  O QUE
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground pl-1">
                {tip.what}
              </p>
            </div>

            {/* POR QUE */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                >
                  POR QUE
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground pl-1">
                {tip.why}
              </p>
            </div>

            {/* COMO */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                >
                  COMO
                </Badge>
              </div>
              <p className="text-sm text-foreground/80 pl-1">
                {tip.how}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer com CTA sutil */}
      <motion.div
        className="mt-5 pt-4 border-t border-blue-500/20 flex items-center justify-center gap-2 text-xs text-blue-600/70 dark:text-blue-400/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Lightbulb className="h-3.5 w-3.5" />
        <span>Aplique estas dicas para melhorar seu texto</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </motion.div>
    </motion.div>
  )
}
