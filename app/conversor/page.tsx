import type { Metadata } from "next"
import { DocumentUploader } from "@/components/DocumentUploader"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Zap, Shield, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Conversor de Documentos para Markdown - PDF, DOCX, XLSX e mais",
  description:
    "Converta documentos PDF, DOCX, XLSX, PPTX e outros formatos para Markdown de forma rápida e gratuita. Extração de texto preservando formatação e estrutura.",
  keywords: [
    "conversor pdf markdown",
    "pdf para markdown",
    "docx para markdown",
    "xlsx para markdown",
    "converter documento",
    "extrair texto pdf",
    "pdf to markdown",
    "document converter",
    "markdown converter",
    "converter arquivo",
  ],
  authors: [{ name: "CorretorIA" }],
  creator: "CorretorIA",
  publisher: "CorretorIA",
  alternates: {
    canonical: "https://www.corretordetextoonline.com.br/conversor",
  },
  openGraph: {
    title: "Conversor de Documentos para Markdown - Gratuito",
    description:
      "Converta PDF, DOCX, XLSX e mais para Markdown. Rápido, preciso e gratuito.",
    url: "https://www.corretordetextoonline.com.br/conversor",
    siteName: "CorretorIA",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conversor de Documentos para Markdown",
    description:
      "Converta PDF, DOCX, XLSX e mais para Markdown. Rápido e gratuito.",
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

export default async function ConversorPage() {
  // Get user session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user plan
  let isPremium = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_type")
      .eq("id", user.id)
      .single()

    isPremium = profile?.plan_type === "pro" || profile?.plan_type === "admin"
  }

  // Structured Data - JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Conversor de Documentos",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
    description:
      "Conversor gratuito de documentos para Markdown. Suporta PDF, DOCX, XLSX, PPTX e mais.",
    url: "https://www.corretordetextoonline.com.br/conversor",
    author: {
      "@type": "Organization",
      name: "CorretorIA",
      url: "https://www.corretordetextoonline.com.br",
    },
    featureList: [
      "Conversão de PDF para Markdown",
      "Conversão de DOCX para Markdown",
      "Conversão de XLSX para Markdown",
      "Extração de texto preservando formatação",
      "Download em Markdown e TXT",
      "Plano gratuito: até 10MB",
      "Plano premium: até 50MB",
    ],
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-[1366px] mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <header className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 gradient-text">
                Conversor de Documentos
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Converta <strong>PDF, DOCX, XLSX</strong> e outros formatos
                para Markdown de forma rápida e gratuita.
              </p>
            </header>

            {/* Main Form */}
            <DocumentUploader isPremium={isPremium} />
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
                    <h3 className="font-semibold mb-1">Conversão Rápida</h3>
                    <p className="text-sm text-muted-foreground">
                      Processamento em segundos com alta qualidade
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
                    <h3 className="font-semibold mb-1">100% Seguro</h3>
                    <p className="text-sm text-muted-foreground">
                      Arquivos não são armazenados permanentemente
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
                    <h3 className="font-semibold mb-1">Múltiplos Formatos</h3>
                    <p className="text-sm text-muted-foreground">
                      {isPremium
                        ? "PDF, DOCX, XLSX, PPTX, CSV, XML, JSON"
                        : "PDF, DOCX, TXT, HTML"}
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
                <h2 className="text-2xl font-bold mb-4">
                  Como funciona o Conversor?
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Nosso <strong>conversor de documentos</strong> utiliza
                    tecnologia avançada (MarkItDown da Microsoft) para extrair
                    texto de diversos formatos e convertê-los para{" "}
                    <strong>Markdown</strong>, preservando ao máximo a estrutura
                    e formatação original.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Formatos Gratuitos:
                      </h3>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>PDF (até 10MB)</li>
                        <li>DOCX (até 10MB)</li>
                        <li>TXT (até 10MB)</li>
                        <li>HTML (até 10MB)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Formatos Premium:
                      </h3>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Todos os formatos gratuitos</li>
                        <li>XLSX (até 50MB)</li>
                        <li>PPTX (até 50MB)</li>
                        <li>CSV, XML, JSON (até 50MB)</li>
                      </ul>
                    </div>
                  </div>
                  {!isPremium && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>💎 Quer mais?</strong> Faça upgrade para Premium
                        e converta arquivos maiores em mais formatos!{" "}
                        <a
                          href="/premium"
                          className="underline font-semibold hover:text-blue-600"
                        >
                          Ver planos
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">
                  Perguntas Frequentes
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      📄 O que é Markdown?
                    </h3>
                    <p className="text-muted-foreground">
                      Markdown é uma linguagem de marcação leve que permite
                      formatar texto usando caracteres simples. É amplamente
                      usada em documentação, blogs, GitHub e outras plataformas.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      🔄 Como funciona a conversão?
                    </h3>
                    <p className="text-muted-foreground">
                      Fazemos upload do seu arquivo, processamos usando o
                      MarkItDown (Microsoft), extraímos o texto preservando
                      formatação e retornamos em Markdown e texto puro.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      🔒 Meus arquivos são armazenados?
                    </h3>
                    <p className="text-muted-foreground">
                      Não! Os arquivos são processados temporariamente e não
                      ficam armazenados em nossos servidores após a conversão.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      ⚡ Qual o tempo de processamento?
                    </h3>
                    <p className="text-muted-foreground">
                      A maioria dos arquivos é convertida em menos de 5
                      segundos. Arquivos maiores podem levar até 15 segundos.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      💰 Preciso pagar?
                    </h3>
                    <p className="text-muted-foreground">
                      O plano gratuito permite converter PDF, DOCX, TXT e HTML
                      até 10MB. Para arquivos maiores e mais formatos, faça
                      upgrade para Premium.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4 text-center">
                  Outras Ferramentas Gratuitas
                </h2>
                <p className="text-center text-muted-foreground mb-6">
                  Confira outras ferramentas de IA do CorretorIA para melhorar
                  seus textos
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
                    href="/detector-ia"
                    className="p-4 bg-background rounded-lg border hover:border-primary transition-colors"
                  >
                    <h3 className="font-semibold mb-2">🤖 Detector de IA</h3>
                    <p className="text-sm text-muted-foreground">
                      Identifique se um texto foi gerado por IA
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
