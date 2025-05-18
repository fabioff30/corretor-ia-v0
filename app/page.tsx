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
  title: "Corretor de Texto Online e Gratuito | CorretorIA",
  description:
    "Corretor de Texto online com IA para corrigir erros de gramática, ortografia e estilo em português. Ferramenta gratuita, rápida e precisa para correção de textos.",
  keywords:
    "corretor de texto, correção de texto, corretor ortográfico, português, gramática, ortografia, IA, inteligência artificial, corretor online",
  openGraph: {
    title: "Corretor de Texto Online e Gratuito | CorretorIA",
    description:
      "Corretor de Texto online com IA para corrigir erros de gramática, ortografia e estilo em português. Ferramenta gratuita para correção de textos.",
    url: "https://www.corretordetextoonline.com.br",
    siteName: "CorretorIA - Corretor de Texto",
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
