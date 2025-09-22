"use client"

import { useSubscription } from '@/hooks/use-subscription'
import { useStripeCustomerPortal } from '@/hooks/use-stripe-customer-portal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Loader2, CreditCard } from 'lucide-react'

export function SubscriptionManagement() {
  const subscription = useSubscription()
  const { openCustomerPortal, isLoading } = useStripeCustomerPortal()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case 'canceled':
        return <Badge variant="secondary">Cancelado</Badge>
      case 'past_due':
        return <Badge variant="destructive">Vencido</Badge>
      default:
        return <Badge variant="outline">Inativo</Badge>
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Badge className="bg-blue-100 text-blue-800">Pro</Badge>
      case 'plus':
        return <Badge className="bg-purple-100 text-purple-800">Plus</Badge>
      case 'free':
        return <Badge variant="outline">Gratuito</Badge>
      default:
        return <Badge variant="outline">{plan}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Gerenciar Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Plano atual</p>
            <div className="flex items-center gap-2 mt-1">
              {getPlanBadge(subscription.plan)}
              {getStatusBadge(subscription.status)}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Preço</p>
            <p className="font-semibold">{subscription.planPrice}</p>
          </div>
        </div>

        {subscription.expiresAt && (
          <div>
            <p className="text-sm text-muted-foreground">
              Próxima cobrança
            </p>
            <p className="text-sm">
              {new Date(subscription.expiresAt).toLocaleDateString('pt-BR')}
            </p>
            {subscription.daysUntilExpiry && subscription.daysUntilExpiry <= 7 && (
              <p className="text-sm text-orange-600">
                Expira em {subscription.daysUntilExpiry} dia(s)
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {subscription.isPremium && (
            <Button
              onClick={openCustomerPortal}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Gerenciar no Stripe
            </Button>
          )}

          {!subscription.isPremium && (
            <Button asChild>
              <a href="/precos">Fazer Upgrade</a>
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            Use o portal do Stripe para cancelar, atualizar informações de pagamento
            ou baixar faturas.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}