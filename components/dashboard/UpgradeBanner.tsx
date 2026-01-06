/**
 * Banner promocional para upgrade para o plano Pro
 * Otimizado para conversão com preços visíveis, prova social e CTAs persuasivos
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Check, Sparkles, Shield, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface UpgradeBannerProps {
  className?: string
  variant?: 'default' | 'compact'
}

export function UpgradeBanner({ className, variant = 'default' }: UpgradeBannerProps) {
  const benefits = [
    { text: 'Correções ilimitadas', icon: Zap },
    { text: 'Até 20.000 caracteres', icon: Sparkles },
    { text: 'Sem anúncios', icon: Shield },
    { text: 'Prioridade no processamento', icon: Crown },
  ]

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`bg-gradient-to-r from-amber-500 to-yellow-500 border-0 shadow-lg ${className || ''}`}>
          <CardContent className="py-4 px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-white" />
                <span className="text-white font-medium">
                  Desbloqueie acesso ilimitado
                </span>
                <span className="text-white/90 text-sm hidden sm:inline">
                  a partir de R$19,90/mês
                </span>
              </div>
              <Button
                asChild
                size="sm"
                className="bg-white text-amber-600 hover:bg-amber-50 font-bold shadow-md"
              >
                <Link href="/premium">
                  Começar Agora
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40 border-amber-200 dark:border-amber-800 overflow-hidden ${className || ''}`}>
        {/* Ribbon de destaque */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold py-1.5 px-4 text-center">
          <Sparkles className="h-3 w-3 inline mr-1" />
          OFERTA ESPECIAL - Economize 33% no plano anual
        </div>

        <CardContent className="pt-5 pb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Seção de benefícios */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">
                    Upgrade para Premium
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Desbloqueie todo o potencial do CorretorIA
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-amber-800 dark:text-amber-200 bg-white/50 dark:bg-white/5 rounded-lg px-3 py-2"
                  >
                    <benefit.icon className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* Prova social */}
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <Users className="h-4 w-4" />
                <span>+5.000 usuários já usam Premium</span>
                <span className="text-amber-500">•</span>
                <span className="flex items-center">
                  <span className="text-amber-500 mr-1">★</span>
                  4.8/5 avaliação
                </span>
              </div>
            </div>

            {/* Seção de preços e CTA */}
            <div className="w-full lg:w-auto space-y-3">
              {/* Cards de preço */}
              <div className="flex gap-3">
                {/* Mensal */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl p-3 border border-amber-200 dark:border-amber-800 text-center min-w-[120px]">
                  <p className="text-xs text-muted-foreground mb-1">Mensal</p>
                  <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
                    R$29<span className="text-sm font-normal">,90</span>
                  </p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>

                {/* Anual - Destacado */}
                <div className="flex-1 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl p-3 text-center min-w-[120px] relative shadow-lg">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    MELHOR VALOR
                  </div>
                  <p className="text-xs text-white/80 mb-1">Anual</p>
                  <p className="text-xl font-bold text-white">
                    R$19<span className="text-sm font-normal">,90</span>
                  </p>
                  <p className="text-xs text-white/80">/mês</p>
                </div>
              </div>

              {/* Botão principal */}
              <Button
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold shadow-lg text-base h-12"
              >
                <Link href="/premium">
                  <Zap className="mr-2 h-5 w-5" />
                  Desbloquear Acesso Ilimitado
                </Link>
              </Button>

              {/* Garantia */}
              <div className="flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                <Shield className="h-3.5 w-3.5" />
                <span>Garantia de 7 dias • Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
