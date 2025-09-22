"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  Users,
  Crown,
  User,
  Calendar,
  Mail,
  LogOut,
  ChevronDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BackgroundGradient } from "@/components/background-gradient"
import { useToast } from "@/hooks/use-toast"

interface UserSubscription {
  id: string
  status: 'active' | 'canceled' | 'expired' | 'trial'
  plan: 'free' | 'premium' | 'pro' | 'plus'
  current_period_start?: string
  current_period_end?: string
  created_at: string
  updated_at: string
}

interface UserData {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
  subscription?: UserSubscription
}

interface PaginationInfo {
  limit: number
  offset: number
  count: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

interface AdminSession {
  authenticated: boolean
  user?: {
    id: string
    role: string
    authenticated: boolean
    expiresAt: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 20,
    offset: 0,
    count: 0,
    total: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  
  const { toast } = useToast()

  // Verificar sessão admin
  const checkSession = async () => {
    try {
      const response = await fetch('/api/admin/auth')
      const data = await response.json()
      setSession(data)
    } catch (err) {
      console.error('Erro ao verificar sessão:', err)
      setSession({ authenticated: false })
    } finally {
      setIsSessionLoading(false)
    }
  }

  // Fazer login
  const handleLogin = async () => {
    if (!password.trim()) {
      toast({
        title: "Erro",
        description: "Digite a senha",
        variant: "destructive"
      })
      return
    }

    setIsLoggingIn(true)
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login')
      }

      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso",
        variant: "default"
      })

