"use client"

import { useEffect, useState } from "react"
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
  | "Romântico"
  | "Conciso"
  | "Narrativo"
  | "Instagram"
  | "WhatsApp"
  | "Tweet"
  | "Personalizado"

const tones: { value: ToneOption; label: string; description: string }[] = [
  { value: "Padrão", label: "Padrão", description: "Tom de escrita neutro e geral." },
  { value: "Formal", label: "Formal", description: "Linguagem séria para documentos oficiais." },
  { value: "Informal", label: "Informal", description: "Tom descontraído e casual." },
  { value: "Acadêmico", label: "Acadêmico", description: "Linguagem técnica para trabalhos científicos." },
  { value: "Criativo", label: "Criativo", description: "Tom original e imaginativo." },
  { value: "Romântico", label: "Romântico", description: "Tom emotivo e apaixonado." },
  { value: "Conciso", label: "Conciso", description: "Texto direto ao ponto, sem rodeios." },
  { value: "Narrativo", label: "Narrativo", description: "Tom narrativo para contar histórias." },
  { value: "Instagram", label: "Instagram", description: "Estilo casual e envolvente para posts de redes sociais." },
  { value: "WhatsApp", label: "WhatsApp", description: "Tom conversacional para mensagens diretas." },
  { value: "Tweet", label: "Tweet", description: "Estilo conciso e impactante para mensagens curtas." },
  { value: "Personalizado", label: "Personalizado", description: "Defina suas próprias instruções de tom." },
]

interface ToneAdjusterProps {
  onToneChange?: (tone: ToneOption, customInstruction?: string) => void
  className?: string
  disabled?: boolean
  selectedTone?: ToneOption
}

export function ToneAdjuster({ onToneChange, className, disabled = false, selectedTone: externalTone }: ToneAdjusterProps) {
  const [selectedTone, setSelectedTone] = useState<ToneOption>(externalTone ?? "Padrão")
  const [customToneInput, setCustomToneInput] = useState<string>("")
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false)

  useEffect(() => {
    if (externalTone) {
      setSelectedTone(externalTone)
    }
  }, [externalTone])

  const handleSelectTone = (tone: ToneOption) => {
    setSelectedTone(tone)
    sendGTMEvent("tone_selected", { tone: tone })
    trackPixelCustomEvent("ToneSelected", { tone: tone })

    if (tone === "Personalizado") {
      setShowCustomInput(true)
    } else {
      setShowCustomInput(false)
      if (onToneChange) {
        onToneChange(tone)
      }
    }
  }

  const handleCustomToneSubmit = () => {
    if (customToneInput.trim()) {
      // Send the custom tone instruction via webhook for analytics/logging
      fetch("/api/custom-tone-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ customTone: customToneInput }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Custom tone sent successfully:", data)
        })
        .catch((error) => {
          console.error("Error sending custom tone:", error)
        })

      // Pass the custom tone instruction directly to the parent component
      if (onToneChange) {
        onToneChange("Personalizado", customToneInput.trim())
      }
      
      setShowCustomInput(false)
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
        {showCustomInput && (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              className="w-full p-2 text-sm border rounded-md"
              placeholder="Descreva o tom desejado..."
              value={customToneInput}
              onChange={(e) => setCustomToneInput(e.target.value)}
              rows={3}
            />
            <Button size="sm" onClick={handleCustomToneSubmit} className="self-end">
              Aplicar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
