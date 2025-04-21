"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackgroundGradient } from "@/components/background-gradient"
import { getContentFetchStats } from "@/utils/content-monitoring"
import { RefreshCw, AlertCircle } from "lucide-react"

export default function ContentMonitoringPage() {
  const [stats, setStats] = useState<{
    totalFetches: number
    successRate: number
    averageResponseTime: number
    cacheHitRate: number
    lastFetchTime: number | null
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const refreshStats = () => {
    setIsLoading(true)
    try {
      const currentStats = getContentFetchStats()
      setStats(currentStats)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error fetching content stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshStats()

    // Refresh stats every minute
    const intervalId = setInterval(refreshStats, 60000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Monitoramento de Conteúdo</h1>
          <Button variant="outline" size="sm" onClick={refreshStats} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </>
            )}
          </Button>
        </div>

        {lastRefresh && (
          <p className="text-sm text-muted-foreground mb-6">Última atualização: {lastRefresh.toLocaleTimeString()}</p>
        )}

        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Requisições</CardTitle>
                <CardDescription>Informações sobre as requisições de conteúdo</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="font-medium">Total de requisições:</dt>
                    <dd>{stats.totalFetches}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Taxa de sucesso:</dt>
                    <dd>{stats.successRate.toFixed(1)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Tempo médio de resposta:</dt>
                    <dd>{stats.averageResponseTime.toFixed(0)}ms</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Taxa de cache hit:</dt>
                    <dd>{stats.cacheHitRate.toFixed(1)}%</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>Estado atual do sistema de conteúdo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div
                      className={`h-3 w-3 rounded-full mr-2 ${stats.successRate > 90 ? "bg-green-500" : stats.successRate > 70 ? "bg-yellow-500" : "bg-red-500"}`}
                    ></div>
                    <span className="font-medium">API WordPress</span>
                    <span className="ml-auto">
                      {stats.successRate > 90 ? "Operacional" : stats.successRate > 70 ? "Degradado" : "Problemas"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={`h-3 w-3 rounded-full mr-2 ${stats.cacheHitRate > 50 ? "bg-green-500" : "bg-yellow-500"}`}
                    ></div>
                    <span className="font-medium">Cache</span>
                    <span className="ml-auto">{stats.cacheHitRate > 50 ? "Eficiente" : "Subótimo"}</span>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={`h-3 w-3 rounded-full mr-2 ${stats.averageResponseTime < 500 ? "bg-green-500" : stats.averageResponseTime < 1000 ? "bg-yellow-500" : "bg-red-500"}`}
                    ></div>
                    <span className="font-medium">Tempo de Resposta</span>
                    <span className="ml-auto">
                      {stats.averageResponseTime < 500
                        ? "Bom"
                        : stats.averageResponseTime < 1000
                          ? "Aceitável"
                          : "Lento"}
                    </span>
                  </div>

                  {stats.lastFetchTime && (
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-2 bg-blue-500"></div>
                      <span className="font-medium">Última Requisição</span>
                      <span className="ml-auto">{new Date(stats.lastFetchTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center text-center py-8">
                <AlertCircle className="h-6 w-6 text-muted-foreground mr-2" />
                <p className="text-muted-foreground">
                  Nenhuma estatística disponível. Aguarde até que requisições de conteúdo sejam feitas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 bg-muted/30 p-6 rounded-lg border">
          <h2 className="text-xl font-bold mb-4">Instruções para Otimização</h2>
          <div className="space-y-4">
            <p>
              Para reduzir o atraso entre a publicação no WordPress e a exibição no blog, as seguintes otimizações foram
              implementadas:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Redução do tempo de revalidação de cache de 1 hora para 5 minutos</li>
              <li>Implementação de um endpoint de revalidação manual para atualização imediata</li>
              <li>Adição de botões de atualização de conteúdo nas páginas do blog</li>
              <li>Monitoramento de estatísticas de requisições para identificar problemas</li>
            </ul>
            <p>
              Para atualizar o conteúdo imediatamente após uma publicação no WordPress, use o botão "Atualizar conteúdo"
              disponível nas páginas do blog.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