      setPassword('')
      await checkSession() // Recarregar sessão
    } catch (err) {
      console.error('Erro no login:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro no login",
        variant: "destructive"
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Fazer logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'logout'
        })
      })

      setSession({ authenticated: false })
      setUsers([])
      
      toast({
        title: "Sucesso",
        description: "Logout realizado com sucesso",
        variant: "default"
      })
    } catch (err) {
      console.error('Erro no logout:', err)
    }
  }

  const fetchUsers = async () => {
    if (!session?.authenticated) return

    setIsLoading(true)
    setError(null)

    try {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
      const response = await fetch(
        `/api/admin/users?limit=${pagination.limit}&offset=${pagination.offset}${searchParam}`
      )

      if (!response.ok) {
        if (response.status === 401) {
          setSession({ authenticated: false })
          throw new Error("Sessão expirada")
        }
        throw new Error(`Erro ao buscar usuários: ${response.status}`)
      }

      const data = await response.json()
      setUsers(data.users || [])
      setPagination(data.pagination)
    } catch (err) {
      console.error("Erro ao buscar usuários:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserSubscription = async (userId: string, action: 'give_premium' | 'give_pro' | 'give_plus' | 'remove_premium', durationMonths: number = 12) => {
    if (!session?.authenticated) return

    setLoadingUserId(userId)

    try {
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          duration_months: durationMonths
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar plano')
      }

      // Atualizar a lista local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, subscription: data.user.subscription }
            : user
        )
      )

      // Sinalizar invalidação de cache para o usuário afetado
      if (data.cacheInvalidation) {
        localStorage.setItem('subscriptionCacheInvalidation', JSON.stringify({
          userEmail: data.cacheInvalidation.userEmail,
          userId: data.cacheInvalidation.userId,
          timestamp: data.cacheInvalidation.timestamp
        }))

        // Disparar evento personalizado para notificar outros componentes
        window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
          detail: data.cacheInvalidation
        }))
      }

      toast({
        title: "Sucesso",
        description: data.message,
        variant: "default"
      })

    } catch (err) {
      console.error("Erro ao atualizar plano:", err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoadingUserId(null)
    }
  }

  // Verificar sessão ao carregar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkSession()
    }
  }, [])

  // Carregar usuários quando sessão estiver ativa
  useEffect(() => {
    if (session?.authenticated) {
      fetchUsers()
    }
  }, [pagination.offset, pagination.limit, session?.authenticated])


  const handleSearch = () => {
    setPagination(prev => ({ ...prev, offset: 0 }))
    fetchUsers()
  }

  const handlePrevPage = () => {
    if (pagination.hasPrev) {
      setPagination({
        ...pagination,
        offset: pagination.offset - pagination.limit,
      })
    }
  }

  const handleNextPage = () => {
    if (pagination.hasNext) {
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

  const getStatusBadge = (subscription?: UserSubscription) => {
    if (!subscription || subscription.plan === 'free') {
      return <Badge variant="secondary">Gratuito</Badge>
    }

    const isExpired = subscription.current_period_end
      ? new Date(subscription.current_period_end) < new Date()
      : false

    if (isExpired || subscription.status === 'expired') {
      return <Badge variant="destructive">Expirado</Badge>
    }

    if (subscription.status === 'canceled') {
      return <Badge variant="outline">Cancelado</Badge>
    }

    // Diferentes badges para diferentes planos
    if (subscription.plan === 'plus') {
      return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Plus</Badge>
    }

    if (subscription.plan === 'pro') {
      return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">Pro</Badge>
    }

    return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">Premium</Badge>
  }

  const isPremiumActive = (subscription?: UserSubscription) => {
    if (!subscription || subscription.plan === 'free') return false

    const isExpired = subscription.current_period_end
      ? new Date(subscription.current_period_end) < new Date()
      : false

    return subscription.status === 'active' && !isExpired
  }

  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-7xl mx-auto py-12 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold gradient-text">Gerenciamento de Usuários</h1>
        </div>

        {isSessionLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Verificando sessão...</p>
          </div>
        ) : !session?.authenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>Autenticação Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Senha
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      disabled={isLoggingIn}
                    />
                    <Button onClick={handleLogin} disabled={isLoggingIn}>
                      {isLoggingIn ? 'Entrando...' : 'Entrar'}
                    </Button>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por email ou nome..." 
                    className="pl-9 w-[300px]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isLoading}>
                  Buscar
                </Button>
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
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Carregando usuários...</p>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive p-6 rounded-lg text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-lg font-medium">{error}</p>
                <Button variant="outline" className="mt-4" onClick={fetchUsers}>
                  Tentar novamente
                </Button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {users.map((user) => (
                    <Card key={user.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{user.email}</span>
                                </div>
                                {getStatusBadge(user.subscription)}
                              </div>
                            </div>
                            
                            {user.name && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{user.name}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Cadastrado em {formatDate(user.created_at)}</span>
                            </div>

                            {user.subscription?.current_period_end && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Crown className="h-4 w-4" />
                                <span>
                                  {user.subscription.plan === 'plus' ? 'Plus' :
                                   user.subscription.plan === 'pro' ? 'Pro' :
                                   'Premium'} válido até {formatDate(user.subscription.current_period_end)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {isPremiumActive(user.subscription) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateUserSubscription(user.id, 'remove_premium')}
                                disabled={loadingUserId === user.id}
                                className="text-red-600 hover:text-red-700"
                              >
                                {loadingUserId === user.id ? "Removendo..." : "Remover Plano"}
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    disabled={loadingUserId === user.id}
                                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                                  >
                                    {loadingUserId === user.id ? "Ativando..." : "Conceder Plano"}
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {/* Plano Pro */}
                                  <div className="px-2 py-1.5 text-sm font-semibold text-blue-600">
                                    Plano Pro
                                  </div>
                                  <DropdownMenuItem
                                    onClick={() => updateUserSubscription(user.id, 'give_pro', 1)}
                                    disabled={loadingUserId === user.id}
                                  >
                                    Pro - 30 dias
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateUserSubscription(user.id, 'give_pro', 12)}
                                    disabled={loadingUserId === user.id}
                                  >
                                    Pro - 1 ano
                                  </DropdownMenuItem>

                                  {/* Plano Plus */}
                                  <div className="px-2 py-1.5 text-sm font-semibold text-purple-600 mt-2">
                                    Plano Plus
                                  </div>
                                  <DropdownMenuItem
                                    onClick={() => updateUserSubscription(user.id, 'give_plus', 1)}
                                    disabled={loadingUserId === user.id}
                                  >
                                    Plus - 30 dias
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateUserSubscription(user.id, 'give_plus', 12)}
                                    disabled={loadingUserId === user.id}
                                  >
                                    Plus - 1 ano
                                  </DropdownMenuItem>

                                  {/* Plano Premium (legacy) */}
                                  <div className="px-2 py-1.5 text-sm font-semibold text-orange-600 mt-2">
                                    Premium (Legacy)
                                  </div>
                                  <DropdownMenuItem
                                    onClick={() => updateUserSubscription(user.id, 'give_premium', 1)}
                                    disabled={loadingUserId === user.id}
                                  >
                                    Premium - 30 dias
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateUserSubscription(user.id, 'give_premium', 12)}
                                    disabled={loadingUserId === user.id}
                                  >
                                    Premium - 1 ano
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {pagination.offset + 1} a {pagination.offset + pagination.count} de {pagination.total} usuários
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePrevPage} 
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!pagination.hasNext}
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