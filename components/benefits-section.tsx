import { Check, Zap, Shield, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"

export function BenefitsSection() {
  const features = [
    {
      icon: <Check className="h-6 w-6 text-primary" />,
      title: "Corretor de Texto Preciso",
      description:
        "Correções precisas de gramática, ortografia e pontuação baseadas nas regras do português brasileiro e europeu, com análise contextual avançada.",
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Correção Rápida e Eficiente",
      description:
        "Nosso corretor de texto processa seu conteúdo instantaneamente, permitindo corrigir textos de qualquer tamanho em segundos.",
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Privacidade Garantida",
      description:
        "Seu texto não é armazenado permanentemente em nossos servidores após a correção, garantindo total confidencialidade do seu conteúdo.",
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Disponível 24/7",
      description:
        "Acesse nosso corretor de texto a qualquer hora, de qualquer lugar, sem necessidade de instalação ou cadastro. Sempre disponível quando você precisar.",
    },
  ]

  return (
    <section id="recursos" className="py-16 relative overflow-hidden bg-muted/30">
      <div className="max-w-[1366px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Recursos exclusivos
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">
            Por que escolher nosso Corretor de Texto e Ortográfico
          </h2>
          <p className="text-muted-foreground max-w-[700px] mx-auto">
            Descubra por que milhares de pessoas escolhem nosso corretor de texto online para aprimorar a qualidade da
            escrita em português
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="h-full">
              <div className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
