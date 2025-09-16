"use client"

import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { useCorrectionHistory } from "@/hooks/use-correction-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  const { history, loading: historyLoading, stats } = useCorrectionHistory()
  const [usageStats, setUsageStats] = useState({
    correctionsThisMonth: stats.totalCorrections || 0,
    averageScore: stats.averageScore || 0
  })

  // Atualizar estatísticas quando dados do histórico carregarem
  useEffect(() => {
    if (!historyLoading && stats) {
      setUsageStats({
        correctionsThisMonth: stats.totalCorrections,
        averageScore: stats.averageScore
      })
    }
  }, [stats.totalCorrections, stats.averageScore, historyLoading])

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
                CorretorIA Pro
              </>
            ) : (
              "Plano Gratuito"
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
                    <span className="font-medium">CorretorIA Pro</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Ativo
                    </Badge>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Gratuito</span>
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
                    Upgrade para CorretorIA Pro
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
                      <div className="font-medium text-amber-600">Upgrade Pro</div>
                      <div className="text-sm text-muted-foreground">
                        Recursos premium por R$ 19,90/mês
                      </div>
                    </div>
                  </div>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Correções - Apenas para usuários premium */}
      {subscription.isPremium && (
        <>
          {/* Estatísticas do Histórico */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Correções Realizadas
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {historyLoading ? "..." : stats.totalCorrections}
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
                  Tipo Mais Usado
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {historyLoading ? "..." : (() => {
                    const maxType = Object.entries(stats.correctionsByType)
                      .reduce((a, b) => a[1] > b[1] ? a : b)[0]
                    const typeNames = {
                      grammar: 'Gramática',
                      style: 'Estilo', 
                      tone: 'Tom',
                      complete: 'Completa'
                    }
                    return typeNames[maxType as keyof typeof typeNames] || 'N/A'
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  tipo de correção
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Correções
              </CardTitle>
              <CardDescription>
                Suas últimas correções realizadas nos últimos 30 dias
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
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">Nenhuma correção encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Você ainda não realizou nenhuma correção nos últimos 30 dias.
                  </p>
                  <Button asChild>
                    <Link href="/">
                      <FileText className="h-4 w-4 mr-2" />
                      Fazer primeira correção
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.slice(0, 10).map((correction) => (
                    <div key={correction.id} className="border rounded-lg p-4 bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            correction.correction_type === 'grammar' ? 'destructive' :
                            correction.correction_type === 'style' ? 'secondary' :
                            correction.correction_type === 'tone' ? 'outline' : 'default'
                          }>
                            {correction.correction_type === 'grammar' && 'Gramática'}
                            {correction.correction_type === 'style' && 'Estilo'}
                            {correction.correction_type === 'tone' && 'Tom'}
                            {correction.correction_type === 'complete' && 'Completa'}
                          </Badge>
                          <Badge variant="outline" className="text-green-600">
                            {correction.score}/10
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(correction.created_at).toLocaleDateString('pt-BR', {
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
                            {correction.original_text}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Texto corrigido:</p>
                          <p className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded border-l-2 border-green-500">
                            {correction.corrected_text}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{correction.character_count} caracteres</span>
                          <span>•</span>
                          <span>Pontuação: {correction.score}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {history.length > 10 && (
                    <div className="text-center pt-4">
                      <Button variant="outline">
                        Ver mais correções
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