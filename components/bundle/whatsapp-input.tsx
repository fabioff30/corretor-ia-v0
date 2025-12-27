"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageCircle, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface WhatsAppInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

/**
 * Formats a phone number to Brazilian WhatsApp format
 * Input: raw digits
 * Output: +55 (XX) XXXXX-XXXX
 */
function formatWhatsAppNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "")

  // Limit to 13 digits (55 + DDD + 9 digits)
  const limited = digits.slice(0, 13)

  // Build formatted string
  let formatted = ""

  if (limited.length > 0) {
    // Country code
    if (limited.length >= 2) {
      formatted = `+${limited.slice(0, 2)}`
    } else {
      formatted = `+${limited}`
    }

    // DDD (area code)
    if (limited.length >= 4) {
      formatted += ` (${limited.slice(2, 4)})`
    } else if (limited.length > 2) {
      formatted += ` (${limited.slice(2)}`
    }

    // First part of number
    if (limited.length >= 9) {
      formatted += ` ${limited.slice(4, 9)}`
    } else if (limited.length > 4) {
      formatted += ` ${limited.slice(4)}`
    }

    // Second part of number (after dash)
    if (limited.length > 9) {
      formatted += `-${limited.slice(9)}`
    }
  }

  return formatted
}

/**
 * Validates a Brazilian WhatsApp phone number
 */
function validateWhatsAppPhone(value: string): { isValid: boolean; message?: string } {
  const digits = value.replace(/\D/g, "")

  if (digits.length === 0) {
    return { isValid: false, message: "Digite seu WhatsApp" }
  }

  if (!digits.startsWith("55")) {
    return { isValid: false, message: "Use o formato brasileiro (+55)" }
  }

  if (digits.length < 12) {
    return { isValid: false, message: "Número incompleto" }
  }

  if (digits.length > 13) {
    return { isValid: false, message: "Número muito longo" }
  }

  // Check DDD (valid range: 11-99)
  const ddd = parseInt(digits.substring(2, 4), 10)
  if (ddd < 11 || ddd > 99) {
    return { isValid: false, message: "DDD inválido" }
  }

  return { isValid: true }
}

export function WhatsAppInput({
  value,
  onChange,
  error,
  disabled = false,
  className,
}: WhatsAppInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-add +55 prefix on first interaction
  useEffect(() => {
    if (isFocused && value === "") {
      onChange("+55 ")
    }
  }, [isFocused, value, onChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const formatted = formatWhatsAppNumber(rawValue)
    onChange(formatted)
    setHasInteracted(true)
  }

  const validation = validateWhatsAppPhone(value)
  const showError = hasInteracted && !validation.isValid && !isFocused
  const showSuccess = hasInteracted && validation.isValid

  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor="whatsapp"
        className="text-sm font-medium flex items-center gap-2 text-foreground"
      >
        <MessageCircle className="h-4 w-4 text-green-500" />
        WhatsApp
      </Label>

      <div className="relative">
        <Input
          ref={inputRef}
          id="whatsapp"
          type="tel"
          inputMode="numeric"
          placeholder="+55 (XX) XXXXX-XXXX"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={cn(
            "pl-4 pr-10 h-12 text-base transition-all duration-200",
            "bg-background/50 backdrop-blur-sm",
            "border-2",
            showError && "border-red-500/50 focus:border-red-500",
            showSuccess && "border-green-500/50 focus:border-green-500",
            !showError && !showSuccess && "border-border/50 focus:border-primary"
          )}
        />

        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {showSuccess && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10">
              <Check className="h-4 w-4 text-green-500" />
            </div>
          )}
          {showError && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {(showError || error) && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error || validation.message}
        </p>
      )}

      {/* Helper text */}
      {!showError && !error && (
        <p className="text-xs text-muted-foreground">
          Usaremos para ativar o Julinho no seu WhatsApp
        </p>
      )}
    </div>
  )
}

export { validateWhatsAppPhone, formatWhatsAppNumber }
