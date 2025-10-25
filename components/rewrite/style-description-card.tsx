"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Target, Heart, Ruler, Sparkles, ArrowRight } from "lucide-react"
import { RewriteStyleDefinition } from "@/utils/rewrite-styles"

interface StyleDescriptionCardProps {
  style: RewriteStyleDefinition | null
  compact?: boolean
  isPremium?: boolean
  onPremiumClick?: () => void
}

export function StyleDescriptionCard({
  style,
  compact = false,
  isPremium = false,
  onPremiumClick,
}: StyleDescriptionCardProps) {
  if (!style) {
    return null
  }

  const Icon = style.icon
  const isPremiumStyle = style.tier === "premium"
  const isLocked = isPremiumStyle && !isPremium

  return (
    <div
      className={`
        rounded-lg border p-4 space-y-2
        ${isLocked
          ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
          : "bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30"
        }
        transition-all duration-200
      `}
    >
      {/* Header: Icon + Name + Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg ${style.color} flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            {style.label}
            {isPremiumStyle && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 text-xs">
                <Crown className="h-3 w-3 mr-0.5" />
                Premium
              </Badge>
            )}
          </h4>
        </div>
      </div>

      {/* Description */}
      <p className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
        {style.description}
      </p>

      {/* Premium CTA for locked styles */}
      {isLocked && (
        <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Este estilo exclusivo está disponível no plano Premium
          </p>
          <Button
            size="sm"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            onClick={onPremiumClick || (() => window.location.href = "/pricing")}
          >
            <Crown className="h-4 w-4 mr-1.5" />
            Assinar Premium e Testar
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Teste grátis por 7 dias • Cancele quando quiser
          </p>
        </div>
      )}

      {/* Info Grid */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-primary/10">
          {/* Uso */}
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Target className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span>Uso</span>
            </div>
            <p className="text-muted-foreground ml-5 line-clamp-2">
              {style.usage}
            </p>
          </div>

          {/* Tom */}
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Heart className="h-3.5 w-3.5 text-pink-500 flex-shrink-0" />
              <span>Tom</span>
            </div>
            <p className="text-muted-foreground ml-5 line-clamp-2">
              {style.tone}
            </p>
          </div>

          {/* Comprimento */}
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Ruler className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              <span>Comprimento</span>
            </div>
            <p className="text-muted-foreground ml-5 line-clamp-2">
              {style.length}
            </p>
          </div>
        </div>
      )}

      {/* Compact mobile info */}
      {compact && (
        <div className="text-xs space-y-1 pt-1">
          <p className="text-muted-foreground">
            <span className="font-medium">Uso:</span> {style.usage}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Tom:</span> {style.tone}
          </p>
        </div>
      )}
    </div>
  )
}
