import type { Metadata } from "next"
import { AIDetectorForm } from "@/components/features/ai-detector-form"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, Shield, Zap, Info } from "lucide-react"
import { MobileDetectorWrapper } from "@/components/mobile/mobile-detector-wrapper"

export const metadata: Metadata = {
  title: "Detector de IA Gratuito - Identifique Textos Gerados por Inteligência Artificial",
  description:
    "Descubra se um texto foi escrito por IA (ChatGPT, Claude, Gemini) ou por humanos. Detector gratuito e preciso com análise de probabilidade, erros gramaticais e brasileirismos. 2 análises grátis por dia.",
  keywords: [
    "detector de ia",
    "detector de texto ia",
    "identificar texto ia",
    "texto gerado por ia",
    "chatgpt detector",
    "claude detector",
    "gemini detector",
    "detectar ia",
    "verificar se texto é ia",
    "análise de texto ia",
    "detector de inteligência artificial",
    "como saber se texto é ia",
    "detector ai gratuito",
    "verificador de conteúdo ia",
  ],
  authors: [{ name: "CorretorIA" }],
  creator: "CorretorIA",
  publisher: "CorretorIA",
  alternates: {
    canonical: "https://www.corretordetextoonline.com.br/detector-ia",
  },
  openGraph: {
    title: "Detector de IA Gratuito - Identifique Textos de ChatGPT, Claude e Gemini",
    description:
      "Descubra se um texto foi escrito por IA ou humano. Análise completa com probabilidade, erros gramaticais e brasileirismos. 100% gratuito.",
    url: "https://www.corretordetextoonline.com.br/detector-ia",
    siteName: "CorretorIA",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://www.corretordetextoonline.com.br/og-detector-ia.png",
        width: 1200,
        height: 630,
        alt: "Detector de IA - CorretorIA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Detector de IA Gratuito - Identifique Textos de IA",
    description:
      "Descubra se um texto foi escrito por ChatGPT, Claude ou humano. Análise completa e gratuita.",
    images: ["https://www.corretordetextoonline.com.br/og-detector-ia.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function DetectorIAPage() {
  // Structured Data - JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Detector de IA",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
    description:
      "Detector gratuito de textos gerados por inteligência artificial. Identifique se um texto foi escrito por ChatGPT, Claude, Gemini ou por humanos.",
    url: "https://www.corretordetextoonline.com.br/detector-ia",
    author: {
      "@type": "Organization",
      name: "CorretorIA",
      url: "https://www.corretordetextoonline.com.br",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
    featureList: [
      "Análise de probabilidade IA vs Humano",
      "Detecção de erros gramaticais",
      "Identificação de brasileirismos",
      "Análise de sinais de IA",
      "Estatísticas detalhadas do texto",
      "2 análises gratuitas por dia",
    ],
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Como funciona o detector de IA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nosso detector utiliza algoritmos avançados de processamento de linguagem natural para analisar padrões característicos de textos gerados por IA, como ChatGPT, Claude e Gemini. Analisamos vocabulário, estrutura, erros gramaticais, brasileirismos e outros indicadores.",
        },
      },
      {
        "@type": "Question",
        name: "O detector é gratuito?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim! Você pode usar o detector de IA gratuitamente até 2 vezes por dia, com limite de 10.000 caracteres por análise.",
        },
      },
      {
        "@type": "Question",
        name: "Quais IAs o detector consegue identificar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "O detector é capaz de identificar textos gerados por diversos modelos de IA, incluindo ChatGPT, Claude, Gemini, e outros modelos de linguagem modernos.",
        },
      },
      {
        "@type": "Question",
        name: "O detector é 100% preciso?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Não existe detector 100% preciso. Nosso detector fornece uma análise baseada em probabilidade e sinais detectados. Use os resultados como orientação, não como verdade absoluta.",
        },
      },
    ],
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="block md:hidden">
        <MobileDetectorWrapper />
      </div>

      <div className="hidden md:block min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-[1366px] mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <header className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 gradient-text">
                Detector de IA Gratuito
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Descubra se um texto foi escrito por <strong>ChatGPT, Claude, Gemini</strong> ou por humanos. Análise
                completa e gratuita.
              </p>
            </header>

            {/* Main Form */}
            <AIDetectorForm />
          </div>

          {/* Features Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-5xl mx-auto">
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Análise Rápida</h3>
                    <p className="text-sm text-muted-foreground">
                      Resultados em segundos com probabilidade e confiança
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Privacidade Total</h3>
                    <p className="text-sm text-muted-foreground">
                      Seus textos não são armazenados após a análise
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Detalhes Completos</h3>
                    <p className="text-sm text-muted-foreground">
                      Sinais, brasileirismos e análise gramatical
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <article className="mt-12 space-y-8 max-w-4xl mx-auto">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Como funciona o Detector de IA?</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Nosso <strong>detector de IA gratuito</strong> utiliza algoritmos avançados de processamento de
                    linguagem natural para analisar padrões característicos de textos gerados por inteligência
                    artificial, como <strong>ChatGPT</strong>, <strong>Claude</strong>, <strong>Gemini</strong> e outros
                    modelos de linguagem.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">O que analisamos:</h3>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Padrões de escrita e estrutura</li>
                        <li>Vocabulário e variação lexical</li>
                        <li>Brasileirismos e regionalidade</li>
                        <li>Coerência e fluxo natural</li>
                        <li>Erros gramaticais típicos</li>
                        <li>Formatação e uso de markdown</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Informações fornecidas:</h3>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Veredicto (IA/Humano/Incerto)</li>
                        <li>Probabilidade percentual</li>
                        <li>Nível de confiança</li>
                        <li>Sinais detectados categorizados</li>
                        <li>Estatísticas detalhadas do texto</li>
                        <li>Análise de erros gramaticais</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>⚠️ Importante:</strong> Nenhum detector de IA é 100% preciso. Use os resultados como uma
                      orientação, não como verdade absoluta. Textos podem ser escritos por humanos com auxílio de IA, ou
                      vice-versa.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Perguntas Frequentes</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">📊 O que é um detector de IA?</h3>
                    <p className="text-muted-foreground">
                      Um detector de IA é uma ferramenta que analisa textos para identificar se foram gerados por
                      inteligência artificial (como ChatGPT, Claude, Gemini) ou escritos por humanos. Utiliza algoritmos
                      de machine learning para detectar padrões característicos.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">🎯 Para que serve o detector de texto IA?</h3>
                    <p className="text-muted-foreground">
                      O detector serve para verificar autenticidade de conteúdo, identificar possível plágio de IA,
                      avaliar trabalhos acadêmicos, analisar artigos e posts em redes sociais, e garantir originalidade
                      em conteúdo profissional.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">💰 Quanto custa usar o detector?</h3>
                    <p className="text-muted-foreground">
                      O detector é <strong>100% gratuito</strong>! Você pode fazer até 2 análises por dia, com limite de
                      10.000 caracteres por análise. Não é necessário cadastro ou pagamento.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      🤖 Quais IAs o detector consegue identificar?
                    </h3>
                    <p className="text-muted-foreground">
                      Nosso detector identifica textos gerados por diversos modelos: ChatGPT (OpenAI), Claude (Anthropic),
                      Gemini (Google), Llama (Meta), Mistral e outros LLMs modernos. A análise funciona para textos em
                      português brasileiro.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">✅ O detector é confiável?</h3>
                    <p className="text-muted-foreground">
                      O detector utiliza múltiplos modelos de IA e oferece alta precisão na maioria dos casos. No
                      entanto, nenhum detector é 100% preciso. Use os resultados como orientação e combine com análise
                      manual quando necessário.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4 text-center">Outras Ferramentas Gratuitas</h2>
                <p className="text-center text-muted-foreground mb-6">
                  Confira outras ferramentas de IA do CorretorIA para melhorar seus textos
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="/"
                    className="p-4 bg-background rounded-lg border hover:border-primary transition-colors"
                  >
                    <h3 className="font-semibold mb-2">✍️ Corretor de Texto</h3>
                    <p className="text-sm text-muted-foreground">
                      Corrija erros gramaticais e ortográficos automaticamente
                    </p>
                  </a>
                  <a
                    href="/reescrever-texto"
                    className="p-4 bg-background rounded-lg border hover:border-primary transition-colors"
                  >
                    <h3 className="font-semibold mb-2">🔄 Reescrever Texto</h3>
                    <p className="text-sm text-muted-foreground">
                      Reescreva textos mantendo o significado original
                    </p>
                  </a>
                </div>
              </CardContent>
            </Card>
          </article>
        </div>
      </div>
    </>
  )
}
