/**
 * Dashboard Principal - Visão Geral
 */

'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { UsageLimitCard } from '@/components/dashboard/UsageLimitCard'
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/hooks/use-user'
import { useUsageLimits } from '@/hooks/use-usage-limits'
import { FileText, Wand2, Sparkles, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { profile } = useUser()
  const { stats, loading, showAds, maxCharacters } = useUsageLimits()

  const isPremium = profile?.plan_type === 'pro' || profile?.plan_type === 'admin'

  return (
    <DashboardLayout
      title={`Olá, ${profile?.full_name?.split(' ')[0] || 'Usuário'}! 👋`}
      description="Bem-vindo ao seu painel de controle"
    >
      <div className="space-y-6">
        {/* Estatísticas Rápidas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatsCard
                title="Correções Hoje"
                value={stats?.corrections_used || 0}
                description={
                  isPremium
                    ? 'Uso ilimitado'
                    : `${stats?.corrections_remaining || 0} restantes`
                }
                icon={FileText}
                progress={
                  !isPremium
                    ? {
                        current: stats?.corrections_used || 0,
                        max: stats?.corrections_remaining === -1 ? -1 : (stats?.corrections_used || 0) + (stats?.corrections_remaining || 0),
                        showLabel: false,
                      }
                    : undefined
                }
              />

              <StatsCard
                title="Reescritas Hoje"
                value={stats?.rewrites_used || 0}
                description={
                  isPremium
                    ? 'Uso ilimitado'
                    : `${stats?.rewrites_remaining || 0} restantes`
                }
                icon={Wand2}
                progress={
                  !isPremium
                    ? {
                        current: stats?.rewrites_used || 0,
                        max: stats?.rewrites_remaining === -1 ? -1 : (stats?.rewrites_used || 0) + (stats?.rewrites_remaining || 0),
                        showLabel: false,
                      }
                    : undefined
                }
              />

              <StatsCard
                title="Análises de IA Hoje"
                value={stats?.ai_analyses_used || 0}
                description={
                  isPremium
                    ? 'Uso ilimitado'
                    : `${stats?.ai_analyses_remaining || 0} restantes`
                }
                icon={Sparkles}
                progress={
                  !isPremium
                    ? {
                        current: stats?.ai_analyses_used || 0,
                        max: stats?.ai_analyses_remaining === -1 ? -1 : (stats?.ai_analyses_used || 0) + (stats?.ai_analyses_remaining || 0),
                        showLabel: false,
                      }
                    : undefined
                }
              />

              <StatsCard
                title="Limite de Caracteres"
                value={maxCharacters === -1 ? '∞' : maxCharacters}
                description={isPremium ? 'Sem limites' : 'Por correção'}
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* Limites de Uso Detalhados - Apenas para Free */}
        {!isPremium && (
          <div className="grid gap-4 md:grid-cols-3">
            {loading ? (
              <>
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </>
            ) : (
              <>
                <UsageLimitCard
                  title="Correções"
                  icon={FileText}
                  current={stats?.corrections_used || 0}
                  limit={(stats?.corrections_used || 0) + (stats?.corrections_remaining || 0)}
                  unit="correções"
                />

                <UsageLimitCard
                  title="Reescritas"
                  icon={Wand2}
                  current={stats?.rewrites_used || 0}
                  limit={(stats?.rewrites_used || 0) + (stats?.rewrites_remaining || 0)}
                  unit="reescritas"
                />

                <UsageLimitCard
                  title="Análises de IA"
                  icon={Sparkles}
                  current={stats?.ai_analyses_used || 0}
                  limit={(stats?.ai_analyses_used || 0) + (stats?.ai_analyses_remaining || 0)}
                  unit="análises"
                />
              </>
            )}
          </div>
        )}

        {/* Banner de Upgrade - Apenas para Free */}
        {!isPremium && <UpgradeBanner />}

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Comece a usar o CorretorIA agora mesmo
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/">
                <FileText className="h-6 w-6" />
                <span className="font-medium">Nova Correção</span>
                <span className="text-xs text-muted-foreground">
                  Corrigir texto
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/reescrever-texto">
                <Wand2 className="h-6 w-6" />
                <span className="font-medium">Reescrever Texto</span>
                <span className="text-xs text-muted-foreground">
                  Mudar estilo
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/detector-ia">
                <Sparkles className="h-6 w-6" />
                <span className="font-medium">Detector de IA</span>
                <span className="text-xs text-muted-foreground">
                  Analisar texto
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Informações do Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Seu Plano</CardTitle>
            <CardDescription>
              {isPremium
                ? 'Você está no plano Pro com acesso ilimitado'
                : 'Você está no plano gratuito'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Plano Atual:</span>
                <span className="font-bold">
                  {profile?.plan_type === 'admin' ? 'ADMIN' : profile?.plan_type === 'pro' ? 'PRO' : 'GRATUITO'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Limite de Caracteres:</span>
                <span className="font-medium">
                  {maxCharacters === -1 ? 'Ilimitado' : `${maxCharacters} caracteres`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Anúncios:</span>
                <span className="font-medium">
                  {showAds ? 'Com anúncios' : 'Sem anúncios'}
                </span>
              </div>

              {!isPremium && (
                <Button asChild className="w-full mt-4">
                  <Link href="/dashboard/upgrade">
                    Fazer Upgrade para Pro
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
