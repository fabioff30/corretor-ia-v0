import type { Metadata } from "next"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { HowToUseSection } from "@/components/how-to-use-section"
import { BenefitsSection } from "@/components/benefits-section"
import { UseCasesSection } from "@/components/use-cases-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { RatingStatsSection } from "@/components/rating-stats-section"
import { SupportersSection } from "@/components/supporters-section"
import { AboutAuthorSection } from "@/components/about-author-section"
import { RoadmapSection } from "@/components/roadmap-section"
import { getCanonicalUrl } from "@/lib/canonical-url"

export const metadata: Metadata = {
  title: "CorretorIA - Corretor de Texto Online Grátis com Inteligência Artificial",
  description:
    "Corrija textos em português com inteligência artificial. Identifica erros gramaticais, ortográficos e de pontuação automaticamente.",
  keywords:
    "corretor de texto, corretor ortográfico, correção gramatical, português, inteligência artificial, IA, corretor online, corretor grátis",
  alternates: {
    canonical: getCanonicalUrl(),
  },
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowToUseSection />
      <BenefitsSection />
      <UseCasesSection />
      <TestimonialsSection />
      <RatingStatsSection />
      <SupportersSection />
      <AboutAuthorSection />
      <RoadmapSection />
      <FAQSection />
      <CTASection />
    </>
  )
}
