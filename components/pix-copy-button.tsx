"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { obfuscateIdentifier } from "@/utils/analytics"

interface PixCopyButtonProps {
  pixKey: string
  label?: string
}

export function PixCopyButton({ pixKey, label = "Chave PIX copiada!" }: PixCopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey)
      setCopied(true)

      const anonymizedKey = await obfuscateIdentifier(pixKey, 'pix')

      // Send Google Analytics event without exposing the raw PIX key
      sendGTMEvent('pix_key_copied', {
        key: anonymizedKey,
        length: pixKey.length,
        page: window.location.pathname,
      })

      toast({
        title: "✅ Copiado!",
        description: label,
      })

      // Reset after 3 seconds
      setTimeout(() => {
        setCopied(false)
      }, 3000)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar a chave PIX. Tente novamente.",
      })
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={handleCopy} className="flex-shrink-0">
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}
