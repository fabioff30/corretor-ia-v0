import type { Metadata } from "next"
import TextCorrectionForm from "@/components/text-correction-form"
import { Card, CardContent } from "@/components/ui/card"
import Script from "next/script"

export const metadata: Metadata = {
  title: "Reescrever Texto Online Grátis - IA para Reescrita em Português | CorretorIA",
  description:
    "Reescreva textos em português com IA gratuita. Transforme seu texto em 5 estilos: formal, humanizado, acadêmico, criativo e infantil. Ferramenta online sem cadastro.",
  keywords: [
    "reescrever texto",
    "reescrita de texto",
    "parafrasear texto",
    "reformular texto",
    "texto formal",
    "texto acadêmico",
    "texto criativo",
    "inteligência artificial",
    "IA para texto",
    "português",
    "ferramenta online",
    "grátis",
    "sem cadastro",
  ].join(", "),
  openGraph: {
    title: "Reescrever Texto Online Grátis - IA para Reescrita em Português",
    description:
      "Transforme seu texto em diferentes estilos com nossa IA gratuita. Formal, humanizado, acadêmico, criativo e infantil. Sem cadastro necessário.",
    url: "https://www.corretordetextoonline.com.br/reescrever-texto",
    siteName: "CorretorIA",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://www.corretordetextoonline.com.br/images/reescrever-texto-og.jpg",
        width: 1200,
        height: 630,
        alt: "Reescrever Texto Online com Inteligência Artificial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reescrever Texto Online Grátis - IA para Reescrita",
    description: "Transforme seu texto em diferentes estilos com IA gratuita. Formal, acadêmico, criativo e mais.",
    images: ["https://www.corretordetextoonline.com.br/images/reescrever-texto-og.jpg"],
  },
  alternates: {
    canonical: "https://www.corretordetextoonline.com.br/reescrever-texto",
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

export default function RewriteTextPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Reescrever Texto CorretorIA",
    description: "Ferramenta online gratuita para reescrever textos em português usando inteligência artificial",
    url: "https://www.corretordetextoonline.com.br/reescrever-texto",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
    featureList: [
      "Reescrita em estilo formal",
      "Reescrita humanizada",
      "Reescrita acadêmica",
      "Reescrita criativa",
      "Reescrita infantil",
      "Sem necessidade de cadastro",
      "Processamento instantâneo",
    ],
    inLanguage: "pt-BR",
    creator: {
      "@type": "Organization",
      name: "CorretorIA",
    },
  }

  return (
    <>
      <Script
        id="rewrite-text-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Reescrever Texto Online Grátis com Inteligência Artificial
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
              Transforme seu texto em diferentes estilos usando nossa IA avançada. Escolha entre formal, humanizado,
              acadêmico, criativo ou infantil. Gratuito e sem cadastro.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                ✨ Grátis
              </span>
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-green-900 dark:text-green-300">
                🚀 Instantâneo
              </span>
              <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-purple-900 dark:text-purple-300">
                🔒 Sem Cadastro
              </span>
              <span className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-orange-900 dark:text-orange-300">
                🇧🇷 Português
              </span>
            </div>
          </header>

          <Card className="mb-12 shadow-lg">
            <CardContent className="p-0">
              <TextCorrectionForm initialMode="rewrite" />
            </CardContent>
          </Card>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                Como Funciona a Reescrita de Texto com IA?
              </h2>
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Nossa ferramenta de reescrita utiliza <strong>inteligência artificial avançada</strong> para
                  transformar seu texto mantendo o significado original, mas adaptando completamente o estilo conforme
                  sua necessidade:
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-100">🏢 Estilo Formal</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Perfeito para <strong>documentos profissionais</strong>, e-mails corporativos, relatórios e textos
                      oficiais. Linguagem técnica e respeitosa.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-green-900 dark:text-green-100">
                      👥 Estilo Humanizado
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Ideal para <strong>comunicações naturais</strong>, posts em redes sociais, blogs e conversas. Tom
                      conversacional e acessível.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-purple-900 dark:text-purple-100">
                      🎓 Estilo Acadêmico
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Adequado para <strong>trabalhos científicos</strong>, artigos, dissertações e teses. Linguagem
                      técnica e metodológica.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-orange-900 dark:text-orange-100">
                      🎨 Estilo Criativo
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Excelente para <strong>conteúdo de marketing</strong>, histórias, descrições expressivas e textos
                      publicitários.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-6 rounded-lg mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-pink-900 dark:text-pink-100">👶 Estilo Infantil</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Simplifica o texto para uma <strong>linguagem mais acessível</strong>, ideal para materiais
                    educativos infantis e comunicação com crianças.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                Vantagens da Nossa Ferramenta de Reescrita
              </h2>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-lg font-semibold mb-2">Processamento Instantâneo</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Reescreva textos em segundos com nossa IA otimizada
                  </p>
                </div>

                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold mb-2">Preserva o Significado</h3>
                  <p className="text-gray-600 dark:text-gray-400">Mantém a essência do texto original intacta</p>
                </div>

                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <div className="text-4xl mb-4">🔄</div>
                  <h3 className="text-lg font-semibold mb-2">Múltiplas Versões</h3>
                  <p className="text-gray-600 dark:text-gray-400">Gere diferentes versões do mesmo texto</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                Dicas para Obter os Melhores Resultados
              </h2>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-lg">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <div>
                      <strong>Texto claro e estruturado:</strong> Forneça um texto bem organizado para obter a melhor
                      reescrita possível.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <div>
                      <strong>Escolha o estilo adequado:</strong> Selecione o estilo que melhor se adapta ao seu
                      objetivo final.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <div>
                      <strong>Revise o resultado:</strong> Sempre revise o texto reescrito, pois a IA pode
                      ocasionalmente alterar sutilmente o significado.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <div>
                      <strong>Textos longos:</strong> Para textos extensos, considere reescrever por parágrafos para
                      maior precisão.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <div>
                      <strong>Experimente estilos:</strong> Teste diferentes estilos para encontrar o tom perfeito para
                      sua necessidade.
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                Casos de Uso Populares
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">📝 Para Estudantes</h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• Reescrever trabalhos acadêmicos</li>
                    <li>• Parafrasear citações e referências</li>
                    <li>• Adaptar linguagem para diferentes públicos</li>
                    <li>• Melhorar redações e ensaios</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">
                    💼 Para Profissionais
                  </h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• Formalizar e-mails e documentos</li>
                    <li>• Criar conteúdo para marketing</li>
                    <li>• Adaptar textos para diferentes canais</li>
                    <li>• Humanizar comunicações corporativas</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">✍️ Para Escritores</h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• Superar bloqueios criativos</li>
                    <li>• Explorar diferentes estilos narrativos</li>
                    <li>• Adaptar textos para diferentes gêneros</li>
                    <li>• Criar variações de conteúdo</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-orange-600 dark:text-orange-400">
                    🌐 Para Criadores de Conteúdo
                  </h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• Adaptar posts para redes sociais</li>
                    <li>• Criar múltiplas versões de conteúdo</li>
                    <li>• Personalizar mensagens por plataforma</li>
                    <li>• Otimizar textos para SEO</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-8 rounded-lg">
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
                Perguntas Frequentes sobre Reescrita de Texto
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    A ferramenta é realmente gratuita?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Sim! Nossa ferramenta de reescrita é <strong>100% gratuita</strong> e não requer cadastro. Você pode
                    usar quantas vezes quiser.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    A IA preserva o significado original do texto?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Nossa IA é treinada para <strong>manter o significado central</strong> do texto enquanto adapta o
                    estilo. Recomendamos sempre revisar o resultado.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    Qual é o limite de caracteres?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Você pode reescrever textos de até <strong>5.000 caracteres</strong> por vez. Para textos maiores,
                    divida em partes menores.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    Os textos são armazenados ou compartilhados?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Não armazenamos</strong> seus textos. Todo o processamento é feito de forma segura e seus
                    dados são descartados após o processamento.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
