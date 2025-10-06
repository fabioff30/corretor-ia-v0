"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, Check, X, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { useSubscription } from "@/hooks/use-subscription"
import { useToast } from "@/hooks/use-toast"

export function PremiumPlan() {
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSubscribe = async () => {
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
      router.push('/dashboard')
      return
    }

    try {
      setIsLoading(true)

      // Track event
      sendGTMEvent({
        event: 'subscribe_premium_clicked',
        user_id: user.id,
        email: user.email,
      })

      // Create subscription
      const result = await createSubscription()

      if (!result) {
        throw new Error('Failed to create subscription')
      }

      // Track checkout initiated
      sendGTMEvent({
        event: 'begin_checkout',
        user_id: user.id,
        email: user.email,
        value: 29.90,
        currency: 'BRL',
      })

      // Redirect to Mercado Pago checkout
      window.location.href = result.checkoutUrl

    } catch (error) {
      console.error('Error subscribing:', error)
      toast({
        title: "Erro ao processar assinatura",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Card className="border-primary shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">CorretorIA Premium</CardTitle>
                <div className="p-2 bg-white/20 rounded-full">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <CardDescription className="text-white/90 mt-2">Tudo ilimitado: Correções, Análises e Reescrita</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">R$29,90</span>
                <span className="text-white/90 ml-1">/mês</span>
              </div>
              <div className="text-sm mt-1 text-white/80">ou R$299/ano (economize 2 meses)</div>
            </CardHeader>

            <CardContent className="pt-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground"}>
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

              <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Cancele a qualquer momento. Oferecemos garantia de 7 dias de reembolso se você não ficar satisfeito.
                </p>
              </div>
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
                    onClick={handleSubscribe}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Assinar Agora
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Pagamento seguro via Mercado Pago
                  </p>
                </>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
