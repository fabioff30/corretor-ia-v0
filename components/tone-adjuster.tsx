"use client"

import { useState } from "react"
import { Check, Wand2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { trackPixelCustomEvent } from "@/utils/meta-pixel"

type ToneOption =
  | "Padrão"
  | "Formal"
  | "Informal"
  | "Acadêmico"
  | "Criativo"
  | "Conciso"
  | "Romântico"
  | "Narrativo"
  | "Confiante"

const tones: { value: ToneOption; label: string; description: string }[] = [
  { value: "Padrão", label: "Padrão", description: "Tom de escrita neutro e geral." },
  { value: "Formal", label: "Formal", description: "Linguagem séria para documentos oficiais." },
  { value: "Informal", label: "Informal", description: "Tom descontraído e casual." },
  { value: "Acadêmico", label: "Acadêmico", description: "Linguagem técnica para trabalhos científicos." },
  { value: "Criativo", label: "Criativo", description: "Tom original e imaginativo." },
  { value: "Conciso", label: "Conciso", description: "Linguagem direta e objetiva." },
  { value: "Romântico", label: "Romântico", description: "Tom emotivo e apaixonado." },
  { value: "Narrativo", label: "Narrativo", description: "Tom narrativo para contar histórias." },
  { value: "Confiante", label: "Confiante", description: "Tom assertivo e seguro." },
]

interface ToneAdjusterProps {
  onToneChange?: (tone: ToneOption) => void
  className?: string
  disabled?: boolean
}

export function ToneAdjuster({ onToneChange, className, disabled = false }: ToneAdjusterProps) {
  const [selectedTone, setSelectedTone] = useState<ToneOption>("Padrão")

  const handleSelectTone = (tone: ToneOption) => {
    setSelectedTone(tone)
    sendGTMEvent("tone_selected", { tone: tone })
    trackPixelCustomEvent("ToneSelected", { tone: tone })
    if (onToneChange) {
      onToneChange(tone)
    }
  }

  const selectedToneLabel = tones.find((t) => t.value === selectedTone)?.label || "Padrão"

  return (
    <div className={cn("w-full flex justify-end", className)}>
      <div className="flex flex-col gap-2 max-w-[240px] w-full">
        <div className="flex items-center text-xs text-muted-foreground">
          <Wand2 className="h-3 w-3 mr-1.5 flex-shrink-0" />
          <span>Ajustar Tom</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button variant="outline" className="w-full justify-between h-8 text-xs">
              {selectedToneLabel}
              <Wand2 className="h-4 w-4 ml-2 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          {/* AJUSTE AQUI: Adicionadas classes para rolagem e altura máxima */}
          <DropdownMenuContent
            align="end"
            className={cn(
              "w-[240px]", // Mantém a largura padrão
              "max-h-[60vh] overflow-y-auto", // Limita altura e adiciona rolagem
            )}
          >
            {tones.map((tone) => (
              <DropdownMenuItem
                key={tone.value}
                onClick={() => handleSelectTone(tone.value)}
                className="flex items-center justify-between cursor-pointer"
                disabled={disabled}
              >
                <div>
                  <div className="text-sm">{tone.label}</div>
                  <div className="text-xs text-muted-foreground">{tone.description}</div>
                </div>
                {selectedTone === tone.value && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
