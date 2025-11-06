import type { Metadata } from "next"
import { HeroSection } from "@/components/hero-section"
import { BenefitsSection } from "@/components/benefits-section"
import { HowToUseSection } from "@/components/how-to-use-section"
import { UseCasesSection } from "@/components/use-cases-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { SubscriptionBox } from "@/components/subscription-box"
import Link from "next/link"
import Script from "next/script"

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
      <Script
        id="schema-corretor-texto"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Corretor de Texto CorretorIA",
            applicationCategory: "WebApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "BRL",
            },
            description:
              "Corretor de texto online gratuito com inteligência artificial para corrigir erros de gramática, ortografia e estilo em português brasileiro e europeu.",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "1250",
            },
          }),
        }}
      />
      <HeroSection />
      <BenefitsSection />
      <SubscriptionBox />
      <HowToUseSection />
      <UseCasesSection />
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Amplie seu alcance com QR Codes</h2>
          <p className="text-muted-foreground text-lg">
            Além do CorretorIA, criei o
            {" "}
            <Link
              href="https://qrcodesimples.com/"
              target="_blank"
              rel="noreferrer"
              className="text-primary font-semibold underline-offset-4 hover:underline"
            >
              QR Code Simples
            </Link>
            , uma plataforma para gerar QR Codes personalizados e rastreáveis para suas campanhas impressas ou digitais.
          </p>
        </div>
      </section>
      <FAQSection />
      <CTASection />
    </>
  )
}
