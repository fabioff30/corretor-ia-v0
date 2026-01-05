"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Zap, Check, X, AlertTriangle, Loader2, Calendar, Headset, Clock, Mail, Plug, QrCode, CreditCard, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { useSubscription } from "@/hooks/use-subscription"
import { usePixPayment } from "@/hooks/use-pix-payment"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PremiumPixModal } from "@/components/premium-pix-modal"
import { RegisterForPixDialog } from "@/components/premium/register-for-pix-dialog"
import { InlineRegisterForm } from "@/components/premium/inline-register-form"
import { useIsMobile } from "@/hooks/use-mobile"

type PlanType = 'monthly' | 'annual'

interface PremiumPlanProps {
  couponCode?: string
  showDiscount?: boolean
}

export function PremiumPlan({ couponCode, showDiscount = false }: PremiumPlanProps = {}) {
  const [isLoading, setIsLoading] = useState<PlanType | null>(null)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [pixLoadingPlan, setPixLoadingPlan] = useState<PlanType | null>(null)
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [pendingPlanType, setPendingPlanType] = useState<PlanType | null>(null)
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<'pix' | 'card' | null>(null)
  const [justRegistered, setJustRegistered] = useState(false)
  const [isPlanSelectionOpen, setIsPlanSelectionOpen] = useState(false) // Modal de seleção de plano (mobile)
  const [showInlineRegister, setShowInlineRegister] = useState(false) // Formulário de registro inline (mobile)
  const pixGeneratedRef = useRef(false) // Prevent multiple PIX generations
  const stripeCheckoutRef = useRef(false) // Prevent multiple Stripe checkouts
  const router = useRouter()
  const { user, profile } = useUser()
  const { createSubscription, isActive, isPro } = useSubscription()
  const { createPixPayment, paymentData, reset: resetPixPayment } = usePixPayment()
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // Pricing with discount
  const monthlyPrice = 29.90
  const annualPrice = 238.80 // 12x de R$19,90
  const annualInstallment = 19.90
  const discountPercent = showDiscount && couponCode ? 50 : 0
  const monthlyPriceWithDiscount = monthlyPrice * (1 - discountPercent / 100)
  const annualPriceWithDiscount = annualPrice * (1 - discountPercent / 100)

  const features = [
    { name: "Correções ilimitadas", included: true },
    { name: "Análises de IA ilimitadas", included: true },
    { name: "Reescrita de texto ilimitada", included: true },
    { name: "Até 20.000 caracteres por texto", included: true },
    { name: "Sem anúncios", included: true },
    { name: "Análise de estilo avançada", included: true },
    { name: "Prioridade no processamento", included: true },
    { name: "Histórico de correções inteligente", included: true },
    { name: "Caracteres ilimitados", included: false, comingSoon: true },
    { name: "Extensão para navegador", included: false, comingSoon: true },
  ]

  // Helper para disparar evento begin_checkout padrão GA4
  const fireBeginCheckoutEvent = (planType: PlanType, paymentMethod: 'card' | 'pix') => {
    const amount = planType === 'monthly'
      ? (showDiscount ? monthlyPriceWithDiscount : monthlyPrice)
      : (showDiscount ? annualPriceWithDiscount : annualPrice)

    const itemName = planType === 'monthly' ? 'CorretorIA Premium Mensal' : 'CorretorIA Premium Anual'

    // GA4 standard begin_checkout event
    sendGTMEvent('begin_checkout', {
      currency: 'BRL',
      value: amount,
      coupon: couponCode || undefined,
      payment_type: paymentMethod,
      items: [
        {
          item_id: `premium_${planType}`,
          item_name: itemName,
          price: amount,
          quantity: 1,
          item_category: 'subscription',
          item_variant: planType,
        },
      ],
    })

    console.log('[GA4] begin_checkout fired:', { planType, paymentMethod, amount, couponCode })
  }

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

    // Fire begin_checkout event immediately on button click
    fireBeginCheckoutEvent(planType, 'card')

    // If not logged in, open register dialog to create account BEFORE payment (same as PIX)
    if (!user) {
      setPendingPlanType(planType)
      setPendingPaymentMethod('card')
      setIsRegisterDialogOpen(true)
      // Persist intent in localStorage so after registration, we can auto-create checkout
      localStorage.setItem('pendingCardPlan', planType)
      return
    }

    // Logged in user - create subscription directly
    try {
      setIsLoading(planType)

      console.log('[Stripe] Creating checkout for authenticated user:', planType)

      const amount = planType === 'monthly' ? monthlyPrice : annualPrice
      const analyticsPayload = {
        user_id: user.id,
        email: user.email,
        plan: planType,
        value: amount,
        currency: 'BRL',
      }

      // Track legacy event for backwards compatibility
      sendGTMEvent('subscribe_premium_clicked', {
        user_id: user.id,
        email: user.email,
        plan: planType,
        payment_type: 'card',
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

      // Create subscription with coupon if available
      const result = await createSubscription(planType, undefined, couponCode)

      if (!result) {
        throw new Error('Failed to create subscription')
      }

      console.log('[Stripe] Redirecting to checkout:', result.checkoutUrl)

      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl

    } catch (error) {
      console.error('[Stripe] Error subscribing:', error)

      // Check if it's the "already has subscription" error
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

    // Fire begin_checkout event immediately on button click
    fireBeginCheckoutEvent(planType, 'pix')

    // If not logged in, open register dialog to create account BEFORE generating PIX
    if (!user) {
      setPendingPlanType(planType)
      setIsRegisterDialogOpen(true)
      // Persist intent in localStorage so after registration, we can auto-generate PIX
      localStorage.setItem('pendingPixPlan', planType)
      return
    }

    // Logged in user - create PIX payment directly
    try {
      setPixLoadingPlan(planType)

      console.log('[Premium] Generating PIX payment for', planType, 'plan')

      // Read WhatsApp from localStorage (saved during registration)
      let whatsappPhone: string | undefined
      const pendingData = localStorage.getItem('pendingPixPlan')
      if (pendingData) {
        try {
          const parsed = JSON.parse(pendingData)
          if (parsed.whatsappPhone) {
            whatsappPhone = parsed.whatsappPhone
            console.log('[Premium] WhatsApp found for Julinho activation')
          }
        } catch {
          // pendingData is just the planType string, no WhatsApp
        }
      }

      // Create PIX payment with coupon and WhatsApp if available
      const normalizedUserEmail = (profile?.email ?? user.email ?? '').trim()
      const payment = await createPixPayment(
        planType,
        user.id,
        normalizedUserEmail || undefined,
        undefined,
        couponCode,
        whatsappPhone
      )

      if (payment) {
        console.log('[Premium] PIX payment created successfully, opening modal')
        // Ensure modal opens
        setIsPixModalOpen(true)
      } else {
        console.error('[Premium] PIX payment creation returned null')
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

  // Called after successful registration - handle payment based on pending method
  const handlePixAfterRegister = async () => {
    console.log('[Premium] Registration successful, checking payment method...')

    // Set flag to trigger payment flow when user state updates
    setJustRegistered(true)

    // Close the register dialog
    setIsRegisterDialogOpen(false)

    // Check which payment method is pending
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
    // Only trigger if we just registered and now have a user
    if (!justRegistered || !user) return

    const pendingPixData = localStorage.getItem('pendingPixPlan')
    const pendingCardData = localStorage.getItem('pendingCardPlan')

    // Parse pendingPixPlan - can be JSON { planType, whatsappPhone } or legacy string
    let pendingPixPlan: PlanType | null = null
    if (pendingPixData) {
      try {
        const parsed = JSON.parse(pendingPixData)
        pendingPixPlan = parsed.planType as PlanType
      } catch {
        // Legacy format: just the planType string
        pendingPixPlan = pendingPixData as PlanType
      }
    }

    // Parse pendingCardPlan - can be JSON { planType, whatsappPhone } or legacy string
    let pendingCardPlan: PlanType | null = null
    if (pendingCardData) {
      try {
        const parsed = JSON.parse(pendingCardData)
        pendingCardPlan = parsed.planType as PlanType
      } catch {
        // Legacy format: just the planType string
        pendingCardPlan = pendingCardData as PlanType
      }
    }

    // Handle PIX payment
    if (pendingPixPlan && !pixGeneratedRef.current) {
      console.log('[Premium] User authenticated after registration, generating PIX for plan:', pendingPixPlan)

      // Mark as generated to prevent duplicates
      pixGeneratedRef.current = true

      // Clear flags (but keep localStorage until handlePixPayment reads whatsappPhone)
      setJustRegistered(false)

      // Small delay to ensure auth state is fully updated
      setTimeout(() => {
        handlePixPayment(pendingPixPlan!)
        // Clear localStorage after payment creation (handlePixPayment reads whatsappPhone)
        localStorage.removeItem('pendingPixPlan')
      }, 500)
    }
    // Handle Stripe card payment
    else if (pendingCardPlan && !stripeCheckoutRef.current) {
      console.log('[Premium] User authenticated after registration, creating Stripe checkout for plan:', pendingCardPlan)

      // Mark as processed to prevent duplicates
      stripeCheckoutRef.current = true

      // Clear flags and storage
      localStorage.removeItem('pendingCardPlan')
      setJustRegistered(false)

      // Small delay to ensure auth state is fully updated
      setTimeout(() => {
        handleSubscribe(pendingCardPlan!)
      }, 500)
    }
  }, [user, justRegistered])

  // Removed guest payment flow - users must create account first (both PIX and Stripe)

  const handlePixSuccess = () => {
    setIsPixModalOpen(false)
    resetPixPayment()
    // The modal already redirects on success
  }

  const handlePixModalClose = () => {
    setIsPixModalOpen(false)
    resetPixPayment()
  }

  // Helper para fechar modal de seleção e processar pagamento
  // No mobile, se não logado, mostra formulário inline em vez de dialog
  const handlePlanSelection = (planType: PlanType, paymentMethod: 'card' | 'pix') => {
    setIsPlanSelectionOpen(false)

    // Se não logado no mobile, mostrar formulário inline
    // O evento begin_checkout será disparado quando o usuário se registrar e prosseguir
    if (!user && isMobile) {
      // Fire begin_checkout event for mobile non-logged users (won't go through handleSubscribe/handlePixPayment)
      fireBeginCheckoutEvent(planType, paymentMethod)
      setPendingPlanType(planType)
      setPendingPaymentMethod(paymentMethod)
      setShowInlineRegister(true)
      return
    }

    // Usuário logado - processar normalmente
    // handleSubscribe e handlePixPayment já disparam o evento begin_checkout
    setTimeout(() => {
      if (paymentMethod === 'card') {
        handleSubscribe(planType)
      } else {
        handlePixPayment(planType)
      }
    }, 200)
  }

  // Callback quando registro inline é bem sucedido
  const handleInlineRegisterSuccess = () => {
    setShowInlineRegister(false)
    setJustRegistered(true)

    // Salvar no localStorage para o useEffect pegar
    if (pendingPaymentMethod === 'pix') {
      localStorage.setItem('pendingPixPlan', pendingPlanType || 'monthly')
    } else {
      localStorage.setItem('pendingCardPlan', pendingPlanType || 'monthly')
    }

    toast({
      title: "Conta criada com sucesso!",
      description: pendingPaymentMethod === 'pix' ? "Gerando seu QR Code PIX..." : "Redirecionando para pagamento...",
    })
  }

  // Callback quando usuário cancela registro inline
  const handleInlineRegisterCancel = () => {
    setShowInlineRegister(false)
    setPendingPlanType(null)
    setPendingPaymentMethod(null)
  }

  return (
    <div className="py-8">
      {/* Mobile: Card único com 12x R$19,90 (esconde quando formulário inline visível) */}
      {isMobile && !showInlineRegister && (
        <div className="max-w-md mx-auto pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="border-primary shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-full z-10">
                MAIS POPULAR
              </div>
              <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white pt-8">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <div className="p-2 bg-white/20 rounded-full">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <CardDescription className="text-white/90 mt-2">
                  Acesso completo a todos os recursos
                </CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg text-white/80">12x de</span>
                    <span className="text-4xl font-bold">R${annualInstallment.toFixed(2)}</span>
                  </div>
                  <div className="text-sm mt-1 text-white/90">
                    ou R${annualPrice.toFixed(2)} à vista
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {features.slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                {isPro || isActive ? (
                  <div className="w-full p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg text-center">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-green-600 mb-2">
                      <Check className="h-5 w-5" />
                      Você é Premium!
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aproveite até 20.000 caracteres por texto.
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg py-6"
                      onClick={() => setIsPlanSelectionOpen(true)}
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Assinar Agora
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Garantia de 7 dias • Cancele quando quiser
                    </p>
                  </>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Desktop: 2 cards (mensal e anual) */}
      {!isMobile && (
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="border-primary shadow-md h-full flex flex-col">
              <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Plano Mensal</CardTitle>
                  <div className="p-2 bg-white/20 rounded-full">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
                <CardDescription className="text-white/90 mt-2">
                  Flexibilidade mensal
                </CardDescription>
                <div className="mt-4">
                  {showDiscount && couponCode ? (
                    <>
                      <div className="text-sm text-white/70 line-through">R${monthlyPrice.toFixed(2)}</div>
                      <div>
                        <span className="text-4xl font-bold">R${monthlyPriceWithDiscount.toFixed(2)}</span>
                        <span className="text-white/90 ml-1">/primeiro mês</span>
                      </div>
                      <div className="text-xs text-white/80 mt-1">Depois R${monthlyPrice.toFixed(2)}/mês</div>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">R${monthlyPrice.toFixed(2)}</span>
                      <span className="text-white/90 ml-1">/mês</span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6 flex-grow">
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground text-sm"}>
                        {feature.name}
                        {feature.comingSoon && (
                          <span className="ml-2 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded">
                            Em breve
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                {isPro || isActive ? (
                  <div className="w-full p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg text-center">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-green-600 mb-2">
                      <Check className="h-5 w-5" />
                      Você é Premium!
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aproveite até 20.000 caracteres por texto.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-full space-y-2">
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                        onClick={() => handleSubscribe('monthly')}
                        disabled={isLoading !== null || pixLoadingPlan !== null}
                      >
                        {isLoading === 'monthly' ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Pagar com Cartão
                          </>
                        )}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => handlePixPayment('monthly')}
                        disabled={isLoading !== null || pixLoadingPlan !== null}
                      >
                        {pixLoadingPlan === 'monthly' ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Gerando PIX...
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 h-5 w-5" />
                            Pagar com PIX
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Cancele a qualquer momento
                    </p>
                  </>
                )}
              </CardFooter>
            </Card>
          </motion.div>

          {/* Annual Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="border-green-500 shadow-lg h-full flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                MELHOR OFERTA
              </div>
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Plano Anual</CardTitle>
                  <div className="p-2 bg-white/20 rounded-full">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
                <CardDescription className="text-white/90 mt-2">
                  Melhor custo-benefício
                </CardDescription>
                <div className="mt-4">
                  {showDiscount && couponCode ? (
                    <>
                      <div className="text-sm text-white/70 line-through">R${annualPrice.toFixed(2)}</div>
                      <div>
                        <span className="text-4xl font-bold">R${annualPriceWithDiscount.toFixed(2)}</span>
                        <span className="text-white/90 ml-1">/primeiro ano</span>
                      </div>
                      <div className="text-xs text-white/80 mt-1">Depois R${annualPrice.toFixed(2)}/ano</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg text-white/80">12x de</span>
                        <span className="text-4xl font-bold">R${annualInstallment.toFixed(2)}</span>
                      </div>
                      <div className="text-sm mt-1 text-white/90">
                        ou R${annualPrice.toFixed(2)} à vista
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6 flex-grow">
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground text-sm"}>
                        {feature.name}
                        {feature.comingSoon && (
                          <span className="ml-2 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded">
                            Em breve
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                {isPro || isActive ? (
                  <div className="w-full p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg text-center">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-green-600 mb-2">
                      <Check className="h-5 w-5" />
                      Você é Premium!
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aproveite até 20.000 caracteres por texto.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-full space-y-2">
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90"
                        onClick={() => handleSubscribe('annual')}
                        disabled={isLoading !== null || pixLoadingPlan !== null}
                      >
                        {isLoading === 'annual' ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Pagar com Cartão
                          </>
                        )}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => handlePixPayment('annual')}
                        disabled={isLoading !== null || pixLoadingPlan !== null}
                      >
                        {pixLoadingPlan === 'annual' ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Gerando PIX...
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 h-5 w-5" />
                            Pagar com PIX
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Pague 1x no ano e economize
                    </p>
                  </>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Guarantee Notice (esconde quando formulário inline visível no mobile) */}
      {!(isMobile && showInlineRegister) && (
      <div className="max-w-5xl mx-auto mt-8">
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Garantia de 7 dias</p>
            <p>
              Cancele a qualquer momento. Oferecemos garantia de 7 dias de reembolso se você não ficar satisfeito.
              Pagamento seguro via Stripe.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Tabs de Benefícios e Suporte (esconde quando formulário inline visível no mobile) */}
      {!(isMobile && showInlineRegister) && (
      <div className="max-w-5xl mx-auto mt-12">
        <Tabs defaultValue="benefits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:max-w-md mx-auto bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="benefits">Benefícios</TabsTrigger>
            <TabsTrigger value="support">Suporte</TabsTrigger>
          </TabsList>
          <TabsContent value="benefits" className="mt-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle>Por que escolher o Premium?</CardTitle>
                <CardDescription>
                  Recursos avançados, velocidade máxima e foco total na sua escrita.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    Correções, reescritas e análises ilimitadas sem filas.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    Histórico inteligente dos seus textos e exportação rápida.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    Processamento prioritário mesmo em horários de pico.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    Novos recursos liberados primeiro para assinantes.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="support" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Suporte Premium dedicado</CardTitle>
                <CardDescription>
                  Atendimento humano em até 24h para assinantes ativos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 text-sm leading-relaxed">
                <div className="flex items-start gap-3">
                  <Headset className="h-5 w-5 text-primary mt-0.5" />
                  <p>
                    Precisa de ajuda? Escreva para{" "}
                    <a
                      href="mailto:contato@corretordetextoonline.com.br"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      contato@corretordetextoonline.com.br
                    </a>{" "}
                    e nossa equipe responde em até <strong>24 horas úteis</strong>.
                  </p>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 text-primary" />
                    Atualizações sobre correções e roadmap prioritário direto com o time.
                  </li>
                  <li className="flex items-start gap-2">
                    <Mail className="mt-0.5 h-4 w-4 text-primary" />
                    Orientação personalizada sobre melhores práticas e onboarding premium.
                  </li>
                  <li className="flex items-start gap-2">
                    <Plug className="mt-0.5 h-4 w-4 text-primary" />
                    Sugestões de integrações e uso avançado avaliados com prioridade.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      )}

      {/* Mobile Plan Selection Modal */}
      <Dialog open={isPlanSelectionOpen} onOpenChange={setIsPlanSelectionOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Escolha seu plano</DialogTitle>
            <DialogDescription className="text-center">
              Selecione a forma de pagamento que preferir
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Plano Anual */}
            <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50/50 dark:bg-green-950/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded">
                    MELHOR OFERTA
                  </span>
                  <h3 className="font-bold mt-1">Plano Anual</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">12x de</div>
                  <div className="text-2xl font-bold text-green-600">R${annualInstallment.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">ou R${annualPrice.toFixed(2)} à vista</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90"
                  onClick={() => handlePlanSelection('annual', 'card')}
                  disabled={isLoading !== null || pixLoadingPlan !== null}
                >
                  {isLoading === 'annual' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-1" />
                      Cartão
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  onClick={() => handlePlanSelection('annual', 'pix')}
                  disabled={isLoading !== null || pixLoadingPlan !== null}
                >
                  {pixLoadingPlan === 'annual' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-1" />
                      PIX
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Plano Mensal */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Plano Mensal</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold">R${monthlyPrice.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">/mês</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={() => handlePlanSelection('monthly', 'card')}
                  disabled={isLoading !== null || pixLoadingPlan !== null}
                >
                  {isLoading === 'monthly' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-1" />
                      Cartão
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => handlePlanSelection('monthly', 'pix')}
                  disabled={isLoading !== null || pixLoadingPlan !== null}
                >
                  {pixLoadingPlan === 'monthly' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-1" />
                      PIX
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Garantia de 7 dias • Cancele quando quiser • Pagamento seguro
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inline Register Form (Mobile only - avoids scroll lock from multiple dialogs) */}
      {showInlineRegister && isMobile && (
        <InlineRegisterForm
          planType={pendingPlanType || 'monthly'}
          planPrice={pendingPlanType === 'monthly' ? monthlyPriceWithDiscount : annualPriceWithDiscount}
          paymentMethod={pendingPaymentMethod || 'pix'}
          onSuccess={handleInlineRegisterSuccess}
          onCancel={handleInlineRegisterCancel}
        />
      )}

      {/* Register Dialog for Payment (Desktop only - Forces account creation for both PIX and Card) */}
      <RegisterForPixDialog
        isOpen={isRegisterDialogOpen && !isMobile}
        onClose={() => setIsRegisterDialogOpen(false)}
        onSuccess={handlePixAfterRegister}
        planType={pendingPlanType || 'monthly'}
        planPrice={pendingPlanType === 'monthly' ? monthlyPriceWithDiscount : annualPriceWithDiscount}
        paymentMethod={pendingPaymentMethod || 'pix'}
      />

      {/* PIX Payment Modal */}
      <PremiumPixModal
        isOpen={isPixModalOpen}
        onClose={handlePixModalClose}
        paymentData={paymentData}
        onSuccess={handlePixSuccess}
      />
    </div>
  )
}
