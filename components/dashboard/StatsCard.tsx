/**
 * Card de estatísticas para o dashboard
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  progress?: {
    current: number
    max: number
    showLabel?: boolean
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  progress,
  className,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}

        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>{' '}
            {trend.label}
          </p>
        )}

        {progress && (
          <div className="mt-3 space-y-1">
            <Progress
              value={(progress.current / progress.max) * 100}
              className="h-2"
            />
            {progress.showLabel && (
              <p className="text-xs text-muted-foreground">
                {progress.current} / {progress.max === -1 ? '∞' : progress.max}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
