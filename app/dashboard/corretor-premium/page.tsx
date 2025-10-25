/**
 * Corretor Premium - Dashboard Page
 * Página exclusiva para usuários Premium com correção ilimitada
 */

'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import PremiumTextCorrectionForm from '@/components/dashboard/PremiumTextCorrectionForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/hooks/use-user'
import { useUsageLimits } from '@/hooks/use-usage-limits'
import { Crown, Zap, Shield, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CorretorPremiumPage() {
  const router = useRouter()
  const { profile, loading: userLoading } = useUser()
  const { stats, loading: statsLoading, refreshUsage } = useUsageLimits()

  const isPremium = profile?.plan_type === 'pro' || profile?.plan_type === 'admin'

  // Redirecionar se não for premium
  useEffect(() => {
    if (!userLoading && !isPremium) {
      router.push('/dashboard/upgrade')
    }
  }, [isPremium, userLoading, router])

  // Não renderizar se não for premium
  if (!userLoading && !isPremium) {
    return null
  }

  const handleTextCorrected = () => {
    // Atualizar estatísticas após correção
    refreshUsage()
  }

  return (
    <DashboardLayout
      title="Corretor Premium ⚡"
      description="Correção ilimitada de textos com IA avançada"
    >
      <div className="space-y-6">
        {/* Premium Features Banner */}
        <Card className="border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              Benefícios Premium Ativos
            </CardTitle>
            <CardDescription>
              Aproveite todos os recursos ilimitados do seu plano Pro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Caracteres Ilimitados</p>
                  <p className="text-xs text-muted-foreground">
                    Sem limite de tamanho para seus textos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Sem Anúncios</p>
                  <p className="text-xs text-muted-foreground">
                    Experiência premium sem interrupções
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">IA Avançada</p>
                  <p className="text-xs text-muted-foreground">
                    Modelos de linguagem mais poderosos
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Uso Premium */}
        {statsLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uso Premium Hoje</CardTitle>
              <CardDescription>
                Suas estatísticas de correções premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats?.corrections_used || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Correções realizadas hoje
                  </p>
                </div>
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4">
                  <Crown className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Correction Form */}
        <Card>
          <CardHeader>
            <CardTitle>Corretor de Texto Premium</CardTitle>
            <CardDescription>
              Cole ou digite seu texto abaixo. Sem limites de caracteres!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PremiumTextCorrectionForm onTextCorrected={handleTextCorrected} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
