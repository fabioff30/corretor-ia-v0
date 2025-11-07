"use client"

import React, { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, X, Sparkles, AlertCircle } from "lucide-react"
import { PainBannerData } from "@/lib/api/response-normalizer"
import { sendGA4Event } from "@/utils/gtm-helper"

interface PainBannerProps {
  painBanner: PainBannerData
  open: boolean
  onOpenChange: (open: boolean) => void
  onCtaClick: () => void
}

// Map pain types to emojis and colors
const painConfig = {
  concordancia: {
    emoji: "😬",
    color: "rose",
    bgClass: "from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20",
    borderClass: "border-rose-200 dark:border-rose-800",
    iconColor: "text-rose-500",
  },
  virgula: {
    emoji: "🤔",
    color: "blue",
    bgClass: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    borderClass: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
  },
  muito_formal: {
    emoji: "📚",
    color: "purple",
    bgClass: "from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20",
    borderClass: "border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-500",
  },
  muito_informal: {
    emoji: "😎",
    color: "amber",
    bgClass: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    borderClass: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
  },
}

export function PainBanner({ painBanner, open, onOpenChange, onCtaClick }: PainBannerProps) {
  const config = painConfig[painBanner.id]

  // Track banner shown event
  useEffect(() => {
    if (open) {
      sendGA4Event("pain_banner_shown", {
        pain_type: painBanner.id,
        source: "text_correction",
      })
    }
  }, [open, painBanner.id])

  const handleClose = () => {
    sendGA4Event("pain_banner_dismissed", {
      pain_type: painBanner.id,
    })
    onOpenChange(false)
  }

  const handleCtaClick = () => {
    sendGA4Event("pain_banner_cta_click", {
      pain_type: painBanner.id,
      destination: "/premium",
    })
    onCtaClick()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-3xl">{config.emoji}</span>
            <span>{painBanner.title}</span>
          </DialogTitle>
          <DialogDescription className="text-base mt-3 text-foreground/90">
            {painBanner.description}
          </DialogDescription>
        </DialogHeader>

        {/* Highlight Card */}
        <Card className={`bg-gradient-to-br ${config.bgClass} ${config.borderClass} border-2`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <Crown className={`h-6 w-6 ${config.iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Sparkles className={`h-5 w-5 ${config.iconColor}`} />
                  Solução Premium
                </h3>
                <p className="text-sm text-foreground/90 font-medium">{painBanner.highlight}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Com o Plano Premium, você tem acesso a correções ilimitadas, análise detalhada de cada erro e
              suporte dedicado para melhorar sua escrita.
            </span>
          </p>
        </div>

        <DialogFooter className="gap-3 sm:gap-0 flex-col sm:flex-row">
          <Button variant="ghost" onClick={handleClose} className="w-full sm:w-auto order-2 sm:order-1">
            Talvez Depois
          </Button>
          <Button
            onClick={handleCtaClick}
            className={`w-full sm:w-auto bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 hover:from-${config.color}-600 hover:to-${config.color}-700 order-1 sm:order-2`}
          >
            <Crown className="h-4 w-4 mr-2" />
            Assinar Premium - R$ 29,90/mês
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
