"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BlackFridayCountdown } from "./black-friday-countdown"
import { useUser } from "@/hooks/use-user"
import { Loader2, Check, Zap, Clock, Shield, CreditCard, Infinity, Sparkles } from "lucide-react"
import { BLACK_FRIDAY_CONFIG } from "@/utils/constants"
import { RegisterForPixDialog } from "@/components/premium/register-for-pix-dialog"

const FEATURES = [
  { icon: Infinity, text: "Correcoes ilimitadas" },
  { icon: Infinity, text: "Reescritas ilimitadas" },
  { icon: Infinity, text: "Analises de IA ilimitadas" },
  { icon: Sparkles, text: "Ate 20.000 caracteres por texto" },
  { icon: Shield, text: "Sem anuncios" },
  { icon: Clock, text: "Processamento prioritario" },
  { icon: Check, text: "Historico completo de correcoes" },
  { icon: Check, text: "Analise avancada de tom e estilo" },
]

export function BlackFridayContent() {
  const router = useRouter()
  const { user, profile, loading: userLoading } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const isAlreadyPremium = profile?.plan_type === 'pro' || profile?.plan_type === 'admin' || profile?.plan_type === 'lifetime'

  const handlePurchase = async () => {
    // If not logged in, show register dialog
    if (!user) {
      setShowRegister(true)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/create-lifetime-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar checkout')
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error('Erro ao processar compra:', error)
      alert('Erro ao processar compra. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSuccess = () => {
    setShowRegister(false)
    // After registration, trigger purchase
    handlePurchase()
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-red-600 text-white text-lg px-4 py-1 animate-pulse">
          BLACK FRIDAY
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            Licenca Vitalicia
          </span>
        </h1>
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-6">
          Pague uma vez, use <strong>para sempre</strong>. Acesso completo ao CorretorIA Premium sem mensalidades!
        </p>

        {/* Countdown */}
        <div className="mb-8">
          <p className="text-sm text-foreground/60 mb-3 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            Oferta termina em:
          </p>
          <BlackFridayCountdown />
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-2 border-orange-500/50 shadow-2xl shadow-orange-500/20 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 text-white text-center">
          <p className="text-sm font-medium">OFERTA ESPECIAL BLACK FRIDAY</p>
        </div>

        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">CorretorIA Vitalicio</CardTitle>
          <CardDescription>Acesso completo para sempre</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Pricing */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl text-foreground/50 line-through">
                R$ {BLACK_FRIDAY_CONFIG.ORIGINAL_PRICE.toFixed(2).replace('.', ',')}
              </span>
              <Badge variant="destructive" className="text-sm">
                -67%
              </Badge>
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm text-foreground/70">R$</span>
              <span className="text-6xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                99
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                ,90
              </span>
            </div>
            <p className="text-foreground/70">
              ou <strong>10x de R$ {BLACK_FRIDAY_CONFIG.INSTALLMENT_PRICE.toFixed(2).replace('.', ',')}</strong> no cartao
            </p>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Pagamento unico - sem mensalidades
            </Badge>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
            {FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <feature.icon className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          {isAlreadyPremium ? (
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-600">Voce ja tem acesso Premium!</p>
              <p className="text-sm text-foreground/70">Aproveite todos os recursos ilimitados.</p>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg"
              onClick={handlePurchase}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Garantir Licenca Vitalicia
                  <Zap className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          )}

          {/* Guarantee */}
          <div className="flex items-center justify-center gap-2 text-sm text-foreground/60">
            <Shield className="h-4 w-4" />
            <span>Pagamento seguro via Stripe</span>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold text-center">Perguntas Frequentes</h2>

        <div className="space-y-4">
          <FaqItem
            question="O que significa licenca vitalicia?"
            answer="Significa que voce paga uma unica vez e tem acesso ao CorretorIA Premium para sempre, sem mensalidades ou renovacoes. Seu acesso nunca expira!"
          />
          <FaqItem
            question="Posso parcelar o pagamento?"
            answer="Sim! Voce pode parcelar em ate 10x de R$ 9,90 no cartao de credito, sem juros."
          />
          <FaqItem
            question="Quais recursos estao inclusos?"
            answer="Todos os recursos do plano Premium: correcoes, reescritas e analises de IA ilimitadas, ate 20.000 caracteres por texto, sem anuncios, processamento prioritario e historico completo."
          />
          <FaqItem
            question="E se eu ja tiver uma assinatura mensal?"
            answer="Voce pode adquirir a licenca vitalicia e cancelar sua assinatura mensal. A licenca vitalicia tem prioridade e nunca expira."
          />
          <FaqItem
            question="Ate quando vale essa promocao?"
            answer="Essa oferta e exclusiva de Black Friday e termina em 28 de novembro de 2024 as 23:59. Apos isso, o preco volta ao normal."
          />
        </div>
      </div>

      {/* Register Dialog */}
      <RegisterForPixDialog
        open={showRegister}
        onOpenChange={setShowRegister}
        onRegisterSuccess={handleRegisterSuccess}
        planType="monthly"
      />
    </div>
  )
}

interface FaqItemProps {
  question: string
  answer: string
}

function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <div className="p-4 rounded-lg bg-card border">
      <h3 className="font-medium mb-2">{question}</h3>
      <p className="text-sm text-foreground/70">{answer}</p>
    </div>
  )
}
