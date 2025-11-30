"use client"

import { Crown, Loader2 } from "lucide-react"

interface PremiumLoadingProps {
  text?: string
}

export function PremiumLoading({ text = "Processando com IA Premium..." }: PremiumLoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <Crown className="h-4 w-4 text-purple-500" />
      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
        {text}
      </span>
    </div>
  )
}