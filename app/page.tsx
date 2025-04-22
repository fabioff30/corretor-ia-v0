import type { Metadata } from "next"
import { HeroSection } from "@/components/hero-section"
import { BenefitsSection } from "@/components/benefits-section"
import { HowToUseSection } from "@/components/how-to-use-section"
import { UseCasesSection } from "@/components/use-cases-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { SupportersSection } from "@/components/supporters-section"

// Atualizar os metadados da página inicial
export const metadata: Metadata = {
  title: "CorretorIA - Correção Inteligente de Textos em Português",
  description:
    "Corrija erros de gramática, ortografia e estilo em seus textos em português com nossa ferramenta de inteligência artificial. Rápido, gratuito e preciso.",
  keywords:
    "corretor de texto, correção de texto, português, gramática, ortografia, IA, inteligência artificial, corretor online",
  openGraph: {
    title: "CorretorIA - Correção Inteligente de Textos em Português",
    description:
      "Corrija erros de gramática, ortografia e estilo em seus textos em português com nossa ferramenta de inteligência artificial.",
    url: "https://www.corretordetextoonline.com.br",
    siteName: "CorretorIA",
    locale: "pt_BR",
    type: "website",
  },
}

// Atualizar a função Home para reordenar as seções
export default function Home() {
  return (
    <>
      <HeroSection />
      <SupportersSection />
      <BenefitsSection />
      <HowToUseSection />
      <UseCasesSection />
      <FAQSection />
      <CTASection />
    </>
  )
}
