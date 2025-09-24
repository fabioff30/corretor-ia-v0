import type { Metadata } from "next"
import TextCorrectionForm from "@/components/text-correction-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Script from "next/script"
import { RewriteStyleCards } from "@/components/rewrite/rewrite-style-cards"
import { FAQRewrite } from "@/components/rewrite/faq-rewrite"
import { UseCasesByAudience } from "@/components/rewrite/use-cases-by-audience"
import { ComparisonTable } from "@/components/rewrite/comparison-table"
import { TestimonialsRewrite } from "@/components/rewrite/testimonials-rewrite"
import {
  Sparkles,
  Zap,
  Target,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  BookOpen,
  Shield,
  Award,
  Lightbulb,
  ArrowRight
} from "lucide-react"

export const metadata: Metadata = {
  title: "Reescrever Texto Online com IA - Ferramenta Gratuita de Reescrita | CorretorIA",
  description:
    "Reescreva textos instantaneamente com IA em 5 estilos: formal, humanizado, acadêmico, criativo e infantil. Ferramenta gratuita que mantém o significado e corrige erros. Experimente agora!",
  keywords: "reescrever texto, reescrita de texto, parafrasear texto, IA para texto, texto formal, texto acadêmico, texto criativo, reescrever online, ferramenta de reescrita, inteligência artificial texto, corretor de texto, reformulação de texto, português brasileiro",
  authors: [{ name: "CorretorIA" }],
  creator: "CorretorIA",
  publisher: "CorretorIA",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://www.corretordetextoonline.com.br/reescrever-texto",
    languages: {
      'pt-BR': 'https://www.corretordetextoonline.com.br/reescrever-texto',
      'pt': 'https://www.corretordetextoonline.com.br/reescrever-texto',
    },
  },
  openGraph: {
    title: "Reescrever Texto Online com IA - Ferramenta Gratuita | CorretorIA",
    description: "Reescreva textos instantaneamente com IA em 5 estilos diferentes. Ferramenta gratuita que mantém o significado original e corrige erros automaticamente.",
    url: "https://www.corretordetextoonline.com.br/reescrever-texto",
    siteName: "CorretorIA - Corretor de Texto com IA",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://www.corretordetextoonline.com.br/og-reescrever-texto.jpg",
        width: 1200,
        height: 630,
        alt: "Reescrever Texto com Inteligência Artificial - CorretorIA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reescrever Texto Online com IA - CorretorIA",
    description: "Reescreva textos em 5 estilos diferentes com IA. Ferramenta gratuita e instantânea.",
    images: ["https://www.corretordetextoonline.com.br/og-reescrever-texto.jpg"],
    creator: "@corretoria_br",
    site: "@corretoria_br",
  },
  verification: {
    google: "verification-code-here",
  },
  category: "Technology",
}

