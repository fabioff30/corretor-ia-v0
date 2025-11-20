"use client"

import { Star } from "lucide-react"

interface MobileQuickStatsProps {
  rating?: number
  reviewCount?: number
  usageCount?: number
  usageLimit?: number
  isPremium?: boolean
}

export function MobileQuickStats({
  rating = 4.8,
  reviewCount = 1200,
  usageCount = 0,
  usageLimit = 3,
  isPremium = false,
}: MobileQuickStatsProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
      {/* Rating */}
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{rating}</span>
        <span className="opacity-60">({(reviewCount / 1000).toFixed(1)}k)</span>
      </div>

      <span className="opacity-40">•</span>

      {/* Usage Counter */}
      {!isPremium && (
        <div className="flex items-center gap-1">
          <span className="font-medium">{usageCount}/{usageLimit}</span>
          <span className="opacity-60">usos hoje</span>
        </div>
      )}

      {isPremium && (
        <div className="flex items-center gap-1 text-primary">
          <span className="font-medium">Ilimitado</span>
        </div>
      )}
    </div>
  )
}
