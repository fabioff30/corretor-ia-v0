"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { TextDiff } from "@/components/text-diff"
import { TextEvaluation } from "@/components/features/text-evaluation"
import { CopyPromoBanner } from "@/components/ads/copy-promo-banner"
import React, { useState, useRef, useEffect, useMemo } from "react"
import type { ImproveTip } from "@/components/features/improve-tips-section"
import type { ErrorStats } from "@/components/features/error-stats-section"

// Interface para errorStats vindo da API (formato diferente do frontend)
interface ApiErrorStats {
  total: number
  byCategory: {
    ortografia: number
    gramatica: number
    pontuacao: number
    concordancia: number
    regencia: number
  }
}

interface TextCorrectionTabsProps {
  originalText: string
  correctedText: string
  evaluation: {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
    score: number
    toneChanges?: string[]
    // Premium fields
    improvements?: string[]
    analysis?: string
    model?: string
    // Novos campos premium
    improve?: string[]
    errorStats?: ApiErrorStats
    personalizedTip?: string
  }
  isPremiumUser?: boolean
}

/**
 * Converte array de strings "O QUE: x | POR QUE: y | COMO: z" para array de ImproveTip
 */
function parseImproveTips(improve?: string[]): ImproveTip[] {
  if (!improve || improve.length === 0) return []

  return improve
    .map((item) => {
      // Formato esperado: "O QUE: x | POR QUE: y | COMO: z"
      const whatMatch = item.match(/O QUE:\s*['"]?([^|'"]+)['"]?\s*\|/i)
      const whyMatch = item.match(/POR QUE:\s*([^|]+)\s*\|/i)
      const howMatch = item.match(/COMO:\s*['"]?([^'"]+)['"]?\s*$/i)

      if (whatMatch && whyMatch && howMatch) {
        return {
          what: whatMatch[1].trim(),
          why: whyMatch[1].trim(),
          how: howMatch[1].trim(),
        }
      }

      // Fallback: se o formato nao bater, tenta dividir por |
      const parts = item.split('|').map(p => p.trim())
      if (parts.length >= 3) {
        return {
          what: parts[0].replace(/^O QUE:\s*/i, '').replace(/^['"]|['"]$/g, ''),
          why: parts[1].replace(/^POR QUE:\s*/i, ''),
          how: parts[2].replace(/^COMO:\s*/i, '').replace(/^['"]|['"]$/g, ''),
        }
      }

      return null
    })
    .filter((tip): tip is ImproveTip => tip !== null)
}

/**
 * Converte errorStats da API para formato do frontend
 */
function convertErrorStats(apiStats?: ApiErrorStats): ErrorStats | undefined {
  if (!apiStats) return undefined

  const categories: ErrorStats['categories'] = []
  const total = apiStats.total || 0

  if (total === 0) {
    return { totalErrors: 0, categories: [] }
  }

  const categoryMap: Record<string, string> = {
    ortografia: 'ortografia',
    gramatica: 'gramatica',
    pontuacao: 'pontuacao',
    concordancia: 'concordancia',
    regencia: 'regencia',
  }

  for (const [key, label] of Object.entries(categoryMap)) {
    const count = apiStats.byCategory?.[key as keyof typeof apiStats.byCategory] || 0
    if (count > 0) {
      categories.push({
        category: label,
        count,
        percentage: Math.round((count / total) * 100),
      })
    }
  }

  return { totalErrors: total, categories }
}

// Componente para exibir as abas de resultado da correção
export function TextCorrectionTabs({
  originalText,
  correctedText,
  evaluation,
  isPremiumUser = false
}: TextCorrectionTabsProps) {
  const [showPromoBanner, setShowPromoBanner] = useState(false)
  const correctedTextRef = useRef<HTMLPreElement>(null)

  // Converte os dados da API para o formato esperado pelo TextEvaluation
  const improveTips = useMemo(() => parseImproveTips(evaluation.improve), [evaluation.improve])
  const errorStats = useMemo(() => convertErrorStats(evaluation.errorStats), [evaluation.errorStats])

  useEffect(() => {
    const handleCopy = async () => {
      // Verifica se o texto copiado é do elemento de texto corrigido
      const selection = window.getSelection()
      if (selection && correctedTextRef.current?.contains(selection.anchorNode)) {
        // Importa as funções de controle de frequência
        const { shouldShowPromoBanner, markPromoBannerAsShown } = await import("@/utils/promo-banner-control")

        // Verifica se deve mostrar o banner (controle de frequência)
        if (shouldShowPromoBanner()) {
          setShowPromoBanner(true)
          markPromoBannerAsShown()

          // Registra evento no Google Analytics
          if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "text_copied", {
              event_category: "engagement",
              event_label: "corrected_text_copy"
            })
          }
        }
      }
    }

    document.addEventListener("copy", handleCopy)
    return () => document.removeEventListener("copy", handleCopy)
  }, [])

  return (
    <>
      <Tabs defaultValue="correction" className="w-full mt-6">
        <TabsList className="flex w-full">
          <TabsTrigger value="correction">Texto Corrigido</TabsTrigger>
          <TabsTrigger value="diff">Diferenças</TabsTrigger>
          <TabsTrigger value="evaluation">Avaliação</TabsTrigger>
        </TabsList>
        <TabsContent value="correction" className="mt-0">
          <Card>
            <CardContent className="p-2 sm:p-4 md:p-6">
              <pre
                ref={correctedTextRef}
                className="whitespace-pre-wrap break-words text-sm sm:text-base"
              >
                {correctedText}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="diff" className="mt-0">
          <Card>
            <CardContent className="p-2 sm:p-4 md:p-6">
              <TextDiff original={originalText} corrected={correctedText} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="evaluation" className="mt-0">
          <Card>
            <CardContent className="p-2 sm:p-4 md:p-6">
              <TextEvaluation
                evaluation={{
                  ...evaluation,
                  toneChanges: evaluation.toneChanges || [],
                  errorStats,
                  personalizedTip: evaluation.personalizedTip,
                  improveTips,
                }}
                isPremiumUser={isPremiumUser}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPromoBanner && (
        <CopyPromoBanner onClose={() => setShowPromoBanner(false)} />
      )}
    </>
  )
}
