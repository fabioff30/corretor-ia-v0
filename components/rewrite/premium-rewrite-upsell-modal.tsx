"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Zap, Sparkles, CheckCircle, X } from "lucide-react"
import Link from "next/link"
import {
  PREMIUM_REWRITE_STYLES,
  getRewriteStyle,
  RewriteStyleInternal,
} from "@/utils/rewrite-styles"

interface PremiumRewriteUpsellModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStyle?: RewriteStyleInternal
}

export function PremiumRewriteUpsellModal({
  open,
  onOpenChange,
  selectedStyle,
}: PremiumRewriteUpsellModalProps) {
  const styleDef = selectedStyle ? getRewriteStyle(selectedStyle) : null

  const freeFeatures = [
    { icon: Sparkles, text: "5 estilos de reescrita", free: true },
    { icon: CheckCircle, text: "Até 1.500 caracteres", free: true },
    { icon: CheckCircle, text: "Reescrita básica", free: true },
    { icon: X, text: "Sem anúncios", free: false },
    { icon: X, text: "7 estilos premium", free: false },
    { icon: X, text: "Caracteres ilimitados", free: false },
    { icon: X, text: "Acesso premium", free: false },
  ]

  const premiumFeatures = [
    { text: "Acesso a todos os 12 estilos", tier: "premium" },
    { text: "Reescrita de textos ilimitados", tier: "premium" },
    { text: "Incluindo: Técnico, Jornalístico, Publicitário", tier: "premium" },
    { text: "Blog Post, Roteiros, Apresentações", tier: "premium" },
    { text: "Sem anúncios", tier: "premium" },
    { text: "Histórico completo de reescritas", tier: "premium" },
    { text: "Prioridade no processamento", tier: "premium" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-amber-500" />
            Desbloqueie o Plano Premium
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {styleDef
              ? `O estilo "${styleDef.label}" é exclusivo para assinantes Premium`
              : "Acesse estilos exclusivos e reescrita ilimitada"}
          </DialogDescription>
        </DialogHeader>

        {styleDef && (
          <Card className={`${styleDef.color}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                  <styleDef.icon className={`h-6 w-6 ${styleDef.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{styleDef.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    {styleDef.description}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium">Uso:</span>
                      <p className="text-muted-foreground">{styleDef.usage}</p>
                    </div>
                    <div>
                      <span className="font-medium">Tom:</span>
                      <p className="text-muted-foreground">{styleDef.tone}</p>
                    </div>
                    <div>
                      <span className="font-medium">Comprimento:</span>
                      <p className="text-muted-foreground">{styleDef.length}</p>
                    </div>
                    <div>
                      <span className="font-medium">Exemplo:</span>
                      <p className="text-muted-foreground">{styleDef.example}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Comparison Section */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Comparação de Planos</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Free Plan */}
              <Card className="border-2 bg-slate-50 dark:bg-slate-900">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <h4 className="font-bold text-lg">Plano Gratuito</h4>
                    <p className="text-sm text-muted-foreground">Atual</p>
                  </div>

                  <ul className="space-y-3">
                    {freeFeatures.map((feature, idx) => (
                      <li
                        key={idx}
                        className={`flex items-center gap-2 text-sm ${
                          feature.free ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {feature.free ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 relative">
                <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                  RECOMENDADO
                </div>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <h4 className="font-bold text-lg flex items-center justify-center gap-2">
                      <Crown className="h-5 w-5 text-amber-600" />
                      Plano Premium
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-semibold">
                      Desbloqueie agora
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {premiumFeatures.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Premium Styles Preview */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              <Sparkles className="h-5 w-5 inline mr-2 text-amber-500" />
              7 Estilos Exclusivos Premium
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREMIUM_REWRITE_STYLES.map((style) => (
                <div
                  key={style.id}
                  className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                >
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                  <span className="font-medium">{style.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:mr-2"
          >
            Talvez Depois
          </Button>
          <Link href="/dashboard/upgrade" className="flex-1 sm:flex-none">
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Crown className="h-4 w-4 mr-2" />
              Assinar Agora
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
