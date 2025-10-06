"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trash2, RefreshCw } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"

export default function ResetSubscriptionPage() {
  const [isResetting, setIsResetting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [mpConfig, setMpConfig] = useState<any>(null)
  const { user } = useUser()
  const { toast } = useToast()

  // Fetch MP config on mount
  useEffect(() => {
    fetch('/api/mercadopago/config')
      .then(res => res.json())
      .then(data => setMpConfig(data))
      .catch(err => console.error('Error fetching MP config:', err))
  }, [])

  const handleCheck = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      })
      return
    }

    try {
      setIsChecking(true)
      const response = await fetch(`/api/mercadopago/reset-test-subscription?userId=${user.id}`)

      if (!response.ok) {
        throw new Error('Failed to check subscription')
      }

      const data = await response.json()
      setSubscriptionData(data)

      toast({
        title: "Status verificado",
        description: `${data.count} assinatura(s) encontrada(s)`,
      })
    } catch (error) {
      console.error('Error checking subscription:', error)
      toast({
        title: "Erro ao verificar",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleReset = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      })
      return
    }

    if (!confirm('Tem certeza que deseja resetar todas as assinaturas de teste? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setIsResetting(true)
      const response = await fetch(`/api/mercadopago/reset-test-subscription?userId=${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to reset subscription')
      }

      const data = await response.json()

      toast({
        title: "Resetado com sucesso!",
        description: `${data.deleted.subscriptions} assinatura(s) e ${data.deleted.transactions} transação(ões) removidas.`,
      })

      // Clear subscription data
      setSubscriptionData(null)

      // Wait 2 seconds then reload page
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error resetting subscription:', error)
      toast({
        title: "Erro ao resetar",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleTestSubscription = async () => {
    if (!user?.id || !user?.email) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      })
      return
    }

    if (!confirm('⚠️ ATENÇÃO: Isso criará uma assinatura REAL de R$ 1,00 que será cobrada no seu cartão. Continuar?')) {
      return
    }

    try {
      setIsTesting(true)
      const response = await fetch('/api/mercadopago/create-test-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create test subscription')
      }

      const data = await response.json()

      toast({
        title: "Assinatura de teste criada!",
        description: "Redirecionando para o checkout...",
      })

      // Redirect to checkout
      setTimeout(() => {
        window.location.href = data.checkoutUrl
      }, 1500)
    } catch (error) {
      console.error('Error creating test subscription:', error)
      toast({
        title: "Erro ao criar assinatura de teste",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para acessar esta página</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Reset de Assinatura de Teste</CardTitle>
          <CardDescription>
            Use esta página para resetar assinaturas de teste e resolver problemas de duplicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-1">Usuário logado:</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
          </div>

          {/* Mercado Pago Config */}
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Configuração Mercado Pago:</p>
            {mpConfig ? (
              <div className="text-xs space-y-1">
                <p className="flex items-start gap-2">
                  <span className="font-medium min-w-[80px]">Public Key:</span>
                  <span className="font-mono break-all text-blue-600 dark:text-blue-400">
                    {mpConfig.publicKey || 'Não configurado'}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-medium min-w-[80px]">Ambiente:</span>
                  <span className="font-mono">
                    {mpConfig.isTest ? '🧪 TEST' : '🚀 PRODUCTION'}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-medium min-w-[80px]">Token:</span>
                  <span className="font-mono text-[10px]">
                    {mpConfig.hasAccessToken ? '✅ Configurado' : '❌ Não configurado'}
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Carregando configuração...
              </div>
            )}
          </div>

          {/* Check Status */}
          <div>
            <Button
              onClick={handleCheck}
              disabled={isChecking}
              variant="outline"
              className="w-full"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verificar Status
                </>
              )}
            </Button>
          </div>

          {/* Subscription Data */}
          {subscriptionData && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Status Atual:</p>
              <div className="text-xs space-y-1">
                <p>Plano: <span className="font-mono">{subscriptionData.profile?.plan_type || 'N/A'}</span></p>
                <p>Status: <span className="font-mono">{subscriptionData.profile?.subscription_status || 'N/A'}</span></p>
                <p>Assinaturas: <span className="font-mono">{subscriptionData.count}</span></p>
              </div>
              {subscriptionData.subscriptions && subscriptionData.subscriptions.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Assinaturas encontradas:</p>
                  {subscriptionData.subscriptions.map((sub: any, idx: number) => (
                    <div key={idx} className="text-xs bg-background p-2 rounded mb-2">
                      <p>Status: <span className="font-mono">{sub.status}</span></p>
                      <p>ID: <span className="font-mono text-[10px]">{sub.id}</span></p>
                      <p>Criado: <span className="font-mono">{new Date(sub.created_at).toLocaleString('pt-BR')}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Test Subscription Button */}
          <div className="pt-4 border-t">
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg mb-4">
              <p className="text-sm font-semibold mb-2 text-yellow-600 dark:text-yellow-400">
                🧪 Teste de Assinatura Real (R$ 1,00)
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Cria uma assinatura REAL de R$ 1,00/mês em PRODUÇÃO. Você será cobrado! Use para testar o fluxo completo de pagamento.
              </p>
              <Button
                onClick={handleTestSubscription}
                disabled={isTesting}
                variant="outline"
                className="w-full border-yellow-500/50 hover:bg-yellow-500/10"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    💳 Criar Assinatura de R$ 1,00
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleReset}
              disabled={isResetting}
              variant="destructive"
              className="w-full"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Resetar Todas as Assinaturas de Teste
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              ⚠️ Isso irá deletar todas as assinaturas e transações de teste e resetar seu perfil para plano gratuito
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
