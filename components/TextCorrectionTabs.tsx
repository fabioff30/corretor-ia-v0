import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { TextDiff } from "@/components/text-diff"
import { TextEvaluation } from "@/components/text-evaluation"
import React from "react"

interface TextCorrectionTabsProps {
  originalText: string
  correctedText: string
  evaluation: {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
    score: number
    toneChanges: string[]
  }
}

// Componente para exibir as abas de resultado da correção
export function TextCorrectionTabs({ originalText, correctedText, evaluation }: TextCorrectionTabsProps) {
  return (
    <Tabs defaultValue="correction" className="w-full mt-6">
      <TabsList className="flex w-full">
        <TabsTrigger value="correction">Texto Corrigido</TabsTrigger>
        <TabsTrigger value="diff">Diferenças</TabsTrigger>
        <TabsTrigger value="evaluation">Avaliação</TabsTrigger>
      </TabsList>
      <TabsContent value="correction" className="mt-0">
        <Card>
          <CardContent className="p-2 sm:p-4 md:p-6">
            <pre className="whitespace-pre-wrap break-words text-sm sm:text-base">{correctedText}</pre>
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
  )
}
