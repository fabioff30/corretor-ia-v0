"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Heart,
  GraduationCap,
  Palette,
  Baby,
  Sparkles,
  Target,
  Clock
} from "lucide-react"

const rewriteStyles = [
  {
    name: "Formal",
    icon: Briefcase,
    description: "Ideal para documentos profissionais e comunicações corporativas",
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    examples: ["E-mails corporativos", "Relatórios", "Propostas comerciais"],
    benefits: ["Tom respeitoso", "Linguagem técnica", "Estrutura clara"]
  },
  {
    name: "Humanizado",
    icon: Heart,
    description: "Perfeito para comunicações naturais e acessíveis",
    color: "bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800",
    iconColor: "text-rose-600 dark:text-rose-400",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
    examples: ["Posts em redes sociais", "E-mails pessoais", "Mensagens"],
    benefits: ["Tom conversacional", "Linguagem simples", "Conexão emocional"]
  },
  {
    name: "Acadêmico",
    icon: GraduationCap,
    description: "Adequado para trabalhos científicos e pesquisas",
    color: "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    examples: ["Artigos científicos", "Dissertações", "Papers"],
    benefits: ["Linguagem técnica", "Argumentação sólida", "Estrutura acadêmica"]
  },
  {
    name: "Criativo",
    icon: Palette,
    description: "Excelente para conteúdo expressivo e marketing",
    color: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-400",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    examples: ["Conteúdo de marketing", "Histórias", "Descrições criativas"],
    benefits: ["Linguagem envolvente", "Metáforas", "Tom inspirador"]
  },
  {
    name: "Como uma Criança",
    icon: Baby,
    description: "Simplifica o texto para linguagem acessível",
    color: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    examples: ["Material educativo", "Explicações simples", "Conteúdo infantil"],
    benefits: ["Vocabulário simples", "Frases curtas", "Linguagem lúdica"]
  }
]

export function RewriteStyleCards() {
  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Estilos de Reescrita Disponíveis
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Transforme seu texto no estilo perfeito para cada situação. Nossa IA adapta o tom,
          vocabulário e estrutura mantendo o significado original.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {rewriteStyles.map((style, index) => {
          const Icon = style.icon
          return (
            <Card key={index} className={`transition-all duration-300 hover:shadow-lg ${style.color}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                    <Icon className={`h-6 w-6 ${style.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{style.name}</h3>
                    <Badge className={style.badgeColor}>IA Avançada</Badge>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {style.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Ideal para:
                    </h4>
                    <ul className="text-xs space-y-1">
                      {style.examples.map((example, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-current rounded-full" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      Características:
                    </h4>
                    <ul className="text-xs space-y-1">
                      {style.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-current rounded-full" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center">
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