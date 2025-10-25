/**
 * Card mostrando limite de uso com progress bar
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { LucideIcon, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
  const percentage = isUnlimited ? 0 : (current / limit) * 100
  const remaining = isUnlimited ? -1 : Math.max(0, limit - current)
  const isNearLimit = percentage > 80 && !isUnlimited
  const isAtLimit = current >= limit && !isUnlimited

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {isUnlimited ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {current}
              <span className="text-sm font-normal text-muted-foreground ml-2">{unit}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              ♾️ Uso ilimitado
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
                <span className="text-sm text-muted-foreground">
                  {remaining} restantes
                </span>
              </div>

              <Progress
                value={percentage}
                className={`h-2 ${
                  isAtLimit
                    ? 'bg-red-100 dark:bg-red-900/20'
                    : isNearLimit
                    ? 'bg-yellow-100 dark:bg-yellow-900/20'
                    : ''
                }`}
              />
            </div>

            {isAtLimit && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Limite diário atingido. {showUpgradeButton && 'Faça upgrade para Pro para uso ilimitado.'}
                </AlertDescription>
              </Alert>
            )}

            {isNearLimit && !isAtLimit && (
              <Alert className="py-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
                  Você está próximo do limite diário.
                </AlertDescription>
              </Alert>
            )}

            {showUpgradeButton && isAtLimit && (
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/upgrade">
                  Upgrade para Pro
                </Link>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
