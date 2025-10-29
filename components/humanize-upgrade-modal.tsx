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
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Sparkles, CheckCircle, X, Wand2 } from "lucide-react"
import Link from "next/link"

interface HumanizeUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HumanizeUpgradeModal({ open, onOpenChange }: HumanizeUpgradeModalProps) {
  const freeFeatures = [
    { icon: Sparkles, text: "Detector de IA gratuito", free: true },
    { icon: CheckCircle, text: "2 detecções por dia", free: true },
    { icon: CheckCircle, text: "Até 10.000 caracteres", free: true },
    { icon: X, text: "Humanização de textos", free: false },
    { icon: X, text: "Detecções ilimitadas", free: false },
    { icon: X, text: "Histórico completo", free: false },
    { icon: X, text: "Suporte prioritário", free: false },
  ]

  const premiumFeatures = [
    { text: "Humanização ilimitada de textos", tier: "premium" },
    { text: "Remova sinais de IA automaticamente", tier: "premium" },
    { text: "5 modos de humanização (default, acadêmico, jornalístico, blog, jurídico)", tier: "premium" },
    { text: "Até 20.000 caracteres por texto", tier: "premium" },
    { text: "Detecções de IA ilimitadas", tier: "premium" },
    { text: "Histórico completo de análises", tier: "premium" },
    { text: "Suporte dedicado em até 24h", tier: "premium" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-amber-500" />
            Desbloqueie a Humanização de Textos
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Remova sinais de IA e torne seus textos mais naturais e autênticos com o Plano Premium
          </DialogDescription>
        </DialogHeader>

        {/* Feature Highlight Card */}
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <Wand2 className="h-6 w-6 text-violet-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Humanização Inteligente de Textos</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Nossa ferramenta de humanização utiliza IA avançada para remover padrões artificiais e
                  tornar seus textos mais fluidos, naturais e autênticos.
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Remoção automática de termos artificiais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Texto mais fluido e natural</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>5 modos de humanização especializados</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              <Sparkles className="h-5 w-5 inline mr-2 text-violet-500" />
              Casos de Uso
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm">
                <div className="font-medium mb-1">📚 Trabalhos Acadêmicos</div>
                <p className="text-muted-foreground text-xs">
                  Torne textos gerados por IA mais naturais para trabalhos universitários
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm">
                <div className="font-medium mb-1">📝 Artigos de Blog</div>
                <p className="text-muted-foreground text-xs">
                  Humanize conteúdo para blogs com tom mais pessoal e autêntico
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm">
                <div className="font-medium mb-1">📰 Conteúdo Jornalístico</div>
                <p className="text-muted-foreground text-xs">
                  Adapte textos para estilo jornalístico profissional
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm">
                <div className="font-medium mb-1">⚖️ Documentos Jurídicos</div>
                <p className="text-muted-foreground text-xs">
                  Humanize textos legais mantendo formalidade e precisão
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:mr-2">
            Talvez Depois
          </Button>
          <Link href="/dashboard/upgrade" className="flex-1 sm:flex-none">
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Crown className="h-4 w-4 mr-2" />
              Assinar Premium
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
