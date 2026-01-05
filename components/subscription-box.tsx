// @ts-nocheck
"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Zap, Check, Crown, ArrowRight, QrCode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { useSubscription } from "@/hooks/use-subscription"
import { usePixPayment } from "@/hooks/use-pix-payment"
import { useToast } from "@/hooks/use-toast"
import { PremiumPixModal } from "@/components/premium-pix-modal"
import { RegisterForPixDialog } from "@/components/premium/register-for-pix-dialog"
import Link from "next/link"

type PlanType = 'monthly' | 'annual'

export function SubscriptionBox() {
  const [isLoading, setIsLoading] = useState<PlanType | null>(null)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [pixLoadingPlan, setPixLoadingPlan] = useState<PlanType | null>(null)
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [pendingPlanType, setPendingPlanType] = useState<PlanType | null>(null)
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<'pix' | 'card' | null>(null)
  const [justRegistered, setJustRegistered] = useState(false)
  const pixGeneratedRef = useRef(false)
  const stripeCheckoutRef = useRef(false)
  const router = useRouter()
  const { user, profile } = useUser()
  const { createSubscription, isActive, isPro } = useSubscription()
  const { createPixPayment, paymentData, reset: resetPixPayment } = usePixPayment()
  const { toast } = useToast()

  const monthlyPrice = 29.90
  const annualPrice = 238.80 // 12x de R$19,90
  const annualInstallment = 19.90
  const annualSavings = 120.00 // Economia vs 12x mensais (12 x 29,90 = 358,80)

  const mainFeatures = [
    "Correções, análises e reescritas ilimitadas",
    "Até 20.000 caracteres por texto",
    "Sem anúncios e processamento prioritário",
    "Histórico completo em 'Meus textos'",
  ]

  const handleSubscribe = async (planType: PlanType) => {
    // Check if already subscribed (only if logged in)
    if (user && (isPro || isActive)) {
      toast({
        title: "Você já é Premium!",
        description: "Você já possui uma assinatura ativa.",
      })
      router.push('/dashboard/subscription')
      return
    }

    // If not logged in, open register dialog to create account BEFORE payment
    if (!user) {
      setPendingPlanType(planType)
      setPendingPaymentMethod('card')
      setIsRegisterDialogOpen(true)
      localStorage.setItem('pendingCardPlan', planType)
      return
    }

    // Logged in user - create subscription directly
    try {
      setIsLoading(planType)

      const amount = planType === 'monthly' ? 29.90 : 238.80
      const analyticsPayload = {
        user_id: user.id,
        email: user.email,
        plan: planType,
        value: amount,
        currency: 'BRL',
      }

      // Track event
      sendGTMEvent({
        event: 'subscribe_premium_clicked',
        user_id: user.id,
        email: user.email,
        plan: planType,
        location: 'home_subscription_box',
      })
      sendGTMEvent('add_to_cart', {
        ...analyticsPayload,
        items: [
          {
            item_id: `premium_${planType}`,
            item_name: planType === 'monthly' ? 'CorretorIA Premium Mensal' : 'CorretorIA Premium Anual',
            price: amount,
            quantity: 1,
          },
        ],
      })

      // Create subscription
      const result = await createSubscription(planType)

      if (!result) {
        throw new Error('Failed to create subscription')
      }

      // Track checkout initiated
      sendGTMEvent({
        event: 'begin_checkout',
        ...analyticsPayload,
        items: [
          {
            item_id: `premium_${planType}`,
            item_name: planType === 'monthly' ? 'CorretorIA Premium Mensal' : 'CorretorIA Premium Anual',
            price: amount,
            quantity: 1,
          },
        ],
      })

      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl

    } catch (error) {
      console.error('[Stripe] Error subscribing:', error)

      const errorMessage = error instanceof Error ? error.message : "Tente novamente mais tarde."

      if (errorMessage.includes('already has an active subscription')) {
        toast({
          title: "Assinatura pendente detectada",
          description: "Você tem uma assinatura pendente. Aguarde 30 minutos ou entre em contato com o suporte.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Erro ao processar assinatura",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(null)
    }
  }

  const handlePixPayment = async (planType: PlanType) => {
    // Check if already subscribed (only if logged in)
    if (user && (isPro || isActive)) {
      toast({
        title: "Você já é Premium!",
        description: "Você já possui uma assinatura ativa.",
      })
      router.push('/dashboard/subscription')
      return
    }

    // If not logged in, open register dialog to create account BEFORE generating PIX
    if (!user) {
      setPendingPlanType(planType)
      setPendingPaymentMethod('pix')
      setIsRegisterDialogOpen(true)
      localStorage.setItem('pendingPixPlan', planType)
      return
    }

    // Logged in user - create PIX payment directly
    try {
      setPixLoadingPlan(planType)

      // Track event
      sendGTMEvent({
        event: 'pix_payment_initiated',
        plan: planType,
        location: 'home_subscription_box',
      })

      const normalizedUserEmail = (profile?.email ?? user.email ?? '').trim()
      const payment = await createPixPayment(
        planType,
        user.id,
        normalizedUserEmail || undefined
      )

      if (payment) {
        setIsPixModalOpen(true)
      } else {
        toast({
          title: "Erro ao gerar PIX",
          description: "Não foi possível gerar o pagamento PIX. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('[Premium] Error creating PIX payment:', error)
      toast({
        title: "Erro ao gerar PIX",
        description: "Não foi possível gerar o pagamento PIX. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setPixLoadingPlan(null)
    }
  }

  // Called after successful registration
  const handleAfterRegister = async () => {
    setJustRegistered(true)
    setIsRegisterDialogOpen(false)

    const pendingPixPlan = localStorage.getItem('pendingPixPlan')
    const pendingCardPlan = localStorage.getItem('pendingCardPlan')

    if (pendingPixPlan) {
      toast({
        title: "Conta criada com sucesso!",
        description: "Gerando seu QR Code PIX...",
      })
    } else if (pendingCardPlan) {
      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando para pagamento...",
      })
    }
  }

  // Auto-trigger payment flow after registration when user becomes available
  useEffect(() => {
    if (!justRegistered || !user) return

    const pendingPixPlan = localStorage.getItem('pendingPixPlan') as PlanType | null
    const pendingCardPlan = localStorage.getItem('pendingCardPlan') as PlanType | null

    // Handle PIX payment
    if (pendingPixPlan && !pixGeneratedRef.current) {
      pixGeneratedRef.current = true
      localStorage.removeItem('pendingPixPlan')
      setJustRegistered(false)

      setTimeout(() => {
        handlePixPayment(pendingPixPlan)
      }, 500)
    }
    // Handle Stripe card payment
    else if (pendingCardPlan && !stripeCheckoutRef.current) {
      stripeCheckoutRef.current = true
      localStorage.removeItem('pendingCardPlan')
      setJustRegistered(false)

      setTimeout(() => {
        handleSubscribe(pendingCardPlan)
      }, 500)
    }
  }, [user, justRegistered])

  const handlePixSuccess = () => {
    setIsPixModalOpen(false)
    resetPixPayment()
  }

  const handlePixModalClose = () => {
    setIsPixModalOpen(false)
    resetPixPayment()
  }

  return (
    <section className="py-16 relative overflow-hidden bg-gradient-to-b from-primary/5 via-secondary/5 to-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="max-w-[1366px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-sm font-medium mb-4">
            <Crown className="h-4 w-4" />
            Plano Premium
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">
            Escreva Sem Limites com CorretorIA Premium
          </h2>
          <p className="text-foreground/80 max-w-[700px] mx-auto">
            Desbloqueie todo o potencial da correção de textos com IA. Correções ilimitadas, análise avançada e muito mais.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <Card className="border-primary/30 shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Features Section */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 flex flex-col justify-center">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 p-3 bg-primary/10 rounded-full mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Por que Premium?</h3>
                  <p className="text-foreground/70 text-sm">
                    Aprimore sua escrita profissionalmente com recursos exclusivos
                  </p>
                </div>

                <ul className="space-y-3">
                  {mainFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-foreground/80">
                    <strong className="text-amber-600 dark:text-amber-400">Garantia de 7 dias:</strong> Não satisfeito? Reembolso total.
                  </p>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-8 flex flex-col justify-center bg-background">
                <div className="space-y-4">
                  {/* Monthly Plan */}
                  <div className="p-5 border-2 border-primary/30 rounded-xl hover:border-primary/50 transition-colors bg-primary/5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg">Plano Mensal</h4>
                        <p className="text-xs text-muted-foreground">Flexibilidade mensal</p>
                      </div>
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">R${monthlyPrice.toFixed(2)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                        onClick={() => handleSubscribe('monthly')}
                        disabled={isLoading !== null || pixLoadingPlan !== null}
                      >
                        {isLoading === 'monthly' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Cartão
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => handlePixPayment('monthly')}
                        disabled={isLoading !== null || pixLoadingPlan !== null}
                      >
                        {pixLoadingPlan === 'monthly' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 h-4 w-4" />
                            PIX
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Annual Plan - Highlighted */}
                  <div className="relative p-5 border-2 border-green-500 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 shadow-md">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                      ECONOMIZE 17%
                    </div>
                    <div className="flex items-center justify-between mb-3 mt-2">
                      <div>
                        <h4 className="font-bold text-lg text-green-700 dark:text-green-400">Plano Anual</h4>
                        <p className="text-xs text-muted-foreground">Melhor custo-benefício</p>
                      </div>
                      <Crown className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="mb-2">
                      <span className="text-3xl font-bold">R${annualPrice.toFixed(2)}</span>
                      <span className="text-muted-foreground">/ano</span>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-semibold mb-4">
                      Economize R${annualSavings.toFixed(2)} por ano
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90"
                        onClick={() => handleSubscribe('annual')}
                        disabled={isLoading !== null || pixLoadingPlan !== null}
                      >
                        {isLoading === 'annual' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Crown className="mr-2 h-4 w-4" />
                            Cartão
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => handlePixPayment('annual')}
                        disabled={isLoading !== null || pixLoadingPlan !== null}
                      >
                        {pixLoadingPlan === 'annual' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 h-4 w-4" />
                            PIX
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* CTA to Premium Page */}
                <div className="mt-6 text-center">
                  <Button variant="link" className="text-primary group" asChild>
                    <Link href="/premium">
                      Ver todos os recursos
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Pagamento seguro via Stripe ou PIX. Cancele quando quiser.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Register Dialog for Payment (Forces account creation for both PIX and Card) */}
      <RegisterForPixDialog
        isOpen={isRegisterDialogOpen}
        onClose={() => setIsRegisterDialogOpen(false)}
        onSuccess={handleAfterRegister}
        planType={pendingPlanType || 'monthly'}
        planPrice={pendingPlanType === 'monthly' ? monthlyPrice : annualPrice}
        paymentMethod={pendingPaymentMethod || 'pix'}
      />

      {/* PIX Payment Modal */}
      <PremiumPixModal
        isOpen={isPixModalOpen}
        onClose={handlePixModalClose}
        paymentData={paymentData}
        onSuccess={handlePixSuccess}
      />
    </section>
  )
}
// @ts-nocheck
