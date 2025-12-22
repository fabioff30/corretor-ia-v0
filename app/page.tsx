import type { Metadata } from "next"
import { HeroSection } from "@/components/layout/hero-section"
import { BenefitsSection } from "@/components/benefits-section"
import { HowToUseSection } from "@/components/how-to-use-section"
import { UseCasesSection } from "@/components/use-cases-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/layout/cta-section"
import { SubscriptionBox } from "@/components/subscription-box"
import Link from "next/link"
import Script from "next/script"

// Atualizar os metadados da página inicial
export const metadata: Metadata = {
  title: "Corretor de Texto Online Grátis | Corretor Ortográfico com IA - CorretorIA",
  description:
    "Corretor de texto e verificador gramatical online grátis. Corrija erros de gramática, ortografia e estilo em português com IA. Ferramenta rápida, precisa e sem cadastro.",
  keywords:
    "corretor de texto, corretor ortográfico, verificador gramatical, correção de texto, corretor online grátis, gramática português, ortografia, IA, inteligência artificial",
  alternates: {
    canonical: "https://www.corretordetextoonline.com.br",
  },
  openGraph: {
    title: "Corretor de Texto Online Grátis | Corretor Ortográfico com IA - CorretorIA",
    description:
      "Corretor de texto e verificador gramatical online grátis. Corrija erros de gramática, ortografia e estilo em português com IA.",
    url: "https://www.corretordetextoonline.com.br",
    siteName: "CorretorIA - Corretor de Texto",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://www.corretordetextoonline.com.br/og-home.png",
        width: 1200,
        height: 630,
        alt: "CorretorIA - Corretor de Texto Online Grátis com Inteligência Artificial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corretor de Texto Online Grátis | CorretorIA",
    description: "Corrija textos em português com IA. Verificador gramatical e ortográfico gratuito.",
    images: ["https://www.corretordetextoonline.com.br/og-home.png"],
    creator: "@corretoria_br",
    site: "@corretoria_br",
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
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "O que é um corretor de texto online?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Um corretor de texto online é uma ferramenta digital que analisa textos para identificar e corrigir erros ortográficos, gramaticais, de pontuação e estilo. O CorretorIA utiliza inteligência artificial avançada para oferecer correções precisas e contextuais para textos em português, tanto na variante brasileira quanto na europeia, sem necessidade de instalação ou cadastro.",
                },
              },
              {
                "@type": "Question",
                name: "Como usar o corretor de texto CorretorIA?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Usar o corretor de texto CorretorIA é muito simples: basta colar ou digitar seu texto na caixa de entrada, selecionar o tom desejado (se necessário) e clicar no botão 'Corrigir'. Em segundos, você receberá o texto corrigido, uma comparação mostrando as alterações feitas e uma avaliação detalhada da qualidade do seu texto original.",
                },
              },
              {
                "@type": "Question",
                name: "O corretor de texto CorretorIA é realmente gratuito?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sim, o corretor de texto CorretorIA é completamente gratuito para uso. Não há custos ocultos, limites de caracteres restritivos ou funcionalidades básicas bloqueadas. Mantemos o serviço através de doações voluntárias de usuários que valorizam a ferramenta.",
                },
              },
              {
                "@type": "Question",
                name: "Qual a diferença entre o corretor de texto CorretorIA e outros corretores?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "O corretor de texto CorretorIA se destaca por utilizar inteligência artificial avançada especificamente treinada para o português, oferecendo correções mais precisas e contextuais. Diferente de outros corretores, o CorretorIA analisa não apenas erros ortográficos, mas também problemas gramaticais complexos, estilo de escrita e coerência textual.",
                },
              },
              {
                "@type": "Question",
                name: "O corretor de texto funciona bem para textos acadêmicos?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sim, o corretor de texto CorretorIA é excelente para textos acadêmicos. Ele foi treinado com uma ampla variedade de textos, incluindo artigos científicos e trabalhos acadêmicos. Para textos acadêmicos, recomendamos selecionar o tom 'Acadêmico' para obter correções mais adequadas ao contexto científico.",
                },
              },
              {
                "@type": "Question",
                name: "Os corretores de texto online são seguros para textos confidenciais?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No caso do corretor de texto CorretorIA, priorizamos a privacidade dos usuários. Seus textos não são armazenados permanentemente em nossos servidores após a correção, garantindo a confidencialidade do seu conteúdo.",
                },
              },
              {
                "@type": "Question",
                name: "Como o corretor de texto lida com termos técnicos?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "O corretor de texto CorretorIA foi treinado com um vasto vocabulário que inclui terminologias específicas de diversas áreas. Estamos constantemente ampliando nossa base de conhecimento para melhorar o reconhecimento de terminologias especializadas.",
                },
              },
              {
                "@type": "Question",
                name: "O corretor de texto pode substituir a revisão humana?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Embora o corretor de texto CorretorIA ofereça correções de alta qualidade, ele não substitui completamente a revisão humana, especialmente para textos complexos. Recomendamos usar o CorretorIA como uma primeira etapa de revisão, seguida por uma leitura cuidadosa do texto.",
                },
              },
            ],
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