export default function RewriteTextPage() {
  return (
    <>
      {/* Structured Data - JSON-LD Schemas */}
      <Script
        id="schema-rewrite-webapp"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Reescrever Texto - CorretorIA",
            applicationCategory: "ProductivityApplication",
            operatingSystem: "Web",
            description: "Ferramenta gratuita de IA para reescrever textos em diferentes estilos: formal, humanizado, acadêmico, criativo e infantil.",
            url: "https://www.corretordetextoonline.com.br/reescrever-texto",
            author: {
              "@type": "Organization",
              name: "CorretorIA",
              url: "https://www.corretordetextoonline.com.br"
            },
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "BRL",
              description: "Versão gratuita com limite de 1500 caracteres"
            },
            featureList: [
              "Reescrita em 5 estilos diferentes",
              "Mantém significado original",
              "Correção automática de erros",
              "Processamento instantâneo",
              "Interface intuitiva"
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "2150",
              bestRating: "5",
              worstRating: "1"
            }
          })
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
                name: "Como funciona a reescrita de texto com inteligência artificial?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Nossa IA analisa seu texto original compreendendo o contexto, significado e estrutura. Em seguida, ela reescreve o conteúdo adaptando o vocabulário, tom e estilo conforme sua escolha, mantendo sempre o significado original intacto."
                }
              },
              {
                "@type": "Question",
                name: "Quantas palavras posso reescrever por vez?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Usuários gratuitos podem reescrever até 1.500 caracteres por vez. Com o plano Premium, esse limite aumenta para 5.000 caracteres, permitindo reescrever textos mais longos de uma só vez."
                }
              },
              {
                "@type": "Question",
                name: "A reescrita preserva o significado original do texto?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sim, nossa prioridade é manter o significado intacto. A IA reformula apenas a forma de expressão - vocabulário, estrutura das frases e tom - sem alterar as ideias e informações originais do seu texto."
                }
              }
            ]
          })
        }}
      />

      <Script
        id="schema-howto"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Como Reescrever Texto com IA",
            description: "Guia passo a passo para reescrever textos usando inteligência artificial",
            step: [
              {
                "@type": "HowToStep",
                name: "Cole seu texto",
                text: "Insira o texto que deseja reescrever na área de texto"
              },
              {
                "@type": "HowToStep",
                name: "Escolha o estilo",
                text: "Selecione entre formal, humanizado, acadêmico, criativo ou infantil"
              },
              {
                "@type": "HowToStep",
                name: "Clique em Reescrever",
                text: "Aguarde alguns segundos para a IA processar seu texto"
              },
              {
                "@type": "HowToStep",
                name: "Revise o resultado",
                text: "Analise o texto reescrito e faça ajustes se necessário"
              }
            ]
          })
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex justify-center gap-2 mb-6">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                IA Avançada
              </Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <Zap className="h-3 w-3 mr-1" />
                Instantâneo
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                <Shield className="h-3 w-3 mr-1" />
                100% Gratuito
              </Badge>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Reescrever Texto com IA
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              Transforme qualquer texto em <strong>5 estilos diferentes</strong> mantendo o significado original.
              Nossa inteligência artificial reescreve instantaneamente e corrige erros automaticamente.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
              <div className="text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">10s</div>
                <div className="text-sm text-muted-foreground">Processamento</div>
              </div>
              <div className="text-center">
                <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">Estilos</div>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">50K+</div>
                <div className="text-sm text-muted-foreground">Usuários</div>
              </div>
              <div className="text-center">
                <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">4.8★</div>
                <div className="text-sm text-muted-foreground">Avaliação</div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="container mx-auto px-4 mb-12">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  Reescreva Seu Texto Agora
                </CardTitle>
                <p className="text-muted-foreground">
                  Cole seu texto abaixo, escolha o estilo desejado e deixe nossa IA fazer a mágica acontecer
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <TextCorrectionForm initialMode="rewrite" enableCrossNavigation={true} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Rewrite Style Cards */}
        <RewriteStyleCards />

        {/* Benefits Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Por Que Escolher Nossa Ferramenta?</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Desenvolvida especialmente para o português brasileiro, nossa IA oferece resultados
                superiores e economiza até 95% do seu tempo comparado à reescrita manual.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-full w-fit mx-auto mb-4 shadow-md">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-xl mb-3">IA Especializada</h3>
                <p className="text-muted-foreground">
                  Treinada especificamente para português brasileiro com compreensão contextual avançada
                  e adaptação de estilo inteligente.
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-full w-fit mx-auto mb-4 shadow-md">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-xl mb-3">Significado Preservado</h3>
                <p className="text-muted-foreground">
                  Garantimos que suas ideias principais permaneçam intactas enquanto melhoramos
                  a forma de expressão e corrigimos erros.
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-full w-fit mx-auto mb-4 shadow-md">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-xl mb-3">Rapidez Extraordinária</h3>
                <p className="text-muted-foreground">
                  Processamento instantâneo que economiza horas de trabalho. O que levaria
                  30 minutos manualmente, fazemos em 10 segundos.
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-full w-fit mx-auto mb-4 shadow-md">
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-bold text-xl mb-3">Múltiplos Estilos</h3>
                <p className="text-muted-foreground">
                  Cinco estilos distintos para cada situação: formal, humanizado, acadêmico,
                  criativo e infantil. Perfeito para qualquer contexto.
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-full w-fit mx-auto mb-4 shadow-md">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-bold text-xl mb-3">Totalmente Seguro</h3>
                <p className="text-muted-foreground">
                  Seus textos são processados com segurança e privacidade total. Não armazenamos
                  ou compartilhamos seu conteúdo.
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-full w-fit mx-auto mb-4 shadow-md">
                  <TrendingUp className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="font-bold text-xl mb-3">Resultados Comprovados</h3>
                <p className="text-muted-foreground">
                  Mais de 2 milhões de textos reescritos com sucesso e avaliação média de
                  4.8 estrelas pelos usuários.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 py-12 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Como Funciona a Reescrita Inteligente?</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Nossa tecnologia de IA utiliza algoritmos avançados para compreender, analisar e
                transformar seu texto mantendo a essência original.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <ArrowRight className="h-6 w-6 text-muted-foreground mx-auto" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">Análise Contextual</h3>
                <p className="text-muted-foreground text-sm">
                  Nossa IA analisa profundamente seu texto, compreendendo o contexto,
                  significado e estrutura linguística.
                </p>
              </div>

              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <ArrowRight className="h-6 w-6 text-muted-foreground mx-auto" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">Adaptação de Estilo</h3>
                <p className="text-muted-foreground text-sm">
                  Seleciona vocabulário, tom e estrutura adequados ao estilo escolhido,
                  mantendo a coerência textual.
                </p>
              </div>

              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <ArrowRight className="h-6 w-6 text-muted-foreground mx-auto" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">Correção Integrada</h3>
                <p className="text-muted-foreground text-sm">
                  Durante a reescrita, corrige automaticamente erros de gramática,
                  ortografia e concordância.
                </p>
              </div>

              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-primary">4</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">Entrega Otimizada</h3>
                <p className="text-muted-foreground text-sm">
                  Gera o texto final com melhor fluidez, clareza e adequação ao
                  público-alvo desejado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases by Audience */}
        <UseCasesByAudience />

        {/* Comparison Table */}
        <ComparisonTable />

        {/* Testimonials */}
        <TestimonialsRewrite />

        {/* Advanced Tips Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Dicas Avançadas para Melhores Resultados</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Para Textos Profissionais
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Use o estilo "formal" para e-mails corporativos e propostas
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Revise termos técnicos específicos da sua área
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Mantenha números, datas e dados técnicos inalterados
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Teste diferentes estilos para encontrar o tom ideal
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Para Conteúdo Acadêmico
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Processe parágrafos individualmente para maior precisão
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Preserve citações e referências bibliográficas
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Use o estilo "acadêmico" para manter rigor científico
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Revise a terminologia especializada após a reescrita
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Para Redes Sociais
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Escolha "humanizado" para posts mais envolventes
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Use "criativo" para conteúdo de marketing impactante
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Adapte o mesmo conteúdo para diferentes plataformas
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Experimente variações para testes A/B
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Dicas Gerais de Otimização
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Textos bem estruturados geram melhores resultados
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Evite textos com muitas abreviações ou gírias
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Sempre revise o resultado final antes de usar
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Combine nossa ferramenta com sua revisão humana
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQRewrite />

        {/* Call to Action Final */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <h2 className="text-3xl font-bold mb-4">Pronto para Transformar Seus Textos?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Junte-se a mais de 50.000 profissionais que já descobriram o poder da reescrita
                inteligente. Experimente agora gratuitamente!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Sem cadastro necessário</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Resultados instantâneos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>100% gratuito</span>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </>
  )
}