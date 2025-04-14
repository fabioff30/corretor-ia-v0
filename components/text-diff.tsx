"use client"

import { useMemo } from "react"
import * as Diff from "diff"

interface TextDiffProps {
  original: string
  corrected: string
}

export function TextDiff({ original, corrected }: TextDiffProps) {
  const diffResult = useMemo(() => {
    // Aplicamos diffWords diretamente para comparar palavra por palavra
    return Diff.diffWords(original, corrected)
  }, [original, corrected])

  return (
    <div className="p-2 sm:p-4 bg-muted/30 rounded-lg border">
      <div
        className="whitespace-pre-wrap text-foreground text-left leading-relaxed text-sm sm:text-base"
        aria-label="Comparação entre texto original e corrigido"
      >
        {diffResult.map((part, index) => {
          if (part.added) {
            return (
              <span
                key={index}
                className="bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 px-0.5 sm:px-1 py-0.5 rounded-md mx-0.5 inline-block"
                aria-label="texto adicionado"
              >
                {part.value}
              </span>
            )
          }
          if (part.removed) {
            return (
              <span
                key={index}
                className="bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 px-0.5 sm:px-1 py-0.5 rounded-md mx-0.5 inline-block"
                aria-label="texto removido"
              >
                {part.value}
              </span>
            )
          }
          return <span key={index}>{part.value}</span>
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center text-xs text-muted-foreground gap-x-4 gap-y-2">
        <div className="flex items-center">
          <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500/20 border border-green-500/30 rounded-sm mr-1"></span>
          <span>Adicionado</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500/20 border border-red-500/30 rounded-sm mr-1"></span>
          <span>Removido</span>
        </div>
      </div>
    </div>
  )
}
