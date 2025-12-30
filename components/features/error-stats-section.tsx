"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { BarChart3, AlertCircle } from "lucide-react"

export interface ErrorCategory {
  category: string
  count: number
  percentage: number
}

export interface ErrorStats {
  totalErrors: number
  categories: ErrorCategory[]
}

interface ErrorStatsSectionProps {
  errorStats: ErrorStats
}

const CATEGORY_COLORS: Record<string, { bg: string; indicator: string; text: string }> = {
  ortografia: {
    bg: "bg-red-500/10",
    indicator: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  gramatica: {
    bg: "bg-orange-500/10",
    indicator: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
  },
  pontuacao: {
    bg: "bg-yellow-500/10",
    indicator: "bg-yellow-500",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  concordancia: {
    bg: "bg-blue-500/10",
    indicator: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  regencia: {
    bg: "bg-purple-500/10",
    indicator: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
  },
  default: {
    bg: "bg-gray-500/10",
    indicator: "bg-gray-500",
    text: "text-gray-600 dark:text-gray-400",
  },
}

function getCategoryColor(category: string) {
  const normalizedCategory = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.default
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ortografia: "Ortografia",
    gramatica: "Gramatica",
    pontuacao: "Pontuacao",
    concordancia: "Concordancia",
    regencia: "Regencia",
  }
  const normalizedCategory = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return labels[normalizedCategory] || category
}

/**
 * ErrorStatsSection
 *
 * Componente premium que exibe estatisticas detalhadas dos erros encontrados.
 * Mostra barras de progresso por categoria e total de erros.
 */
export function ErrorStatsSection({ errorStats }: ErrorStatsSectionProps) {
  const { totalErrors = 0, categories = [] } = errorStats || {}

  // Validação defensiva - garantir que categories é array
  const safeCategories = Array.isArray(categories) ? categories : []

  // Ordenar categorias por contagem (maior primeiro)
  const sortedCategories = [...safeCategories].sort((a, b) => b.count - a.count)

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20">
            <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h4 className="text-base font-semibold text-amber-600 dark:text-amber-400">
            Estatisticas de Erros
          </h4>
        </div>
        <Badge
          variant="outline"
          className={`${
            totalErrors === 0
              ? "border-green-500/50 bg-green-500/10 text-green-600"
              : totalErrors <= 3
              ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-600"
              : "border-red-500/50 bg-red-500/10 text-red-600"
          } font-semibold px-3 py-1`}
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
          {totalErrors} {totalErrors === 1 ? "erro" : "erros"}
        </Badge>
      </div>

      {/* Lista de categorias com barras de progresso */}
      <div className="space-y-4">
        {sortedCategories.length > 0 ? (
          sortedCategories.map((category, index) => {
            const colors = getCategoryColor(category.category)
            return (
              <motion.div
                key={category.category}
                className="space-y-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${colors.text}`}>
                    {getCategoryLabel(category.category)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {category.count} {category.count === 1 ? "erro" : "erros"}
                    </span>
                    <span className={`font-semibold ${colors.text}`}>
                      {category.percentage}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={category.percentage}
                  className={`h-2.5 ${colors.bg}`}
                  indicatorClassName={colors.indicator}
                />
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Nenhum erro categorizado encontrado.</p>
          </div>
        )}
      </div>

      {/* Resumo */}
      {totalErrors > 0 && (
        <motion.div
          className="mt-5 pt-4 border-t border-amber-500/20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-muted-foreground">
            {totalErrors <= 3
              ? "Otimo! Poucos erros encontrados."
              : totalErrors <= 7
              ? "Atencao a algumas areas que precisam de melhoria."
              : "Recomendamos revisar o texto com atencao."}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
