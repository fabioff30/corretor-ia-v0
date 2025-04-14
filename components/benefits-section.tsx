"use client"

import { Check, Zap, Shield, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

export function BenefitsSection() {
  const features = [
    {
      icon: <Check className="h-6 w-6 text-primary" />,
      title: "Precisão Linguística",
      description:
        "Correções precisas de gramática, ortografia e pontuação baseadas nas regras do português brasileiro e europeu.",
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Rapidez e Eficiência",
      description:
        "Obtenha resultados instantâneos com nossa tecnologia de processamento de linguagem natural de alta velocidade.",
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Privacidade Total",
      description:
        "Seus textos não são armazenados permanentemente em nossos servidores, garantindo a confidencialidade do seu conteúdo.",
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Disponibilidade 24/7",
      description:
        "Acesse nossa ferramenta a qualquer hora, de qualquer lugar, sem necessidade de instalação ou cadastro.",
    },
  ]

  return (
    <section id="recursos" className="py-16 relative overflow-hidden bg-muted/30">
      <div className="max-w-[1366px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Recursos exclusivos
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Benefícios do CorretorIA</h2>
          <p className="text-muted-foreground max-w-[700px] mx-auto">
            Descubra por que milhares de pessoas escolhem nossa ferramenta para corrigir seus textos em português
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <div className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
