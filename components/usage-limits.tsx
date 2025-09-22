'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  RefreshCw,
  Brain,
  Sparkles,
  MessageSquare,
  Infinity
} from 'lucide-react'

interface FeatureUsage {
  allowed: boolean
  reason: string
  daily_limit?: number | null
  monthly_limit?: number | null
  daily_used: number
  monthly_used: number
}

interface UsageLimitsProps {
  features: {
    corrections?: FeatureUsage
    rewrites?: FeatureUsage
    ai_analysis?: FeatureUsage
    humanization?: FeatureUsage
    julinho_ai?: FeatureUsage
  }
  planName?: string
}

const FeatureIcon = ({ name }: { name: string }) => {
  switch (name) {
    case 'corrections':
      return <FileText className="h-5 w-5" />
    case 'rewrites':
      return <RefreshCw className="h-5 w-5" />
    case 'ai_analysis':
      return <Brain className="h-5 w-5" />
    case 'humanization':
      return <Sparkles className="h-5 w-5" />
    case 'julinho_ai':
      return <MessageSquare className="h-5 w-5" />
    default:
      return <FileText className="h-5 w-5" />
  }
}

const FeatureName = ({ name }: { name: string }) => {
  switch (name) {
    case 'corrections':
      return 'Correções'
    case 'rewrites':
      return 'Reescritas'
    case 'ai_analysis':
      return 'Análise de IA'
    case 'humanization':
      return 'Humanização'
    case 'julinho_ai':
      return 'Julinho IA'
    default:
      return name
  }
}

const UsageBar = ({
  used,
  limit,
  type
}: {
  used: number
  limit: number | null | undefined
  type: 'daily' | 'monthly'
}) => {
  if (!limit) {
    return (
      <div className="flex items-center gap-2">
        <Infinity className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-600 font-medium">Ilimitado</span>
      </div>
    )
  }

  const percentage = Math.min((used / limit) * 100, 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {type === 'daily' ? 'Hoje' : 'Este mês'}
        </span>
        <span className={`font-medium ${
          isAtLimit ? 'text-red-600' :
          isNearLimit ? 'text-yellow-600' :
          'text-foreground'
        }`}>
          {used} / {limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${
          isAtLimit ? '[&>*]:bg-red-600' :
          isNearLimit ? '[&>*]:bg-yellow-600' :
          ''
        }`}
      />
    </div>
  )
}

export function UsageLimits({ features, planName = 'Free' }: UsageLimitsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Uso de Recursos</CardTitle>
          <Badge variant="outline" className="font-semibold">
            Plano {planName}
          </Badge>
        </div>
        <CardDescription>
          Acompanhe seu uso diário e mensal de cada recurso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(features).map(([key, feature]) => {
          if (!feature) return null

          const hasDaily = feature.daily_limit !== null && feature.daily_limit !== undefined
          const hasMonthly = feature.monthly_limit !== null && feature.monthly_limit !== undefined
          const isUnavailable = !feature.allowed && feature.reason === 'Feature not available in current plan'

          return (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2">
                <FeatureIcon name={key} />
                <span className="font-medium">
                  <FeatureName name={key} />
                </span>
                {isUnavailable && (
                  <Badge variant="secondary" className="text-xs">
                    Não disponível
                  </Badge>
                )}
              </div>

              {!isUnavailable && (
                <div className="pl-7 space-y-3">
                  {hasDaily && (
                    <UsageBar
                      used={feature.daily_used}
                      limit={feature.daily_limit}
                      type="daily"
                    />
                  )}
                  {hasMonthly && (
                    <UsageBar
                      used={feature.monthly_used}
                      limit={feature.monthly_limit}
                      type="monthly"
                    />
                  )}
                  {!hasDaily && !hasMonthly && (
                    <div className="flex items-center gap-2">
                      <Infinity className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        Uso ilimitado
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}