import type { Metadata } from "next"
import { BackgroundGradient } from "@/components/background-gradient"
import { SocialProofStats } from "@/components/social-proof-stats"
import { TestimonialsReal } from "@/components/testimonials-real"
import { BundlePricingCard } from "@/components/bundle/bundle-pricing-card"
import { CountdownTimer } from "@/components/bundle/countdown-timer"
import {
  Sparkles,
  PenTool,
  MessageCircle,
  Zap,
  Shield,
  Clock,
  Gift,
  Check,
  Star,
  ArrowRight,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Oferta de Fim de Ano | CorretorIA + Julinho por R$19,90/mês",
  description:
    "Aproveite 50% de desconto no combo CorretorIA Premium + Julinho Premium. Dois produtos pelo preço de um. Oferta válida até 06/01/2025.",
  openGraph: {
    title: "Oferta de Fim de Ano | CorretorIA + Julinho",
    description:
      "50% OFF no combo CorretorIA + Julinho. Dois produtos pelo preço de um!",
    images: ["/og-bundle.png"],
  },
}

// End date: January 1, 2026 at 23:59:59 BRT (UTC-3)
const OFFER_END_DATE = new Date("2026-01-02T02:59:59Z")

export default function OfertaFimDeAnoPage() {
  return (
    <>
      <BackgroundGradient />

      {/* Decorative floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Golden particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse opacity-60" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-amber-300 rounded-full animate-bounce opacity-40" />
        <div className="absolute top-60 left-1/4 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping opacity-50" />
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-amber-400 rounded-full animate-pulse opacity-30" />
      </div>

      <main className="relative container mx-auto py-8 md:py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-8">
            {/* New Year Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-400/30 px-5 py-2.5 text-sm font-semibold text-amber-400 animate-pulse">
              <Sparkles className="h-4 w-4" />
              OFERTA ESPECIAL DE FIM DE ANO
              <Sparkles className="h-4 w-4" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight">
              <span className="block text-foreground">Dois Produtos.</span>
              <span className="block bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                Um Preço Incrível.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Combine o poder do{" "}
              <span className="text-primary font-semibold">CorretorIA Premium</span>{" "}
              com o{" "}
              <span className="text-green-500 font-semibold">Julinho Premium</span>{" "}
              e economize 50% no pacote completo.
            </p>

            {/* Countdown Timer */}
            <div className="pt-4">
              <CountdownTimer endDate={OFFER_END_DATE} />
            </div>
          </section>

          {/* Pricing Card - OFERTA EXCLUSIVA */}
          <section id="checkout">
            <BundlePricingCard />
          </section>

          {/* What's Included Section */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                O que você recebe
              </h2>
              <p className="text-muted-foreground">
                Dois produtos completos pelo preço de um
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* CorretorIA Card */}
              <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <PenTool className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">CorretorIA Premium</h3>
                      <p className="text-sm text-muted-foreground">
                        Correção de texto com IA
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {[
                      "Correções ilimitadas por dia",
                      "Até 20.000 caracteres por texto",
                      "Análise de estilo e tom",
                      "Reescrita inteligente",
                      "Detector de IA avançado",
                      "Sem anúncios",
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-lg text-muted-foreground line-through">R$ 29,90</span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                </div>
              </div>

              {/* Julinho Card */}
              <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <MessageCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Julinho Premium</h3>
                      <p className="text-sm text-muted-foreground">
                        Assistente no WhatsApp
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {[
                      "Mensagens ilimitadas",
                      "Correção via WhatsApp",
                      "Respostas instantâneas",
                      "Disponível 24/7",
                      "Suporte prioritário",
                      "Atualizações exclusivas",
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-lg text-muted-foreground line-through">R$ 9,90</span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Ativação Imediata",
                description:
                  "Acesso liberado instantaneamente após a confirmação do PIX.",
              },
              {
                icon: Shield,
                title: "Pagamento Seguro",
                description:
                  "PIX processado pelo Mercado Pago com total segurança.",
              },
              {
                icon: Clock,
                title: "Preço Travado",
                description:
                  "Mantenha o valor promocional enquanto sua assinatura estiver ativa.",
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-center"
              >
                <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </section>

          {/* Social Proof */}
          <section className="hidden md:block">
            <SocialProofStats />
          </section>

          {/* Testimonials */}
          <section>
            <TestimonialsReal />
          </section>

          {/* FAQ Section */}
          <section className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center">
              Perguntas Frequentes
            </h2>

            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  question: "O que está incluso no pacote?",
                  answer:
                    "O pacote inclui acesso completo ao CorretorIA Premium (correção de textos no site) e ao Julinho Premium (assistente de correção via WhatsApp). Você terá uso ilimitado de ambos os produtos.",
                },
                {
                  question: "Como funciona a ativação do Julinho?",
                  answer:
                    "Após o pagamento, o Julinho será ativado automaticamente no número de WhatsApp que você informar. Você receberá uma mensagem de confirmação em instantes.",
                },
                {
                  question: "O preço de R$ 19,90 é recorrente?",
                  answer:
                    "Sim, é uma assinatura mensal. O preço promocional de R$ 19,90/mês fica travado enquanto sua assinatura estiver ativa. Se cancelar e quiser voltar depois, pagará o preço normal.",
                },
                {
                  question: "Posso cancelar a qualquer momento?",
                  answer:
                    "Sim! Você pode cancelar sua assinatura quando quiser, sem multas ou taxas adicionais. O acesso continua até o fim do período já pago.",
                },
                {
                  question: "Quais formas de pagamento são aceitas?",
                  answer:
                    "Aceitamos PIX (pagamento instantâneo) e cartão de crédito. Ambos os métodos oferecem ativação imediata após a confirmação do pagamento.",
                },
                {
                  question: "Até quando vale a promoção?",
                  answer:
                    "A oferta é válida até 01/01/2026 às 23:59 (horário de Brasília). Após essa data, os produtos voltam aos preços normais.",
                },
              ].map((faq) => (
                <div
                  key={faq.question}
                  className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
                >
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="text-center space-y-6 py-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              Não perca essa oportunidade!
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece 2025 escrevendo melhor. Aproveite o combo CorretorIA + Julinho
              com 50% de desconto.
            </p>
            <a
              href="#checkout"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-amber-500/25"
            >
              Quero aproveitar a oferta
              <ArrowRight className="h-5 w-5" />
            </a>
          </section>
        </div>
      </main>
    </>
  )
}
