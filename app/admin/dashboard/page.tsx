// @ts-nocheck
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Activity,
  ArrowUpRight,
  Crown,
  Mail,
  RefreshCw,
  Repeat,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface PlanLimitSummary {
  max_characters: number
  corrections_per_day: number
  rewrites_per_day: number
  ai_analyses_per_day: number
  show_ads: boolean
  updated_at: string
}

interface DashboardSummary {
  userCounts: {
    total: number
    free: number
    premium: number
    admin: number
    activePremium: number
  }
  operationsToday: {
    corrections: number
    rewrites: number
    analyses: number
    total: number
  }
  operationsLast7Days: Array<{
    date: string
    corrections: number
    rewrites: number
    analyses: number
    total: number
  }>
  planLimits: Record<"free" | "pro", PlanLimitSummary | null>
  recentPremiumUsers: Array<{
    id: string
    full_name: string | null
    email: string
    plan_type: "pro" | "admin"
    subscription_status: string | null
    updated_at: string
    created_at: string
  }>
  generatedAt: string
}

const chartConfig = {
  corrections: {
    label: "Correções",
    color: "hsl(220 90% 56%)",
  },
  rewrites: {
    label: "Reescritas",
    color: "hsl(291 64% 42%)",
  },
  analyses: {
    label: "Análises IA",
    color: "hsl(162 73% 46%)",
  },
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchSummary = async (silent = false) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      setError(null)

      const response = await fetch("/api/admin/dashboard/summary", {
        cache: "no-store",
        credentials: "include",
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error || "Não foi possível carregar o dashboard")
      }

      const summary = (await response.json()) as DashboardSummary
      setData(summary)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao carregar dashboard"
      setError(message)
    } finally {
      if (!silent) {
        setLoading(false)
      }
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchSummary(true)
  }

  const chartData = useMemo(() => {
    if (!data) return []
    return data.operationsLast7Days.map((entry) => {
      const label = format(new Date(`${entry.date}T00:00:00Z`), "dd/MM", { locale: ptBR })
      return {
        label,
        ...entry,
      }
    })
  }, [data])

  const formatLimitValue = (value: number) => {
    if (value === -1) return "Ilimitado"
    return value.toLocaleString("pt-BR")
  }

  const formatDateTime = (iso: string) => {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
  }

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral em tempo real do uso da plataforma e status dos planos
          </p>
          {data?.generatedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado em {formatDateTime(data.generatedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Link href="/admin/usuarios">
            <Button className="gap-2">
              Gerenciar Usuários
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/admin/coupons">
            <Button variant="secondary" className="gap-2">
              Criar Cupom
              <Crown className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/admin/debug/emails">
            <Button variant="outline" className="gap-2">
              Debug Emails
              <Mail className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchSummary()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.userCounts.total.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">
                  {data.userCounts.premium.toLocaleString("pt-BR")} com acesso premium
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Usuários Premium</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">
                  {data.userCounts.premium.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.userCounts.admin.toLocaleString("pt-BR")} administradores inclusos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Premium Ativos</CardTitle>
                <Zap className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {data.userCounts.activePremium.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Assinaturas Pro ativas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Operações Hoje</CardTitle>
                <Activity className="h-4 w-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-sky-600">
                  {data.operationsToday.total.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Correções, reescritas e análises</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Uso da Plataforma (7 dias)</CardTitle>
                <CardDescription>
                  Distribuição diária por tipo de operação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="corrections"
                      stroke={chartConfig.corrections.color}
                      fill={`${chartConfig.corrections.color}33`}
                      strokeWidth={2}
                      name="Correções"
                    />
                    <Area
                      type="monotone"
                      dataKey="rewrites"
                      stroke={chartConfig.rewrites.color}
                      fill={`${chartConfig.rewrites.color}33`}
                      strokeWidth={2}
                      name="Reescritas"
                    />
                    <Area
                      type="monotone"
                      dataKey="analyses"
                      stroke={chartConfig.analyses.color}
                      fill={`${chartConfig.analyses.color}33`}
                      strokeWidth={2}
                      name="Análises IA"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Operações de Hoje</CardTitle>
                <CardDescription>Resumo por tipo de operação</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-4 shadow-sm bg-white dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Correções</span>
                    <Sparkles className="h-4 w-4 text-sky-500" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {data.operationsToday.corrections.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 shadow-sm bg-white dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Reescritas</span>
                    <Repeat className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {data.operationsToday.rewrites.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 shadow-sm bg-white dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Análises IA</span>
                    <Activity className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {data.operationsToday.analyses.toLocaleString("pt-BR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Limites</CardTitle>
                <CardDescription>Valores atuais definidos para cada plano</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(["free", "pro"] as const).map((plan) => {
                  const planData = data.planLimits[plan]
                  return (
                    <div
                      key={plan}
                      className="rounded-lg border border-dashed border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold">
                            {plan === "free" ? "Plano Gratuito" : "Plano Premium"}
                          </h3>
                          {planData ? (
                            <p className="text-xs text-muted-foreground">
                              Atualizado em {formatDateTime(planData.updated_at)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Nenhuma configuração registrada
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{plan === "free" ? "Free" : "Premium"}</Badge>
                      </div>
                      {planData && (
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <dt className="text-muted-foreground">Caracteres</dt>
                            <dd className="font-medium">{formatLimitValue(planData.max_characters)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Correções/Dia</dt>
                            <dd className="font-medium">{formatLimitValue(planData.corrections_per_day)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Reescritas/Dia</dt>
                            <dd className="font-medium">{formatLimitValue(planData.rewrites_per_day)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Análises IA/Dia</dt>
                            <dd className="font-medium">{formatLimitValue(planData.ai_analyses_per_day)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Exibir anúncios</dt>
                            <dd className="font-medium">{planData.show_ads ? "Sim" : "Não"}</dd>
                          </div>
                        </dl>
                      )}
                      {!planData && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Configure os limites em <Link href="/admin/limites" className="underline font-medium">/admin/limites</Link>
                        </p>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Premium Recentes</CardTitle>
                <CardDescription>Últimos usuários com acesso premium</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recentPremiumUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário premium recente.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.recentPremiumUsers.map((user) => (
                      <li key={user.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {user.full_name || user.email.split("@")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant={user.plan_type === "admin" ? "secondary" : "outline"}>
                            {user.plan_type === "admin" ? "Admin" : "Premium"}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Status: {user.subscription_status || "manual"}</span>
                          <span>{formatDateTime(user.updated_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle>Navegação Rápida</CardTitle>
                <CardDescription>Acesse outras áreas administrativas</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link href="/admin/usuarios" className="w-full sm:w-auto">
                  <Button variant="outline" className="gap-2 w-full">
                    <Users className="h-4 w-4" />
                    Usuários
                  </Button>
                </Link>
                <Link href="/admin/limites" className="w-full sm:w-auto">
                  <Button variant="outline" className="gap-2 w-full">
                    <Activity className="h-4 w-4" />
                    Limites dos Planos
                  </Button>
                </Link>
                <Link href="/admin/ratings" className="w-full sm:w-auto">
                  <Button variant="outline" className="gap-2 w-full">
                    <Sparkles className="h-4 w-4" />
                    Avaliações
                  </Button>
                </Link>
                <Link href="/admin/content-monitoring" className="w-full sm:w-auto">
                  <Button variant="outline" className="gap-2 w-full">
                    <Repeat className="h-4 w-4" />
                    Conteúdo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
// @ts-nocheck
