import type { Metadata } from "next"
import { PremiumPlan } from "@/components/premium-plan"
import { BackgroundGradient } from "@/components/background-gradient"
import { Sparkles, Clock, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Oferta Especial - 50% OFF no Primeiro Mês | CorretorIA Premium",
  description:
    "Aproveite 50% de desconto no primeiro mês do CorretorIA Premium. Oferta exclusiva para usuários que atingiram o limite gratuito.",
}

export default function OfertaEspecialPage() {
  return (
    <>
      <BackgroundGradient />
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Banner de Oferta Especial */}
          <div className="text-center mb-8 rounded-3xl border-2 border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white mb-4 animate-pulse">
              <Sparkles className="h-4 w-4" />
              OFERTA ESPECIAL
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-4 gradient-text">
              50% OFF no Primeiro Mês
            </h1>
            <p className="text-2xl font-semibold text-primary mb-2">
              De R$ 29,90 por apenas R$ 14,95
            </p>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Você atingiu seu limite de uso gratuito. Aproveite esta oferta exclusiva e continue escrevendo sem limites!
            </p>

            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-foreground/70">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Oferta válida por tempo limitado</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Ativação imediata</span>
              </div>
            </div>
          </div>

          {/* Componente de Planos com Cupom Aplicado */}
          <PremiumPlan couponCode="ZhX6Oy78" showDiscount={true} />

          {/* Benefícios do Premium */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-primary/10 bg-background/50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Correções Ilimitadas</h3>
              <p className="text-sm text-foreground/70">
                Corrija quantos textos quiser, sem limites diários
              </p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-background/50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Reescritas Ilimitadas</h3>
              <p className="text-sm text-foreground/70">
                Reescreva seus textos sem restrições
              </p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-background/50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Histórico Completo</h3>
              <p className="text-sm text-foreground/70">
                Acesse todos os seus textos em "Meus textos"
              </p>
            </div>
          </div>

          {/* FAQ Específico */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-6">Perguntas sobre a Oferta</h2>
            <div className="max-w-3xl mx-auto space-y-6 text-left">
              <div className="rounded-xl border border-primary/10 bg-background/50 p-6">
                <h3 className="text-lg font-medium mb-2">Como funciona o desconto de 50%?</h3>
                <p className="text-foreground/80">
                  O desconto de 50% é aplicado automaticamente no primeiro mês do plano mensal ou no primeiro mês do plano anual.
                  Nos meses seguintes, você paga o valor normal (R$ 29,90/mês ou R$ 299/ano).
                </p>
              </div>

              <div className="rounded-xl border border-primary/10 bg-background/50 p-6">
                <h3 className="text-lg font-medium mb-2">O cupom funciona com PIX?</h3>
                <p className="text-foreground/80">
                  Sim! O cupom de 50% OFF funciona tanto para pagamento via cartão de crédito (Stripe) quanto para pagamento via PIX.
                </p>
              </div>

              <div className="rounded-xl border border-primary/10 bg-background/50 p-6">
                <h3 className="text-lg font-medium mb-2">Posso cancelar depois do primeiro mês?</h3>
                <p className="text-foreground/80">
                  Sim, você pode cancelar sua assinatura a qualquer momento sem custos adicionais. Se cancelar após o primeiro mês com desconto,
                  você continuará com acesso premium até o final do período pago.
                </p>
              </div>

              <div className="rounded-xl border border-primary/10 bg-background/50 p-6">
                <h3 className="text-lg font-medium mb-2">Quanto tempo tenho para aproveitar esta oferta?</h3>
                <p className="text-foreground/80">
                  Esta é uma oferta especial por tempo limitado para usuários que atingiram o limite gratuito.
                  Aproveite agora e comece a escrever sem limites!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
