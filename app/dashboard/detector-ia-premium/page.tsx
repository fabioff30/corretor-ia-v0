/**
 * Detector IA Premium - Dashboard Page
 * Página exclusiva para usuários Premium com detecção de IA ilimitada
 */

'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AIDetectorForm } from '@/components/ai-detector-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/hooks/use-user'
import { useUsageLimits } from '@/hooks/use-usage-limits'
import { Crown, Zap, Shield, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

export default function DetectorIAPremiumPage() {
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

  const handleAnalysisComplete = () => {
    // Atualizar estatísticas após análise
    refreshUsage()
  }

  return (
    <DashboardLayout
      title="Detector de IA Premium ⚡"
      description="Análise ilimitada de conteúdo gerado por IA"
    >
      <div className="space-y-6">
        {/* Premium Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
          <Badge variant="outline" className="border-purple-500 text-purple-700">
            <Zap className="h-3 w-3 mr-1" />
            Análises Ilimitadas
          </Badge>
        </div>

        {/* Premium Features Banner */}
        <Card className="border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              Benefícios Premium Ativos
            </CardTitle>
            <CardDescription>
              Detecte conteúdo de IA sem limites diários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Sem Limite Diário</p>
                  <p className="text-xs text-muted-foreground">
                    Análises ilimitadas por dia
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Análise Avançada</p>
                  <p className="text-xs text-muted-foreground">
                    Detecção mais precisa e detalhada
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
                Suas estatísticas de análises premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats?.ai_analyses_used || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Análises realizadas hoje (sem limite!)
                  </p>
                </div>
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium AI Detector Form */}
        <Card>
          <CardHeader>
            <CardTitle>Detector de Conteúdo IA Premium</CardTitle>
            <CardDescription>
              Analise textos para detectar se foram gerados por inteligência artificial. Análises ilimitadas!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIDetectorForm isPremium={true} onAnalysisComplete={handleAnalysisComplete} />
          </CardContent>
        </Card>

        {/* Informações Premium */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">ℹ️ Sobre o Detector Premium</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Análise Avançada:</strong> Detecta padrões de linguagem gerados por IA com alta precisão.
            </p>
            <p>
              <strong>Brazilianism Detection:</strong> Identifica características do português brasileiro.
            </p>
            <p>
              <strong>Gramática:</strong> Analisa erros e complexidade gramatical do texto.
            </p>
            <p>
              <strong>Estatísticas:</strong> Fornece métricas detalhadas sobre o texto analisado.
            </p>
            <p className="text-purple-600 font-medium mt-4">
              ⚡ Como usuário premium, você tem acesso ilimitado a todas essas análises!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
