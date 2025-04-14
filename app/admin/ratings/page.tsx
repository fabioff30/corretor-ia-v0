"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Star, ChevronLeft, ChevronRight, Search, AlertTriangle } from "lucide-react"
import { BackgroundGradient } from "@/components/background-gradient"

interface RatingData {
  id: string
  rating: number
  feedback?: string
  correctionId?: string
  textLength?: number
  timestamp: string
  ip?: string
  userAgent?: string
}

interface PaginationInfo {
  limit: number
  offset: number
  count: number
}

export default function AdminRatingsPage() {
  const [ratings, setRatings] = useState<RatingData[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 20,
    offset: 0,
    count: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchRatings = async () => {
    if (!apiKey) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/ratings?limit=${pagination.limit}&offset=${pagination.offset}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false)
          throw new Error("Chave de API inválida")
        }
        throw new Error(`Erro ao buscar avaliações: ${response.status}`)
      }

      const data = await response.json()
      setRatings(data.ratings)
      setPagination(data.pagination)
      setIsAuthenticated(true)
    } catch (err) {
      console.error("Erro ao buscar avaliações:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Tentar carregar a chave de API do localStorage
    const savedApiKey = localStorage.getItem("admin_api_key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchRatings()
    }
  }, [pagination.offset, pagination.limit, isAuthenticated])

  const handleLogin = () => {
    // Salvar a chave de API no localStorage
    localStorage.setItem("admin_api_key", apiKey)
    fetchRatings()
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_api_key")
    setApiKey("")
    setIsAuthenticated(false)
    setRatings([])
  }

  const handlePrevPage = () => {
    if (pagination.offset - pagination.limit >= 0) {
      setPagination({
        ...pagination,
        offset: pagination.offset - pagination.limit,
      })
    }
  }

  const handleNextPage = () => {
    if (pagination.count === pagination.limit) {
      setPagination({
        ...pagination,
        offset: pagination.offset + pagination.limit,
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 gradient-text">Painel de Avaliações</h1>

        {!isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>Autenticação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                    Chave de API
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Digite sua chave de API"
                    />
                    <Button onClick={handleLogin}>Entrar</Button>
                  </div>
                </div>
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar avaliações..." className="pl-9 w-[300px]" disabled={isLoading} />
                </div>
                <div>
                  <select
                    className="bg-background border rounded-md px-3 py-2 text-sm"
                    value={pagination.limit}
                    onChange={(e) =>
                      setPagination({
                        ...pagination,
                        limit: Number.parseInt(e.target.value),
                        offset: 0,
                      })
                    }
                  >
                    <option value="10">10 por página</option>
                    <option value="20">20 por página</option>
                    <option value="50">50 por página</option>
                    <option value="100">100 por página</option>
                  </select>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Carregando avaliações...</p>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive p-6 rounded-lg text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-lg font-medium">{error}</p>
                <Button variant="outline" className="mt-4" onClick={fetchRatings}>
                  Tentar novamente
                </Button>
              </div>
            ) : ratings.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-lg text-muted-foreground">Nenhuma avaliação encontrada</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {ratings.map((rating) => (
                    <Card key={rating.id} className="overflow-hidden">
                      <div className={`h-1 ${getRatingColorClass(rating.rating)}`}></div>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 ${
                                    star <= rating.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium">{rating.rating}/5</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{formatDate(rating.timestamp)}</div>
                        </div>

                        {rating.feedback && (
                          <div className="bg-muted/30 p-4 rounded-md mb-4">
                            <p className="italic">"{rating.feedback}"</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {rating.correctionId && (
                            <div>
                              <span className="text-muted-foreground">ID da Correção:</span>{" "}
                              <code className="bg-muted/50 px-1 py-0.5 rounded text-xs">{rating.correctionId}</code>
                            </div>
                          )}
                          {rating.textLength && (
                            <div>
                              <span className="text-muted-foreground">Tamanho do Texto:</span> {rating.textLength}{" "}
                              caracteres
                            </div>
                          )}
                          {rating.ip && (
                            <div>
                              <span className="text-muted-foreground">IP:</span> {maskIP(rating.ip)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {pagination.offset + 1} a {pagination.offset + pagination.count} de{" "}
                    {pagination.offset + pagination.count}
                    {pagination.count === pagination.limit ? "+" : ""}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={pagination.offset === 0}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={pagination.count < pagination.limit}
                    >
                      Próxima <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

// Função auxiliar para obter a classe de cor com base na avaliação
function getRatingColorClass(rating: number): string {
  switch (rating) {
    case 5:
      return "bg-green-500"
    case 4:
      return "bg-green-400"
    case 3:
      return "bg-yellow-400"
    case 2:
      return "bg-orange-400"
    case 1:
      return "bg-red-500"
    default:
      return "bg-gray-400"
  }
}

// Função para mascarar o IP por privacidade
function maskIP(ip: string): string {
  if (ip.includes(".")) {
    const parts = ip.split(".")
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`
    }
  } else if (ip.includes(":")) {
    return ip.substring(0, 4) + ":xxxx:xxxx:xxxx"
  }
  return "xxx.xxx.xxx.xxx"
}
