"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Zap, Check, X, AlertTriangle, Loader2, Calendar, Headset, Clock, Mail, Plug, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { useSubscription } from "@/hooks/use-subscription"
import { usePixPayment } from "@/hooks/use-pix-payment"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PremiumPixModal } from "@/components/premium-pix-modal"
import { RegisterForPixDialog } from "@/components/premium/register-for-pix-dialog"

type PlanType = 'monthly' | 'annual'

interface PremiumPlanProps {
  couponCode?: string
  showDiscount?: boolean
}

export function PremiumPlan({ couponCode, showDiscount = false }: PremiumPlanProps = {}) {
  const [isLoading, setIsLoading] = useState<PlanType | null>(null)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [pixLoadingPlan, setPixLoadingPlan] = useState<PlanType | null>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [guestEmail, setGuestEmail] = useState('')
  const [pendingPlanType, setPendingPlanType] = useState<PlanType | null>(null)
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<'pix' | 'card' | null>(null)
  const router = useRouter()
  const { user, profile } = useUser()
  const { createSubscription, isActive, isPro } = useSubscription()
  const { createPixPayment, paymentData, reset: resetPixPayment } = usePixPayment()
  const { toast } = useToast()

  // Pricing with discount
  const monthlyPrice = 29.90
  const annualPrice = 299.00
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

    // If not logged in, ask for email first
    if (!user) {
      setPendingPlanType(planType)
      setPendingPaymentMethod('card')
      setIsEmailDialogOpen(true)
      return
    }

    // Logged in user - create subscription directly
    try {
      setIsLoading(planType)

      const amount = planType === 'monthly' ? 29.90 : 299.00
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
      console.error('Error subscribing:', error)

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

    // If not logged in, open register dialog to create account BEFORE generating PIX
    if (!user) {
      setPendingPlanType(planType)
      setIsRegisterDialogOpen(true)
      // Persist intent in localStorage so after registration+reload, we can auto-generate PIX
      localStorage.setItem('pendingPixPlan', planType)
      return
    }

    // Logged in user - create PIX payment directly
    try {
      setPixLoadingPlan(planType)

      // Create PIX payment with coupon if available
      const normalizedUserEmail = (profile?.email ?? user.email ?? '').trim()
      const payment = await createPixPayment(
        planType,
        user.id,
        normalizedUserEmail || undefined,
        undefined,
        couponCode
      )

      if (payment) {
        setIsPixModalOpen(true)
      }
    } catch (error) {
      console.error('Error creating PIX payment:', error)
      toast({
        title: "Erro ao gerar PIX",
        description: "Não foi possível gerar o pagamento PIX. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setPixLoadingPlan(null)
    }
  }

  // Called after successful registration - reload page to initialize auth properly
  // The useEffect below will detect pending plan and auto-generate PIX
  const handlePixAfterRegister = async () => {
    // Wait for registration to finalize
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Reload page - the useEffect will handle PIX generation
    window.location.reload()
  }

  // Auto-generate PIX after registration + reload
  useEffect(() => {
    if (!user || pixLoadingPlan !== null) return

    const pendingPlan = localStorage.getItem('pendingPixPlan') as PlanType | null
    if (pendingPlan) {
      // Clear from storage
      localStorage.removeItem('pendingPixPlan')

      // Auto-trigger PIX generation with the pending plan
      console.log('[Premium] Auto-generating PIX for plan:', pendingPlan)
      handlePixPayment(pendingPlan)
    }
  }, [user, pixLoadingPlan])

  const handleGuestPayment = async () => {
    if (!guestEmail || !pendingPlanType || !pendingPaymentMethod) {
      toast({
        title: "Email necessário",
        description: "Por favor, insira seu email para continuar.",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmedGuestEmail = guestEmail.trim()

    if (!emailRegex.test(trimmedGuestEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsEmailDialogOpen(false)

      if (pendingPaymentMethod === 'pix') {
        // Guest PIX payment
        setPixLoadingPlan(pendingPlanType)

        const payment = await createPixPayment(
          pendingPlanType,
          undefined, // no userId
          undefined, // no userEmail
          trimmedGuestEmail, // guestEmail
          couponCode // coupon code if available
        )

        if (payment) {
          setIsPixModalOpen(true)
          toast({
            title: "PIX gerado!",
            description: "Após o pagamento, faça login com este email para ativar o premium.",
          })
        }
        setPixLoadingPlan(null)
      } else {
        // Guest card payment (Stripe)
        setIsLoading(pendingPlanType)

        const result = await createSubscription(pendingPlanType, guestEmail, couponCode)

        if (result) {
          toast({
            title: "Redirecionando...",
            description: "Após o pagamento, faça login com este email para ativar o premium.",
          })
          // Redirect to Stripe checkout
          window.location.href = result.checkoutUrl
        }
        setIsLoading(null)
      }
    } catch (error) {
      console.error('Error creating guest payment:', error)
      toast({
        title: "Erro ao processar pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      })
      setPixLoadingPlan(null)
      setIsLoading(null)
    } finally {
      setGuestEmail('')
      setPendingPlanType(null)
      setPendingPaymentMethod(null)
    }
  }

  const handlePixSuccess = () => {
    setIsPixModalOpen(false)
    resetPixPayment()
    // The modal already redirects on success
  }

  const handlePixModalClose = () => {
    setIsPixModalOpen(false)
    resetPixPayment()
  }

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Versão Premium
        </span>
        <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Desbloqueie Todo o Potencial</h2>
        <p className="text-foreground/80 max-w-[700px] mx-auto">
          Aprimore sua experiência com recursos exclusivos e sem limitações
        </p>
      </div>

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
                          <Zap className="mr-2 h-5 w-5" />
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
              ECONOMIZE 17%
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
                    <span className="text-4xl font-bold">R${annualPrice.toFixed(2)}</span>
                    <span className="text-white/90 ml-1">/ano</span>
                    <div className="text-sm mt-1 text-white/90">
                      <span className="line-through opacity-70">R$358,80</span>
                      <span className="ml-2 font-semibold">Economize R$59,80</span>
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
                          <Calendar className="mr-2 h-5 w-5" />
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

      {/* Guarantee Notice */}
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

      {/* Email Dialog for Guest Card Payment (Stripe) */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informe seu email para continuar</DialogTitle>
            <DialogDescription>
              Após o pagamento, você poderá criar sua conta com este email para ativar o plano premium.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="guest-email">Email</Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="seu@email.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGuestPayment()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Após o pagamento, crie sua conta ou faça login com este email para ativar o premium.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEmailDialogOpen(false)
                setGuestEmail('')
                setPendingPlanType(null)
                setPendingPaymentMethod(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuestPayment}
              disabled={!guestEmail || pixLoadingPlan !== null || isLoading !== null}
            >
              {pixLoadingPlan !== null || isLoading !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {pendingPaymentMethod === 'pix' ? 'Gerando PIX...' : 'Processando...'}
                </>
              ) : (
                <>
                  {pendingPaymentMethod === 'pix' ? <QrCode className="mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                  Continuar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Dialog for PIX Payment (Forces account creation) */}
      <RegisterForPixDialog
        isOpen={isRegisterDialogOpen}
        onClose={() => setIsRegisterDialogOpen(false)}
        onSuccess={handlePixAfterRegister}
        planType={pendingPlanType || 'monthly'}
        planPrice={pendingPlanType === 'monthly' ? monthlyPriceWithDiscount : annualPriceWithDiscount}
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
