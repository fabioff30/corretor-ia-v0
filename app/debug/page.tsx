"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trash2, RefreshCw } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"

export default function ResetSubscriptionPage() {
  const [isResetting, setIsResetting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const { user } = useUser()
  const { toast } = useToast()

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
