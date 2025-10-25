"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Target, Heart, Ruler, Quote } from "lucide-react"
import { RewriteStyleDefinition } from "@/utils/rewrite-styles"

interface StyleDetailsProps {
  style: RewriteStyleDefinition
  isSelected: boolean
  isLocked: boolean
  onSelect: (id: string) => void
  compact?: boolean // Se true, mostra versão compacta para mobile
}

export function StyleDetails({
  style,
  isSelected,
  isLocked,
  onSelect,
  compact = false,
}: StyleDetailsProps) {
  return (
    <div className={`space-y-3 ${compact ? "text-sm" : ""}`}>
      {/* Descrição Completa */}
      <div>
        <p className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
          {style.description}
        </p>
      </div>

      {/* Grid de Informações */}
      <div className={`grid grid-cols-1 gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        {/* Uso */}
        <div className={`flex gap-2 ${compact ? "text-xs" : ""}`}>
          <Target className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-primary flex-shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <p className="font-medium">Uso</p>
            <p className="text-muted-foreground line-clamp-2">{style.usage}</p>
          </div>
        </div>

        {/* Tom */}
        <div className={`flex gap-2 ${compact ? "text-xs" : ""}`}>
          <Heart className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-pink-500 flex-shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <p className="font-medium">Tom</p>
            <p className="text-muted-foreground line-clamp-2">{style.tone}</p>
          </div>
        </div>

        {/* Comprimento */}
        <div className={`flex gap-2 ${compact ? "text-xs" : ""}`}>
          <Ruler className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-blue-500 flex-shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <p className="font-medium">Comprimento</p>
            <p className="text-muted-foreground">{style.length}</p>
          </div>
        </div>

        {/* Exemplo */}
        <div className={`flex gap-2 ${compact ? "text-xs" : ""}`}>
          <Quote className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-purple-500 flex-shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <p className="font-medium">Exemplo</p>
            <p className="text-muted-foreground italic line-clamp-2">{style.example}</p>
          </div>
        </div>
      </div>

      {/* Benefícios */}
      {style.benefits && style.benefits.length > 0 && (
        <div>
          <p className={`font-medium mb-2 ${compact ? "text-xs" : "text-sm"}`}>Características:</p>
          <div className="flex flex-wrap gap-1.5">
            {style.benefits.map((benefit, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className={compact ? "text-xs" : "text-xs"}
              >
                ✓ {benefit}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className={`flex gap-2 pt-2 ${compact ? "flex-col-reverse" : ""}`}>
        {isLocked ? (
          <Button
            size={compact ? "sm" : "default"}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            disabled={true}
          >
            <Crown className="h-4 w-4 mr-1.5" />
            Assinar para Usar
          </Button>
        ) : (
          <Button
            size={compact ? "sm" : "default"}
            variant={isSelected ? "outline" : "default"}
            className="flex-1"
            onClick={() => !isLocked && onSelect(style.id)}
          >
            {isSelected ? "✓ Estilo Selecionado" : "Usar Este Estilo"}
          </Button>
        )}
      </div>
    </div>
  )
}
