/**
 * Dashboard Principal - Visão Geral
 */

'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner'
import { PendingPixActivationBanner } from '@/components/dashboard/PendingPixActivationBanner'
import { FreeVsProComparison } from '@/components/dashboard/FreeVsProComparison'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUser } from '@/hooks/use-user'
import { useUsageLimits } from '@/hooks/use-usage-limits'
import { usePendingPixPayment } from '@/hooks/use-pending-pix-payment'
import { usePurchaseTracking } from '@/hooks/use-purchase-tracking'
import { useToast } from '@/hooks/use-toast'
import { FileText, Wand2, Sparkles, TrendingUp, Loader2, Crown, Check, MessageCircle } from 'lucide-react'
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

        {/* Estatísticas Rápidas - Apenas para Premium */}
        {isPremium && (
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
                  description={`Últimos 30 dias · ${stats?.corrections_total || 0} no total`}
                  icon={FileText}
                />

                <StatsCard
                  title="Reescritas"
                  value={stats?.rewrites_last_30_days || 0}
                  description={`Últimos 30 dias · ${stats?.rewrites_total || 0} no total`}
                  icon={Wand2}
                />

                <StatsCard
                  title="Análises de IA"
                  value={stats?.ai_analyses_last_30_days || 0}
                  description={`Últimos 30 dias · ${stats?.ai_analyses_total || 0} no total`}
                  icon={Sparkles}
                />

                <StatsCard
                  title="Limite de Caracteres"
                  value="∞"
                  description="20.000 por correção"
                  icon={TrendingUp}
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
          <CardContent className="space-y-4">
            {/* Botão principal destacado no mobile */}
            <Button
              asChild
              className="w-full h-20 flex-col gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg sm:hidden"
            >
              <Link href="/">
                <FileText className="h-7 w-7" />
                <span className="font-bold text-base">Nova Correção</span>
                <span className="text-xs opacity-90">
                  Corrigir texto agora
                </span>
              </Link>
            </Button>

            {/* Grid para desktop e tablet */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Nova Correção - versão desktop */}
              <Button asChild variant="outline" className="h-24 flex-col gap-2 hidden sm:flex">
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

              {/* Julinho - Assistente de WhatsApp */}
              <Button
                asChild
                className="h-24 flex-col gap-2 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md"
              >
                <Link href="/chat/julinho">
                  <MessageCircle className="h-6 w-6" />
                  <span className="font-medium">Julinho</span>
                  <span className="text-xs opacity-90">
                    Assistente WhatsApp
                  </span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comparação de Planos ou Informações do Plano Premium */}
        {isPremium ? (
          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Seu Plano Premium
              </CardTitle>
              <CardDescription>
                Você tem acesso ilimitado a todos os recursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Correções ilimitadas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Até 20.000 caracteres por texto</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Sem anúncios</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Processamento prioritário</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <FreeVsProComparison />
        )}
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
