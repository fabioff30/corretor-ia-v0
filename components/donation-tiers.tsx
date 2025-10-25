"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Heart, Star, Crown, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DonationTier {
  id: string
  name: string
  price: string
  description: string
  icon: React.ReactNode
  benefits: string[]
  popular?: boolean
  color: string
}

export function DonationTiers() {
  const tiers: DonationTier[] = [
    {
      id: "bronze",
      name: "Apoiador Bronze",
      price: "R$10",
      description: "Apoio básico para manter o corretor funcionando",
      icon: <Heart className="h-5 w-5" />,
      benefits: ["Nome na lista de apoiadores", "Sem anúncios por 1 mês", "Limite de 2.000 caracteres"],
      color: "bg-amber-600",
    },
    {
      id: "silver",
      name: "Apoiador Prata",
      price: "R$25",
      description: "Apoio intermediário com mais benefícios",
      icon: <Star className="h-5 w-5" />,
      benefits: [
        "Nome destacado na lista de apoiadores",
        "Sem anúncios por 3 meses",
        "Limite de 3.000 caracteres",
        "Acesso a recursos beta",
      ],
      popular: true,
      color: "bg-slate-400",
    },
    {
      id: "gold",
      name: "Apoiador Ouro",
      price: "R$50",
      description: "Apoio premium com todos os benefícios",
      icon: <Crown className="h-5 w-5" />,
      benefits: [
        "Nome destacado com badge especial",
        "Sem anúncios por 6 meses",
        "Limite de 5.000 caracteres",
        "Acesso a todos os recursos beta",
        "Suporte prioritário por email",
      ],
      color: "bg-yellow-500",
    },
  ]

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Apoie o CorretorIA</h2>
        <p className="text-foreground/80 max-w-[700px] mx-auto">
          Conheça os níveis de apoio disponíveis para ajudar a manter o corretor gratuito para todos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col h-full"
          >
            <Card className={`h-full flex flex-col relative ${tier.popular ? "border-primary shadow-md" : ""}`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">Mais popular</Badge>
                </div>
              )}

              <CardHeader className={`rounded-t-lg ${tier.color} text-white`}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="p-2 bg-white/20 rounded-full">{tier.icon}</div>
                </div>
                <CardDescription className="text-white/90 mt-2">{tier.description}</CardDescription>
                <div className="mt-2 text-2xl font-bold">{tier.price}</div>
              </CardHeader>

              <CardContent className="flex-grow pt-6">
                <ul className="space-y-3">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Entre em contato para saber mais sobre como apoiar o projeto.</p>
        <p className="mt-1">
          Ao apoiar, você concorda com nossos{" "}
          <a href="/termos" className="text-primary hover:underline">
            Termos de Serviço
          </a>
          .
        </p>
      </div>
    </div>
  )
}
