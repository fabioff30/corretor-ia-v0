"use client"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Sparkles, ChevronRight, Crown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useCorrectionHaptic } from "@/hooks/use-haptic"
import { cn } from "@/lib/utils"

interface MobileCorrectionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading?: boolean
  characterLimit?: number | null
  onFileUpload?: () => void
  placeholder?: string
  onAIToggle?: (enabled: boolean) => void
  aiEnabled?: boolean
  // Custom button text
  submitButtonText?: string
  loadingButtonText?: string
  // Style selector (replaces AI toggle for rewrite)
  showStyleSelector?: boolean
  selectedStyle?: string
  selectedStyleLabel?: string
  onStyleClick?: () => void
  // Control AI toggle visibility
  showAIToggle?: boolean
}

export function MobileCorrectionInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  characterLimit,
  onFileUpload,
  placeholder = "Cole ou digite seu texto aqui...",
  onAIToggle,
  aiEnabled = false,
  submitButtonText = "Corrigir Agora",
  loadingButtonText = "Corrigindo...",
  showStyleSelector = false,
  selectedStyle,
  selectedStyleLabel,
  onStyleClick,
  showAIToggle = true,
}: MobileCorrectionInputProps) {
  const [hasStartedTyping, setHasStartedTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const haptic = useCorrectionHaptic()

  const charCount = value.length
  const isOverLimit = characterLimit !== null && characterLimit !== undefined && charCount > characterLimit
  const isUnlimited = characterLimit === null || characterLimit === -1

  // Auto-focus ao montar
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value

    // Haptic feedback na primeira letra
    if (!hasStartedTyping && newValue.length === 1) {
      haptic.onTextStart()
      setHasStartedTyping(true)
    }

    onChange(newValue)
  }

  const handleSubmit = () => {
    haptic.onButtonPress()
    onSubmit()
  }

  const canSubmit = value.trim().length > 0 && !isOverLimit && !isLoading

  return (
    <div className="w-full space-y-3">
      {/* AI Toggle or Style Selector */}
      {showStyleSelector ? (
        <button
          type="button"
          onClick={onStyleClick}
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Estilo de Reescrita</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-sm">{selectedStyleLabel || "Selecionar"}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      ) : showAIToggle ? (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Sparkles className={cn("h-4 w-4", aiEnabled ? "text-primary" : "text-muted-foreground")} />
            <Label htmlFor="ai-mode" className="text-sm font-medium">
              IA Avançada
            </Label>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Crown className="h-2.5 w-2.5" />
              Premium
            </span>
          </div>
          <Switch
            id="ai-mode"
            checked={aiEnabled}
            onCheckedChange={onAIToggle}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      ) : null}

      {/* Textarea Container */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            "min-h-[60vh] text-lg leading-relaxed resize-none",
            "rounded-2xl p-6 shadow-lg",
            "border-2 focus-visible:ring-2 transition-all",
            isOverLimit && "border-destructive focus-visible:ring-destructive"
          )}
        />

        {/* Character Counter */}
        <div className={cn(
          "absolute bottom-3 right-3 text-xs font-medium",
          "bg-background/80 backdrop-blur px-2 py-1 rounded-md",
          isOverLimit ? "text-destructive" : "text-muted-foreground"
        )}>
          {charCount.toLocaleString('pt-BR')}
          {!isUnlimited && characterLimit && `/${characterLimit.toLocaleString('pt-BR')}`}
        </div>

        {/* Upload Icon Button */}
        {onFileUpload && (
          <button
            type="button"
            onClick={onFileUpload}
            disabled={isLoading}
            className={cn(
              "absolute bottom-3 left-3 p-2 rounded-lg",
              "bg-background/80 backdrop-blur",
              "hover:bg-primary/10 transition-colors",
              "text-muted-foreground hover:text-primary",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
            aria-label="Upload arquivo"
          >
            <Upload className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Action Button */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full h-14 text-base font-semibold rounded-xl shadow-lg"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {loadingButtonText}
          </>
        ) : (
          submitButtonText
        )}
      </Button>

      {/* Over Limit Warning */}
      {isOverLimit && (
        <p className="text-xs text-destructive text-center">
          {charCount - (characterLimit || 0)} caracteres excedidos
        </p>
      )}
    </div>
  )
}
