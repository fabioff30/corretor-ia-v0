/**
 * Card mostrando limite de uso com progress bar
 * Otimizado para conversão com CTAs persuasivos quando limite atingido
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { LucideIcon, AlertTriangle, Unlock, Infinity, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface UsageLimitCardProps {
  title: string
  icon: LucideIcon
  current: number
  limit: number // -1 = ilimitado
  unit: string // ex: "correções", "caracteres"
  className?: string
  showUpgradeButton?: boolean
}

export function UsageLimitCard({
  title,
  icon: Icon,
  current,
  limit,
  unit,
  className,
  showUpgradeButton = true,
}: UsageLimitCardProps) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100)
  const remaining = isUnlimited ? -1 : Math.max(0, limit - current)
  const isNearLimit = percentage >= 66 && percentage < 100 && !isUnlimited
  const isAtLimit = current >= limit && !isUnlimited

  // Determina a cor do progress bar baseado no estado
  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500'
    if (isNearLimit) return 'bg-amber-500'
    return 'bg-primary'
  }

  return (
    <Card className={`${className} ${isAtLimit ? 'border-red-200 dark:border-red-900/50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${isAtLimit ? 'text-red-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent className="space-y-3">
        {isUnlimited ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary flex items-center gap-2">
              <Infinity className="h-5 w-5" />
              <span>Ilimitado</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {current} {unit} hoje • Sem limites
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {current}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{limit}
                  </span>
                </div>
                <span className={`text-sm ${isAtLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                  {isAtLimit ? '0 restantes' : `${remaining} restantes`}
                </span>
              </div>

              <div className={`h-2 rounded-full ${
                isAtLimit
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : isNearLimit
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <motion.div
                  className={`h-full rounded-full ${getProgressColor()}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {isAtLimit && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Alert variant="destructive" className="py-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    Limite diário atingido!
                  </AlertDescription>
                </Alert>

                {showUpgradeButton && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span className="font-medium">Com Premium:</span>
                      <span className="font-bold">{unit} ilimitadas</span>
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold shadow-md"
                    >
                      <Link href="/premium">
                        <Unlock className="mr-1.5 h-3.5 w-3.5" />
                        Desbloquear Agora
                      </Link>
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {isNearLimit && !isAtLimit && (
              <Alert className="py-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                  <span className="font-medium">Atenção:</span> Apenas {remaining} {unit} restante{remaining !== 1 ? 's' : ''} hoje.
                  {showUpgradeButton && (
                    <Link href="/premium" className="ml-1 underline font-medium hover:text-amber-600">
                      Upgrade para ilimitado
                    </Link>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
