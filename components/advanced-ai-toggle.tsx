"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Lock, Zap } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useGoogleAnalytics } from "@/components/google-analytics-wrapper"

interface AdvancedAIToggleProps {
  isPremium: boolean
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  isLoading?: boolean
}

export function AdvancedAIToggle({
  isPremium,
  isEnabled,
  onToggle,
  isLoading = false,
}: AdvancedAIToggleProps) {
  const [showPopover, setShowPopover] = useState(false)
  const router = useRouter()
  const sendGAEvent = useGoogleAnalytics()

  const handleToggle = (checked: boolean) => {
    // Always allow toggle state change
    onToggle(checked)

    if (!isPremium) {
      // For free users, show popover when enabling to explain premium requirement
      if (checked) {
        setShowPopover(true)
        sendGAEvent("advanced_ai_enabled_free_user", {
          category: "upsell",
          label: "free_user_enabled_advanced_ai",
        })
      }
    } else {
      // For premium users, track toggle interactions
      sendGAEvent("advanced_ai_toggled", {
        category: "engagement",
        label: checked ? "enabled" : "disabled",
        value: checked ? 1 : 0,
      })
    }
  }

  const handleUpgradeClick = () => {
    sendGAEvent("advanced_ai_upgrade_clicked", {
      category: "conversion",
      label: "toggle_upsell",
    })
    router.push("/premium")
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
          {isPremium && isEnabled ? (
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          ) : !isPremium ? (
            <Lock className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Zap className="h-5 w-5 text-primary" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="advanced-ai-toggle"
              className="font-semibold text-foreground cursor-pointer"
            >
              IA Avançada
            </Label>
            {isPremium && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Premium
              </span>
            )}
            {!isPremium && (
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                🔒 Premium
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isPremium
              ? "Correções com modelos de IA mais potentes"
              : "Ative para ver os benefícios Premium"}
          </p>
        </div>
      </div>

      {isPremium ? (
        <div className="relative">
          {isEnabled && (
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/50 to-primary/30 blur-sm"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          <Switch
            id="advanced-ai-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            className="relative data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-primary/80"
          />
        </div>
      ) : (
        <Popover open={showPopover} onOpenChange={setShowPopover}>
          <PopoverTrigger asChild>
            <div>
              <Switch
                id="advanced-ai-toggle"
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={isLoading}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-primary/80"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 overflow-hidden" side="top">
            <div className="relative bg-gradient-to-br from-primary/10 via-background to-background p-6">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-center mb-2 gradient-text">
                IA Avançada Premium
              </h3>

              {/* Description */}
              <p className="text-sm text-center text-foreground/70 mb-4">
                Desbloqueie correções com modelos de IA ultrapoderosos para resultados ainda mais precisos e sofisticados.
              </p>

              {/* Benefits */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80">
                    Modelos de IA mais avançados e precisos
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80">
                    Análises mais profundas e detalhadas
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80">
                    Correções ilimitadas sem restrições
                  </span>
                </li>
              </ul>

              {/* CTA Button */}
              <Button
                onClick={handleUpgradeClick}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold"
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Assinar Premium
              </Button>

              {/* Price hint */}
              <p className="text-xs text-center text-muted-foreground mt-3">
                A partir de R$ 14,95/mês
              </p>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
