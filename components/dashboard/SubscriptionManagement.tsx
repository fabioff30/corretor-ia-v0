'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/use-user'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, CreditCard, AlertCircle, CheckCircle2, ExternalLink, Crown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface Subscription {
  id: string
  status: 'pending' | 'authorized' | 'paused' | 'canceled'
  next_payment_date: string | null
  amount: number | null
  currency: string | null
  mp_subscription_id: string | null
}

export function SubscriptionManagement() {
  const { user, profile } = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCanceling, setIsCanceling] = useState(false)
  const { toast } = useToast()
  const isPro = profile?.plan_type === 'pro'
  const isAdmin = profile?.plan_type === 'admin'

  useEffect(() => {
    if (!user || !isPro) {
      setLoading(false)
      return
    }

    fetchSubscription()
  }, [user, isPro])

  const fetchSubscription = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, status, next_payment_date, amount, currency, mp_subscription_id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'authorized', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      const normalized = data
        ? {
            ...data,
            status: (data.status ?? 'pending') as Subscription['status'],
          }
        : null

      setSubscription(normalized)
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user) return

    setIsCanceling(true)

    try {
      const response = await fetch('/api/mercadopago/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ userId: user.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cancelar assinatura')
      }

      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura foi cancelada. Você ainda terá acesso premium até o fim do período pago.',
      })

      // Recarregar dados
      await fetchSubscription()
    } catch (error) {
      toast({
        title: 'Erro ao cancelar',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao cancelar sua assinatura.',
        variant: 'destructive',
      })
    } finally {
      setIsCanceling(false)
    }
  }

  // Usuários Free
  if (!isPro && !isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plano Gratuito</CardTitle>
          <CardDescription>Você está usando o plano gratuito</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              Faça upgrade para o plano Premium e tenha acesso ilimitado a todas as funcionalidades!
            </AlertDescription>
          </Alert>
          <Link href="/premium">
            <Button className="w-full gap-2">
              <Crown className="h-4 w-4" />
              Assinar Plano Premium
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Admin
  if (isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plano Administrador</CardTitle>
          <CardDescription>Você tem acesso total ao sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge className="gap-1">
            <Crown className="h-3.5 w-3.5" />
            Administrador
          </Badge>
          <p className="mt-4 text-sm text-muted-foreground">
            Como administrador, você tem acesso ilimitado a todas as funcionalidades sem necessidade de assinatura.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Loading
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minha Assinatura</CardTitle>
          <CardDescription>Gerenciar plano Premium</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Usuário Pro sem assinatura ativa (possível caso de migração)
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plano Premium</CardTitle>
          <CardDescription>Você tem acesso premium</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Você tem acesso ao plano Premium. Não foi possível encontrar detalhes da assinatura.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'authorized':
        return <Badge className="bg-green-500">Ativa</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>
      case 'paused':
        return <Badge className="bg-orange-500">Pausada</Badge>
      case 'canceled':
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (!amount) return 'N/A'
    const formattedAmount = (amount / 100).toFixed(2)
    return `${currency?.toUpperCase() || 'BRL'} ${formattedAmount}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return 'N/A'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minha Assinatura Premium</CardTitle>
        <CardDescription>Gerenciar sua assinatura e pagamentos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Status da Assinatura</p>
            <p className="text-xs text-muted-foreground">Estado atual do seu plano</p>
          </div>
          {getStatusBadge(subscription.status)}
        </div>

        {/* Próximo Pagamento */}
        {subscription.next_payment_date && subscription.status === 'authorized' && (
          <div>
            <p className="text-sm font-medium">Próxima Cobrança</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(subscription.next_payment_date)}
            </p>
          </div>
        )}

        {/* Valor */}
        {subscription.amount && (
          <div>
            <p className="text-sm font-medium">Valor Mensal</p>
            <p className="text-sm text-muted-foreground">
              {formatAmount(subscription.amount, subscription.currency)}
            </p>
          </div>
        )}

        {/* Aviso de Cancelamento */}
        {subscription.status === 'canceled' && (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Sua assinatura foi cancelada. Você ainda terá acesso premium até o final do período pago.
            </AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-4 border-t">
          {/* Gerenciar no Mercado Pago */}
          {subscription.mp_subscription_id && (
            <Button variant="outline" className="gap-2" asChild>
              <a
                href={`https://www.mercadopago.com.br/subscriptions/${subscription.mp_subscription_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CreditCard className="h-4 w-4" />
                Gerenciar Pagamento
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}

          {/* Cancelar Assinatura */}
          {subscription.status === 'authorized' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isCanceling}>
                  {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCanceling ? 'Cancelando...' : 'Cancelar Assinatura'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ao cancelar sua assinatura, você perderá o acesso aos recursos premium ao final do período pago.
                    Você ainda poderá usar o plano gratuito com recursos limitados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Não, manter assinatura</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, cancelar assinatura
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
