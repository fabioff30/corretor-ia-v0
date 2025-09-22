import type { Metadata } from "next"
import PricingContent, { type Plan } from "./pricing-content"

const plans: Plan[] = [
  {
    name: "Grátis",
    description: "Para quem está começando e quer testar a plataforma sem custo.",
    pricing: {
      monthly: { headline: "R$ 0", subheadline: "5 correções por dia" },
      annual: { headline: "R$ 0", subheadline: "5 correções por dia" },
    },
    features: [
      "Experiência sem anúncios",
      "5 correções gratuitas por dia",
      "3 reescritas gratuitas por dia",
      "1 análise de IA por mês",
      "0 humanizações de IA por mês",
    ],
    cta: { label: "Começar agora", href: "/" },
  },
  {
    name: "Plano Pro",
    description: "Para profissionais que precisam de produtividade constante.",
    pricing: {
      monthly: { headline: "R$ 19,90", subheadline: "por mês" },
      annual: { headline: "12x de R$ 16,58", subheadline: "R$ 199/ano" },
    },
    features: [
      "Experiência sem anúncios",
      "Correções ilimitadas",
      "Reescritas ilimitadas",
      "Uso do Julinho IA ilimitado",
      "2 análises de IA por dia",
      "1 humanização por dia",
    ],
    cta: { label: "Assinar Pro", href: "/upgrade" },
    featured: true,
    priceIds: {
      monthly: "price_1S9X2yAaDWyHAlqlrzwldZn6",
      annual: "price_1S9X31AaDWyHAlql6RKNkF1l",
    },
    planType: "pro",
  },
  {
    name: "Plano Plus",
    description: "Para equipes ou criadores que querem recursos ilimitados e prioridade.",
    pricing: {
      monthly: { headline: "R$ 39,90", subheadline: "por mês" },
      annual: { headline: "12x de R$ 33,25", subheadline: "R$ 399/ano" },
    },
    features: [
      "Experiência sem anúncios",
      "Correções ilimitadas",
      "Reescritas ilimitadas",
      "Uso do Julinho IA ilimitado",
      "Análises de IA ilimitadas",
      "Humanizações ilimitadas",
      "Acesso prioritário a novos recursos",
    ],
    cta: { label: "Assinar Plus", href: "/upgrade" },
    priceIds: {
      monthly: "price_1S9X36AaDWyHAlqlkNtcTERW",
      annual: "price_1S9X39AaDWyHAlql332ABbLk",
    },
    planType: "plus",
  },
]

export const metadata: Metadata = {
  title: "Planos e Preços – CorretorIA",
  description: "Compare planos gratuitos, Pro e Plus do CorretorIA e escolha o volume ideal de correções, reescritas e detecções de IA para o seu trabalho.",
}

export default function PricingPage() {
  return <PricingContent plans={plans} />
}
