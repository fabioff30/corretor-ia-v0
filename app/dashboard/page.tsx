"use client"

import { useAuth} from "@/contexts/unified-auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { useCorrectionHistory, type UnifiedHistoryItem } from "@/hooks/use-correction-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UsageLimits } from "@/components/usage-limits"
import { SubscriptionManagement } from "@/components/subscription-management"
import { 
  Crown, 
  FileText, 
  TrendingUp, 
  Calendar,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  User,
  Clock,
  CheckCircle2,
  Target,
  Edit3
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const subscription = useSubscription()
  const { history, allHistory, loading: historyLoading, stats } = useCorrectionHistory()
  const [usageStats, setUsageStats] = useState({
    correctionsThisMonth: stats.totalCorrections || 0,
    averageScore: stats.averageScore || 0,
    totalItems: stats.totalItems || 0
  })
  const [featureUsage, setFeatureUsage] = useState<any>(null)
  const [loadingUsage, setLoadingUsage] = useState(true)

  // Atualizar estatísticas quando dados do histórico carregarem
  useEffect(() => {
    if (!historyLoading && stats) {
      setUsageStats({
        correctionsThisMonth: stats.totalCorrections,
        averageScore: stats.averageScore,
        totalItems: stats.totalItems
      })
    }
  }, [stats.totalCorrections, stats.averageScore, stats.totalItems, historyLoading])

  // Buscar dados de uso de recursos
  useEffect(() => {
    async function fetchUsage() {
      if (!user) return

      try {
        const response = await fetch('/api/user/usage', {
          headers: {
            'x-user-id': user.id
          }
        })

        if (response.ok) {
          const data = await response.json()
          setFeatureUsage(data)
        }
      } catch (error) {
        console.error('Error fetching usage data:', error)
      } finally {
        setLoadingUsage(false)
      }
    }

    fetchUsage()
  }, [user])

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Componente será redirecionado
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta, {user.name || user.email}!
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={subscription.isPremium ? "default" : "outline"}>
            {subscription.isPremium ? (
              <>
                <Crown className="h-3 w-3 mr-1" />
                {subscription.planDisplayName}
              </>
            ) : (
              subscription.planDisplayName
            )}
          </Badge>
        </div>
      </div>

      {/* Status da Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Status da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Plano Atual</h3>
              <div className="flex items-center gap-2 mb-4">
                {subscription.isPremium ? (
                  <>
                    <Crown className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">{subscription.planDisplayName}</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Ativo
                    </Badge>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{subscription.planDisplayName}</span>
                  </>
                )}
              </div>
              
              {subscription.isPremium && subscription.expiresAt && (
                <p className="text-sm text-muted-foreground">
                  Renova em: {new Date(subscription.expiresAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Limite por Correção</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Caracteres permitidos</span>
                  <span className="font-medium">{subscription.features.characterLimit.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {subscription.isPremium ? 'Sem limite de correções' : 'Correções ilimitadas'}
                </div>
              </div>
            </div>
          </div>

          {!subscription.isPremium && (
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-amber-700 dark:text-amber-300">
                    Upgrade para Planos Premium
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    10.000 caracteres, sem anúncios e processamento prioritário
                  </p>
                </div>
                <Button asChild>
                  <Link href="/upgrade">
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Correções Este Mês
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.correctionsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              +2 desde a semana passada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pontuação Média
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.averageScore}/10</div>
            <p className="text-xs text-muted-foreground">
              +0.5 desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Limite por Correção
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription.features.characterLimit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              caracteres por correção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente os recursos mais utilizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" asChild className="justify-start h-auto p-4">
              <Link href="/">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Corrigir Texto</div>
                    <div className="text-sm text-muted-foreground">
                      Correção ortográfica e gramatical
                    </div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" asChild className="justify-start h-auto p-4">
              <Link href="/account">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Minha Conta</div>
                    <div className="text-sm text-muted-foreground">
                      Gerenciar perfil e configurações
                    </div>
                  </div>
                </div>
              </Link>
            </Button>

            {!subscription.isPremium && (
              <Button variant="outline" asChild className="justify-start h-auto p-4 border-amber-500/50">
                <Link href="/upgrade">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <div className="text-left">
                      <div className="font-medium text-amber-600">Upgrade Premium</div>
                      <div className="text-sm text-muted-foreground">
                        Recursos premium a partir de R$ 19,90/mês
                      </div>
                    </div>
                  </div>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Assinatura */}
      <SubscriptionManagement />

      {/* Limites de Uso de Recursos */}
      {featureUsage && !loadingUsage && (
        <UsageLimits
          features={featureUsage.usage || {}}
          planName={featureUsage.subscription?.planName || 'Grátis'}
        />
      )}

      {/* Histórico de Correções - Apenas para usuários premium */}
      {subscription.isPremium && (
        <>
          {/* Estatísticas do Histórico */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Itens
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {historyLoading ? "..." : stats.totalItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  nos últimos 30 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pontuação Média
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {historyLoading ? "..." : `${stats.averageScore}/10`}
                </div>
                <p className="text-xs text-muted-foreground">
                  qualidade das correções
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Caracteres
                </CardTitle>
                <Edit3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {historyLoading ? "..." : stats.totalCharacters.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  texto processado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tipos de Conteúdo
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Correções:</span>
                    <span className="font-semibold">{historyLoading ? "..." : stats.itemsByType?.corrections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reescritas:</span>
                    <span className="font-semibold">{historyLoading ? "..." : stats.itemsByType?.rewrites || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Análises:</span>
                    <span className="font-semibold">{historyLoading ? "..." : stats.itemsByType?.analyses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humanizações:</span>
                    <span className="font-semibold">{historyLoading ? "..." : stats.itemsByType?.humanizations || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Conteúdo
              </CardTitle>
              <CardDescription>
                Suas últimas correções, reescritas, análises e humanizações dos últimos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : allHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">Nenhum conteúdo encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Você ainda não realizou nenhuma correção, reescrita, análise ou humanização nos últimos 30 dias.
                  </p>
                  <Button asChild>
                    <Link href="/">
                      <FileText className="h-4 w-4 mr-2" />
                      Começar agora
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {allHistory.slice(0, 10).map((item) => {
                    const getTypeBadge = (type: string) => {
                      switch (type) {
                        case 'correction':
                          return <Badge variant="default" className="bg-blue-500">Correção</Badge>
                        case 'rewrite':
                          return <Badge variant="secondary" className="bg-purple-500">Reescrita</Badge>
                        case 'analysis':
                          return <Badge variant="outline" className="bg-green-500">Análise</Badge>
                        case 'humanization':
                          return <Badge variant="destructive" className="bg-orange-500">Humanização</Badge>
                        default:
                          return <Badge variant="outline">{type}</Badge>
                      }
                    }

                    const getProcessedText = (item: UnifiedHistoryItem) => {
                      switch (item.type) {
                        case 'correction':
                          return (item as any).corrected_text
                        case 'rewrite':
                          return (item as any).rewritten_text
                        case 'analysis':
                          return JSON.stringify((item as any).analysis_result, null, 2)
                        case 'humanization':
                          return (item as any).humanized_text
                        default:
                          return 'N/A'
                      }
                    }

                    const getSubtype = (item: UnifiedHistoryItem) => {
                      switch (item.type) {
                        case 'correction':
                          const correctionType = (item as any).correction_type
                          const typeNames = {
                            grammar: 'Gramática',
                            style: 'Estilo',
                            tone: 'Tom',
                            complete: 'Completa'
                          }
                          return typeNames[correctionType as keyof typeof typeNames] || correctionType
                        case 'rewrite':
                          return (item as any).style || 'formal'
                        case 'analysis':
                          return (item as any).analysis_type || 'complete'
                        case 'humanization':
                          return (item as any).humanization_type || 'standard'
                        default:
                          return ''
                      }
                    }

                    return (
                      <div key={item.id} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getTypeBadge(item.type)}
                            <Badge variant="outline" className="text-xs">
                              {getSubtype(item)}
                            </Badge>
                            <Badge variant="outline" className="text-green-600">
                              {item.score}/10
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Texto original:</p>
                            <p className="text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded border-l-2 border-red-500">
                              {item.original_text.length > 200
                                ? `${item.original_text.substring(0, 200)}...`
                                : item.original_text}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              {item.type === 'analysis' ? 'Resultado:' : 'Texto processado:'}
                            </p>
                            <p className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded border-l-2 border-green-500">
                              {(() => {
                                const processedText = getProcessedText(item)
                                return processedText.length > 200
                                  ? `${processedText.substring(0, 200)}...`
                                  : processedText
                              })()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{item.character_count} caracteres</span>
                            <span>•</span>
                            <span>Pontuação: {item.score}/10</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {allHistory.length > 10 && (
                    <div className="text-center pt-4">
                      <Button variant="outline">
                        Ver mais itens
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}