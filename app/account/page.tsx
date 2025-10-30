"use client"

import { useUser } from "@/components/providers/user-provider"
import { useSubscription } from "@/hooks/use-subscription"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Crown, 
  User, 
  Mail,
  Calendar,
  Shield,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AccountPage() {
  const { user, loading, updateProfile } = useUser()
  const subscription = useSubscription()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])

  // Atualizar campos quando o usuário carregar
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
    }
  }, [user])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse max-w-2xl mx-auto">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Será redirecionado
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Minha Conta</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações e configurações
          </p>
        </div>
        
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

      <div className="grid gap-6">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize suas informações básicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            
            <Button className="w-full md:w-auto">
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* Status da Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Status da Assinatura
            </CardTitle>
            <CardDescription>
              Detalhes do seu plano atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-medium">Plano Atual</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription.isPremium ? "CorretorIA Pro" : "Gratuito"}
                  </p>
                </div>
                
                <div className="text-right">
                  {subscription.isPremium ? (
                    <>
                      <div className="font-semibold text-green-600">R$ 19,90/mês</div>
                      {subscription.expiresAt && (
                        <div className="text-xs text-muted-foreground">
                          Renova em {formatDate(subscription.expiresAt)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="font-semibold">R$ 0,00</div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Recursos Inclusos</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-500" />
                      {subscription.features.characterLimit.toLocaleString()} caracteres
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className={`h-3 w-3 ${subscription.features.noAds ? 'text-green-500' : 'text-muted-foreground'}`} />
                      {subscription.features.noAds ? 'Sem anúncios' : 'Com anúncios'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className={`h-3 w-3 ${subscription.features.priorityProcessing ? 'text-green-500' : 'text-muted-foreground'}`} />
                      {subscription.features.priorityProcessing ? 'Processamento prioritário' : 'Processamento padrão'}
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Data de Criação</h4>
                  <p className="text-sm text-muted-foreground">
                    Conta criada em {formatDate(user.created_at)}
                  </p>
                  
                  {subscription.daysUntilExpiry && subscription.daysUntilExpiry <= 7 && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Sua assinatura expira em {subscription.daysUntilExpiry} dias.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {!subscription.isPremium ? (
                  <Button asChild>
                    <Link href="/upgrade">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade para Pro
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/billing">Gerenciar Cobrança</Link>
                    </Button>
                    <Button variant="outline">
                      Cancelar Assinatura
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Atividades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Suas últimas ações na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: "Login realizado", date: "Hoje, 14:30", icon: User },
                { action: "Texto corrigido (8.5/10)", date: "Hoje, 14:15", icon: Shield },
                { action: "Perfil atualizado", date: "Ontem, 16:45", icon: User },
                { action: "Texto corrigido (9.2/10)", date: "2 dias atrás", icon: Shield },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <activity.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}