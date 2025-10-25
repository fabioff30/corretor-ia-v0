/**
 * Banner promocional para upgrade para o plano Pro
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Check } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface UpgradeBannerProps {
  className?: string
}

export function UpgradeBanner({ className }: UpgradeBannerProps) {
  const benefits = [
    'Correções ilimitadas',
    'Reescritas ilimitadas',
    'Análises de IA ilimitadas',
    'Sem limite de caracteres',
    'Experiência sem anúncios',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-800 ${className || ''}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                  Upgrade para o Plano Pro
                </h3>
              </div>

              <ul className="space-y-2">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center text-sm text-yellow-800 dark:text-yellow-200">
                    <Check className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-auto">
              <Button
                asChild
                size="lg"
                className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-lg"
              >
                <Link href="/dashboard/upgrade">
                  <Crown className="mr-2 h-5 w-5" />
                  Ver Planos Pro
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
