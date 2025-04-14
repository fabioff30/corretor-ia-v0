"use client"

import { useState } from "react"
import { Wand2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { sendGTMEvent } from "@/utils/gtm-helper"
// Importar o utilitário do Meta Pixel
import { trackPixelCustomEvent } from "@/utils/meta-pixel"

// Manter o tipo ToneOption com "Padrão" incluído
type ToneOption = "Padrão" | "Formal" | "Informal" | "Acadêmico" | "Criativo" | "Conciso" | "Romântico"

interface ToneAdjusterProps {
  onToneChange?: (tone: ToneOption) => void
  className?: string
  disabled?: boolean
}

export function ToneAdjuster({ onToneChange, className, disabled = false }: ToneAdjusterProps) {
  // Manter "Padrão" como o estado inicial
  const [selectedTone, setSelectedTone] = useState<ToneOption>("Padrão")

  // Manter a lista de opções com "Padrão" como primeira opção
  const toneOptions: ToneOption[] = ["Padrão", "Formal", "Informal", "Acadêmico", "Criativo", "Conciso", "Romântico"]

  const handleToneChange = (tone: ToneOption) => {
    setSelectedTone(tone)

    // Enviar evento para o GTM
    sendGTMEvent("tone_selected", {
      tone: tone,
    })

    // Rastrear evento de seleção de tom no Meta Pixel
    trackPixelCustomEvent("ToneSelected", {
      tone: tone,
    })

    // Chamar o callback se existir
    if (onToneChange) {
      onToneChange(tone)
    }
  }

  return (
    <div className={cn("w-full flex justify-end", className)}>
      <div className="flex flex-col gap-2 max-w-[240px] w-full">
        <div className="flex items-center text-xs text-muted-foreground">
          <Wand2 className="h-3 w-3 mr-1.5 flex-shrink-0" />
          <span>Ajustar Tom</span>
        </div>
        <Select value={selectedTone} onValueChange={handleToneChange} disabled={disabled}>
          <SelectTrigger className="w-full bg-background h-8 text-xs">
            <SelectValue placeholder="Selecione o tom" />
          </SelectTrigger>
          <SelectContent>
            {toneOptions.map((tone) => (
              <SelectItem key={tone} value={tone} className="text-sm">
                {tone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
