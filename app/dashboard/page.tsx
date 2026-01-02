/**
 * Dashboard Principal - Visão Geral
 */

'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { UsageLimitCard } from '@/components/dashboard/UsageLimitCard'
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner'
import { PendingPixActivationBanner } from '@/components/dashboard/PendingPixActivationBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUser } from '@/hooks/use-user'
import { useUsageLimits } from '@/hooks/use-usage-limits'
import { usePendingPixPayment } from '@/hooks/use-pending-pix-payment'
import { usePurchaseTracking } from '@/hooks/use-purchase-tracking'
import { useToast } from '@/hooks/use-toast'
import { FileText, Wand2, Sparkles, TrendingUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

function DashboardContent() {
  const { profile } = useUser()
  const { stats, loading, showAds, maxCharacters, error } = useUsageLimits()
  const { hasPendingPayment, pendingPayment, loading: pendingLoading, refetch } = usePendingPixPayment()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Track purchase events from Stripe redirects
  const { isTracked } = usePurchaseTracking({
    onPurchaseTracked: (data) => {
      toast({
        title: "Pagamento confirmado!",
        description: `Seu plano ${data.planType === 'monthly' ? 'Mensal' : data.planType === 'annual' ? 'Anual' : 'Premium'} foi ativado com sucesso.`,
      })
      // Clean up URL params after tracking
      router.replace('/dashboard')
    }
  })

  const isPremium = profile?.plan_type === 'pro' || profile?.plan_type === 'admin'

  return (
    <DashboardLayout
      title={`Olá, ${profile?.full_name?.split(' ')[0] || 'Usuário'}! 👋`}
      description="Bem-vindo ao seu painel de controle"
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                title="Correções"
                value={stats?.corrections_last_30_days || 0}
                description={
                  isPremium
                    ? `Últimos 30 dias · ${stats?.corrections_total || 0} no total`
                    : `Últimos 30 dias · ${stats?.corrections_total || 0} no total`
                }
                icon={FileText}
              />

              <StatsCard
                title="Reescritas"
                value={stats?.rewrites_last_30_days || 0}
                description={
                  isPremium
                    ? `Últimos 30 dias · ${stats?.rewrites_total || 0} no total`
                    : `Últimos 30 dias · ${stats?.rewrites_total || 0} no total`
                }
                icon={Wand2}
              />

              <StatsCard
                title="Análises de IA"
                value={stats?.ai_analyses_last_30_days || 0}
                description={
                  isPremium
                    ? `Últimos 30 dias · ${stats?.ai_analyses_total || 0} no total`
                    : `Últimos 30 dias · ${stats?.ai_analyses_total || 0} no total`
                }
                icon={Sparkles}
              />

              <StatsCard
                title="Limite de Caracteres"
                value={maxCharacters === -1 ? '∞' : maxCharacters.toLocaleString()}
                description={isPremium ? '20.000 por correção' : 'Por correção'}
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* Limites de Uso Detalhados - Apenas para Free */}
        {!isPremium && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Banner de Ativação PIX Pendente ou Upgrade */}
        {!isPremium && (
          <>
            {hasPendingPayment && pendingPayment ? (
              <PendingPixActivationBanner
                paymentId={pendingPayment.paymentId}
                amount={pendingPayment.amount}
                planType={pendingPayment.planType}
                paidAt={pendingPayment.paidAt}
                onActivated={() => refetch()}
              />
            ) : (
              <UpgradeBanner />
            )}
          </>
        )}

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Comece a usar o CorretorIA agora mesmo
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  {maxCharacters === -1 ? 'Ilimitado' : `${maxCharacters.toLocaleString()} caracteres`}
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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
