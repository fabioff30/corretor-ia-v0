"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { TextDiff } from "@/components/text-diff"
import { TextEvaluation } from "@/components/text-evaluation"
import { CopyPromoBanner } from "@/components/ads/copy-promo-banner"
import React, { useState, useRef, useEffect } from "react"

interface TextCorrectionTabsProps {
  originalText: string
  correctedText: string
  evaluation: {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
    score: number
    toneChanges: string[]
    // Premium fields
    improvements?: string[]
    analysis?: string
    model?: string
  }
}

// Componente para exibir as abas de resultado da correção
export function TextCorrectionTabs({ originalText, correctedText, evaluation }: TextCorrectionTabsProps) {
  const [showPromoBanner, setShowPromoBanner] = useState(false)
  const correctedTextRef = useRef<HTMLPreElement>(null)

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
              <TextEvaluation evaluation={evaluation} />
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
