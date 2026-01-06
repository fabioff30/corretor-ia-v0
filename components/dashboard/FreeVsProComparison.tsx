/**
 * Componente de comparação Free vs Pro
 * Mostra claramente o que o usuário está perdendo com o plano gratuito
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Check,
  X,
  Crown,
  Zap,
  FileText,
  Brain,
  RefreshCw,
  Ban,
  History,
  Gauge,
  Infinity,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface FreeVsProComparisonProps {
  className?: string
  variant?: 'full' | 'compact'
}

interface ComparisonItem {
  feature: string
  icon: React.ElementType
  free: string | number | boolean
  pro: string | number | boolean
  highlight?: boolean
}

export function FreeVsProComparison({ className, variant = 'full' }: FreeVsProComparisonProps) {
  const comparisonItems: ComparisonItem[] = [
    {
      feature: 'Correções por dia',
      icon: FileText,
      free: 3,
      pro: 'Ilimitado',
      highlight: true
    },
    {
      feature: 'Caracteres por texto',
      icon: FileText,
      free: '1.500',
      pro: '20.000',
      highlight: true
    },
    {
      feature: 'Análises de IA por dia',
      icon: Brain,
      free: 1,
      pro: 'Ilimitado'
    },
    {
      feature: 'Reescritas por dia',
      icon: RefreshCw,
      free: 3,
      pro: 'Ilimitado'
    },
    {
      feature: 'Anúncios',
      icon: Ban,
      free: 'Com anúncios',
      pro: 'Sem anúncios'
    },
    {
      feature: 'Histórico de textos',
      icon: History,
      free: '7 dias',
      pro: 'Completo'
    },
    {
      feature: 'Velocidade de processamento',
      icon: Gauge,
      free: 'Normal',
      pro: 'Prioritário'
    }
  ]

  const renderValue = (value: string | number | boolean, isPro: boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-red-400" />
      )
    }

    if (value === 'Ilimitado') {
      return (
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
          <Infinity className="h-4 w-4" />
          Ilimitado
        </span>
      )
    }

    if (isPro && (value === 'Sem anúncios' || value === 'Completo' || value === 'Prioritário')) {
      return (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
          <Check className="h-4 w-4" />
          {value}
        </span>
      )
    }

    if (!isPro && (value === 'Com anúncios' || value === '7 dias' || value === 'Normal')) {
      return (
        <span className="text-muted-foreground">{value}</span>
      )
    }

    return <span className={isPro ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>{value}</span>
  }

  if (variant === 'compact') {
    const mainItems = comparisonItems.slice(0, 4)
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`${className} border-dashed border-2`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              O que você está perdendo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {mainItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.feature}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 line-through">{item.free}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      {item.pro === 'Ilimitado' && <Infinity className="h-3 w-3" />}
                      {item.pro}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              asChild
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
            >
              <Link href="/premium">
                Desbloquear Tudo
              </Link>
            </Button>
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
      <Card className={`${className} overflow-hidden`}>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Compare os Planos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Veja o que você ganha ao fazer upgrade
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-3 border-b bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
            <div className="text-sm font-medium text-muted-foreground">Recurso</div>
            <div className="text-center text-sm font-medium text-muted-foreground">Gratuito</div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                <Crown className="h-3 w-3" />
                Premium
              </span>
            </div>
          </div>

          {/* Linhas da tabela */}
          <div className="divide-y">
            {comparisonItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`grid grid-cols-3 px-4 py-3 items-center ${
                  item.highlight
                    ? 'bg-amber-50/50 dark:bg-amber-950/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <item.icon className={`h-4 w-4 ${item.highlight ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <span className={item.highlight ? 'font-medium' : ''}>{item.feature}</span>
                </div>
                <div className="text-center text-sm">
                  {renderValue(item.free, false)}
                </div>
                <div className="text-center text-sm">
                  {renderValue(item.pro, true)}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Comece agora a partir de
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  R$19,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold shadow-lg"
              >
                <Link href="/premium">
                  <Zap className="mr-2 h-5 w-5" />
                  Desbloquear Acesso Premium
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
