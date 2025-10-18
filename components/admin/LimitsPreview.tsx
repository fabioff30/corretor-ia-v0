'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, FileText, Repeat2, ScanSearch, Eye } from 'lucide-react'

interface PlanLimits {
  id: string
  plan_type: 'free' | 'pro'
  max_characters: number
  corrections_per_day: number
  rewrites_per_day: number
  ai_analyses_per_day: number
  show_ads: boolean
}

interface LimitsPreviewProps {
  limits: PlanLimits[]
}

export function LimitsPreview({ limits }: LimitsPreviewProps) {
  const freeLimits = limits.find((l) => l.plan_type === 'free')
  const proLimits = limits.find((l) => l.plan_type === 'pro')

  const formatValue = (value: number) => {
    return value === -1 ? 'Ilimitado' : value.toLocaleString('pt-BR')
  }

  const renderPlanCard = (planLimits: PlanLimits | undefined, planName: string, isPremium: boolean) => {
    if (!planLimits) return null

    return (
      <Card className={isPremium ? 'border-purple-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {planName}
            </CardTitle>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Premium</Badge>
            )}
          </div>
          <CardDescription>
            Limites atuais para o plano {planName.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Character Limit */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Caracteres por Operação</p>
                <p className="text-xs text-muted-foreground">Máximo permitido</p>
              </div>
            </div>
            <p className="text-lg font-bold">{formatValue(planLimits.max_characters)}</p>
          </div>

          {/* Corrections Per Day */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">Correções por Dia</p>
                <p className="text-xs text-muted-foreground">Limite diário</p>
              </div>
            </div>
            <p className="text-lg font-bold">{formatValue(planLimits.corrections_per_day)}</p>
          </div>

          {/* Rewrites Per Day */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Repeat2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Reescritas por Dia</p>
                <p className="text-xs text-muted-foreground">Limite diário</p>
              </div>
            </div>
            <p className="text-lg font-bold">{formatValue(planLimits.rewrites_per_day)}</p>
          </div>

          {/* AI Analyses Per Day */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <ScanSearch className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Análises de IA por Dia</p>
                <p className="text-xs text-muted-foreground">Limite diário</p>
              </div>
            </div>
            <p className="text-lg font-bold">{formatValue(planLimits.ai_analyses_per_day)}</p>
          </div>

          {/* Show Ads */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Exibir Anúncios</p>
                <p className="text-xs text-muted-foreground">Monetização</p>
              </div>
            </div>
            {planLimits.show_ads ? (
              <Badge className="bg-green-500">Sim</Badge>
            ) : (
              <Badge variant="secondary">Não</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {renderPlanCard(freeLimits, 'Gratuito', false)}
      {renderPlanCard(proLimits, 'Premium', true)}
    </div>
  )
}
