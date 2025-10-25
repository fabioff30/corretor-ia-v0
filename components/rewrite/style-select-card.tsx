"use client"

import React from "react"
import { CheckCircle2, Crown } from "lucide-react"
import { RewriteStyleDefinition } from "@/utils/rewrite-styles"

interface StyleSelectCardProps {
  style: RewriteStyleDefinition
  isSelected: boolean
  isLocked: boolean
  onSelect: (id: string) => void
}

export function StyleSelectCard({
  style,
  isSelected,
  isLocked,
  onSelect,
}: StyleSelectCardProps) {
  const Icon = style.icon

  return (
    <button
      onClick={() => onSelect(style.id)}
      className={`
        relative w-full rounded-lg px-3 py-2.5 transition-all duration-200
        flex items-center gap-3 text-left cursor-pointer
        ${
          isSelected
            ? "bg-primary/10 border-2 border-primary"
            : "bg-secondary/50 hover:bg-secondary border-2 border-transparent"
        }
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      `}
      role="option"
      aria-selected={isSelected}
      aria-label={`${style.label}${style.tier === "premium" ? " - Premium" : ""} - ${style.description}`}
    >
      {/* Icon */}
      <Icon className={`h-5 w-5 flex-shrink-0 ${style.iconColor}`} />

      {/* Label */}
      <span className="text-sm font-medium flex-1">{style.label}</span>

      {/* Premium Badge */}
      {style.tier === "premium" && (
        <Crown className="h-4 w-4 text-amber-600 flex-shrink-0" />
      )}

      {/* Selected Checkmark */}
      {isSelected && (
        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
      )}
    </button>
  )
}
