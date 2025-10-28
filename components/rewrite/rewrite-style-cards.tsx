"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Target,
  Clock,
  Crown,
  ArrowRight,
} from "lucide-react"
import { FREE_REWRITE_STYLES, PREMIUM_REWRITE_STYLES } from "@/utils/rewrite-styles"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RewriteStyleCards() {
  const renderStyleGroup = (
    title: string,
    styles: typeof FREE_REWRITE_STYLES,
    showPremiumBadge: boolean = false
  ) => (
    <div className="mb-16">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            {title}
          </h2>
          {showPremiumBadge && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Exclusivo
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {showPremiumBadge
            ? "Desbloqueie 7 estilos exclusivos para criar conteúdo ainda mais profissional"
            : "5 estilos poderosos para qualquer situação de escrita"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {styles.map((style) => {
          const Icon = style.icon

          return (
            <Card
              key={style.id}
              className={`transition-all duration-300 hover:shadow-lg ${style.color}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${style.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{style.label}</h3>
                      {style.tier === "premium" && (
                        <Badge className={style.badgeColor}>
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {style.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Uso:
                    </h4>
                    <p className="text-xs text-muted-foreground">{style.usage}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Tom:</h4>
                    <p className="text-xs text-muted-foreground">{style.tone}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Comprimento:</h4>
                    <p className="text-xs text-muted-foreground">{style.length}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Exemplo:</h4>
                    <p className="text-xs text-muted-foreground italic">{style.example}</p>
                  </div>
                </div>

                {style.tier === "premium" && (
                  <Link href="/dashboard/upgrade" className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      <Crown className="h-4 w-4 mr-1 text-amber-600" />
                      Assinar para Usar
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  return (
    <section className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          Estilos de Reescrita Disponíveis
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Transforme seu texto no estilo perfeito para cada situação. Nossa IA adapta o tom,
          vocabulário e estrutura mantendo o significado original.
        </p>
      </div>

      {/* Free Styles */}
      {renderStyleGroup(
        "Modelos Gratuitos",
        FREE_REWRITE_STYLES,
        false
      )}

      {/* Premium Styles */}
      {renderStyleGroup(
        "Modelos Premium",
        PREMIUM_REWRITE_STYLES,
        true
      )}

      {/* Premium CTA */}
      <div className="mt-16 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-amber-600" />
              Desbloqueie 7 Estilos Exclusivos
            </h3>
            <p className="text-muted-foreground">
              Com o plano Premium, você terá acesso a Técnico, Jornalístico, Publicitário, Blog Post,
              Roteiro para Reels, Roteiro para YouTube e Palestra/Apresentação. Até 20.000 caracteres por texto.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <span>12 estilos de reescrita</span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <span>Até 20.000 caracteres</span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <span>Sem anúncios</span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <span>Histórico completo</span>
            </div>
          </div>

          <Link href="/dashboard/upgrade">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              Assinar Agora
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            Reescrita em segundos com tecnologia de IA avançada
          </span>
        </div>
      </div>
    </section>
  )
}
