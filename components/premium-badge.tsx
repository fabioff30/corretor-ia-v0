"use client"

import { Crown } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/utils/classnames"

interface PremiumBadgeProps {
    className?: string
}

export function PremiumBadge({ className }: PremiumBadgeProps) {
    const { isPro } = useUser()

    if (!isPro) return null

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400",
            className
        )}>
            <Crown className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Premium Ativo</span>
        </div>
    )
}
