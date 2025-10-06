"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/alert-dialog"
import { useSubscription } from "@/hooks/use-subscription"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"

function SubscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, profile } = useUser()
  const {
    subscription,
    isLoading,
    error,
    isActive,
    isPro,
    canCancel,
    nextPaymentDate,
    amount,
    currency,
    cancelSubscription,
    refreshSubscription,
  } = useSubscription()

  const [isCanceling, setIsCanceling] = useState(false)

  // Handle payment success/failure from redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')

    if (paymentStatus === 'success') {
      toast({
        title: "Pagamento processado!",
        description: "Seu pagamento está sendo processado. Em breve você terá acesso ao plano Premium.",
      })
      // Refresh subscription data
      refreshSubscription()
    } else if (paymentStatus === 'failure') {
      toast({
        title: "Pagamento falhou",
        description: "Houve um problema com seu pagamento. Tente novamente.",
        variant: "destructive",
      })
    } else if (paymentStatus === 'pending') {
      toast({
        title: "Pagamento pendente",
        description: "Seu pagamento está pendente. Aguarde a confirmação.",
      })
    }
  }, [searchParams])

  const handleCancelSubscription = async () => {
    try {
      setIsCanceling(true)

      const success = await cancelSubscription()

      if (success) {
        toast({
          title: "Assinatura cancelada",
          description: "Sua assinatura foi cancelada. Você terá acesso premium até o fim do período pago.",
        })
        refreshSubscription()
      } else {
        throw new Error('Falha ao cancelar assinatura')
      }
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar sua assinatura. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsCanceling(false)
    }
  }

  // Redirect to login if not authenticated
  if (!user && !isLoading) {
    router.push('/login?redirect=/dashboard/subscription')
    return null
  }

  // Format currency
  const formatCurrency = (value: number | null, curr: string | null) => {
    if (!value || !curr) return '---'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: curr,
    }).format(value)
  }

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return '---'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  // Get status badge
  const getStatusBadge = () => {
    if (isPro && isActive) {
      return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Ativo</Badge>
    }

    if (subscription?.status === 'pending') {
      return <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Pendente</Badge>
    }

    if (subscription?.status === 'paused') {
      return <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" /> Pausado</Badge>
    }

    if (subscription?.status === 'canceled') {
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Cancelado</Badge>
    }

    return <Badge variant="outline">Gratuito</Badge>
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Minha Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e informações de pagamento
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Erro ao carregar assinatura</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => refreshSubscription()}>Tentar novamente</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {isPro ? (
                        <>
                          <Zap className="h-5 w-5 text-yellow-500" />
                          Plano Premium
                        </>
                      ) : (
                        'Plano Gratuito'
                      )}
                    </CardTitle>
                    <CardDescription>
                      {isPro ? 'Acesso ilimitado a todos os recursos' : 'Recursos básicos com limites diários'}
                    </CardDescription>
                  </div>
                  {getStatusBadge()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPro && subscription ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Próximo pagamento</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(nextPaymentDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Valor mensal</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(amount, currency)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-start space-x-3 mb-3">
                        <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">Recursos Premium Ativos</p>
                        </div>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                          Correções ilimitadas
                        </li>
                        <li className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                          Análises de IA ilimitadas
                        </li>
                        <li className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                          Reescrita ilimitada
                        </li>
                        <li className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                          Sem anúncios
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      Você está usando o plano gratuito
                    </p>
                    <Button onClick={() => router.push('/premium')}>
                      <Zap className="mr-2 h-4 w-4" />
                      Assinar Premium
                    </Button>
                  </div>
                )}
              </CardContent>

              {canCancel && (
                <CardFooter className="border-t pt-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={isCanceling}>
                        {isCanceling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          'Cancelar Assinatura'
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ao cancelar sua assinatura, você perderá acesso aos recursos premium ao final do período atual.
                          Você continuará tendo acesso até {formatDate(nextPaymentDate)}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Manter Assinatura</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive hover:bg-destructive/90">
                          Sim, Cancelar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              )}
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Precisa de ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Se você tiver dúvidas sobre sua assinatura ou encontrar algum problema, entre em contato conosco.
                </p>
                <Button variant="outline" onClick={() => router.push('/contato')}>
                  Entrar em Contato
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}
