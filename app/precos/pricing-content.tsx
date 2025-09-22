"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { Check, Sparkles, Loader2 } from "lucide-react"
import { getStripe } from "@/lib/stripe"

export type BillingCycle = "annual" | "monthly"

export interface PlanPricing {
  headline: string
  subheadline: string
}

export interface Plan {
  name: string
  description: string
  pricing: {
    annual: PlanPricing
    monthly: PlanPricing
  }
  features: string[]
  cta: { label: string; href: string }
  featured?: boolean
  priceIds?: {
    monthly: string
    annual: string
  }
  planType?: string
}

interface PricingContentProps {
  plans: Plan[]
}

export default function PricingContent({ plans }: PricingContentProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.priceIds || !plan.planType) {
      // Fallback to old /upgrade route for free plan
      window.location.href = plan.cta.href
      return
    }

    setLoadingPlan(plan.planType)

    try {
      const priceId = plan.priceIds[billingCycle]

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          billingCycle,
          planType: plan.planType,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        console.error('Error creating checkout session:', error)
        alert('Erro ao criar sessão de pagamento. Tente novamente.')
        return
      }

      const stripe = await getStripe()
      if (!stripe) {
        console.error('Stripe not loaded')
        return
      }

      await stripe.redirectToCheckout({ sessionId })
    } catch (error) {
      console.error('Error:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl text-center mb-12 space-y-4">
        <Badge variant="secondary" className="mx-auto flex items-center gap-1 w-fit">
          <Sparkles className="h-3.5 w-3.5" />
          Planos atualizados
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Escolha o plano certo para sua escrita</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Correções, reescritas, análises de IA e humanizações adaptadas ao seu ritmo. Comece grátis e evolua quando precisar de mais poder.
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1 text-sm">
          <Button
            type="button"
            variant={billingCycle === "annual" ? "default" : "ghost"}
            className={`rounded-full px-4 ${billingCycle === "annual" ? "shadow-sm" : "text-muted-foreground"}`}
            onClick={() => setBillingCycle("annual")}
          >
            Cobrança anual
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
              Economize até 17%
            </Badge>
          </Button>
          <Button
            type="button"
            variant={billingCycle === "monthly" ? "default" : "ghost"}
            className={`rounded-full px-4 ${billingCycle === "monthly" ? "shadow-sm" : "text-muted-foreground"}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Cobrança mensal
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const pricing = plan.pricing[billingCycle]
          return (
            <Card
              key={plan.name}
              className={`flex flex-col transition-shadow hover:shadow-lg ${plan.featured ? "border-primary shadow-xl" : ""}`}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  {plan.featured && (
                    <Badge className="bg-primary text-primary-foreground text-xs">Mais escolhido</Badge>
                  )}
                </div>
                <div>
                  <div className="text-3xl font-bold">{pricing.headline}</div>
                  <div className="text-sm text-muted-foreground">{pricing.subheadline}</div>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm text-foreground/90">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.featured ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan)}
                  disabled={loadingPlan === plan.planType}
                >
                  {loadingPlan === plan.planType ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    plan.cta.label
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mx-auto max-w-3xl mt-12 rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        <h3 className="text-lg font-semibold text-foreground mb-3">Perguntas frequentes</h3>
        <p className="mb-2">
          <strong>Posso mudar de plano a qualquer momento?</strong> Sim. Basta acessar sua conta e ajustar a assinatura. Os limites atualizam imediatamente após a confirmação do plano.
        </p>
        <p className="mb-2">
          <strong>O que acontece quando esgotar minhas análises?</strong> Você ainda pode usar correções e reescritas conforme seu plano. As análises de IA reiniciam de acordo com o período indicado (diário ou mensal).
        </p>
        <p>
          <strong>Posso cancelar?</strong> Claro! O plano grátis continua disponível e você pode reativar uma assinatura Pro ou Plus quando quiser.
        </p>
      </div>
    </div>
  )
}
