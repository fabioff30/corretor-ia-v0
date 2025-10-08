"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, Check, X, AlertTriangle, Loader2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { useSubscription } from "@/hooks/use-subscription"
import { useToast } from "@/hooks/use-toast"

type PlanType = 'monthly' | 'annual'

export function PremiumPlan() {
  const [isLoading, setIsLoading] = useState<PlanType | null>(null)
  const router = useRouter()
  const { user, profile } = useUser()
  const { createSubscription, isActive, isPro } = useSubscription()
  const { toast } = useToast()

  const features = [
    { name: "Correções ilimitadas", included: true },
    { name: "Análises de IA ilimitadas", included: true },
    { name: "Reescrita de texto ilimitada", included: true },
    { name: "Sem limite de caracteres", included: true },
    { name: "Sem anúncios", included: true },
    { name: "Análise de estilo avançada", included: true },
    { name: "Prioridade no processamento", included: true },
    { name: "Histórico de correções", included: false, comingSoon: true },
    { name: "Extensão para navegador", included: false, comingSoon: true },
  ]

  const handleSubscribe = async (planType: PlanType) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para assinar o plano premium.",
        variant: "destructive",
      })
      router.push('/login?redirect=/premium')
      return
    }

    // Check if already subscribed
    if (isPro || isActive) {
      toast({
        title: "Você já é Premium!",
        description: "Você já possui uma assinatura ativa.",
      })
      router.push('/dashboard/subscription')
      return
    }

    try {
      setIsLoading(planType)

      const amount = planType === 'monthly' ? 29.90 : 299.00

      // Track event
      sendGTMEvent({
        event: 'subscribe_premium_clicked',
        user_id: user.id,
        email: user.email,
        plan: planType,
      })

      // Create subscription
      const result = await createSubscription(planType)

      if (!result) {
        throw new Error('Failed to create subscription')
      }

      // Track checkout initiated
      sendGTMEvent({
        event: 'begin_checkout',
        user_id: user.id,
        email: user.email,
        value: amount,
        currency: 'BRL',
        plan: planType,
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
                <span className="text-4xl font-bold">R$29,90</span>
                <span className="text-white/90 ml-1">/mês</span>
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
                    Aproveite todos os recursos ilimitados.
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={() => handleSubscribe('monthly')}
                    disabled={isLoading !== null}
                  >
                    {isLoading === 'monthly' ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Assinar Mensal
                      </>
                    )}
                  </Button>
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
                <span className="text-4xl font-bold">R$299</span>
                <span className="text-white/90 ml-1">/ano</span>
              </div>
              <div className="text-sm mt-1 text-white/90">
                <span className="line-through opacity-70">R$358,80</span>
                <span className="ml-2 font-semibold">Economize R$59,80</span>
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
                    Aproveite todos os recursos ilimitados.
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90"
                    onClick={() => handleSubscribe('annual')}
                    disabled={isLoading !== null}
                  >
                    {isLoading === 'annual' ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-5 w-5" />
                        Assinar Anual
                      </>
                    )}
                  </Button>
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
    </div>
  )
}
