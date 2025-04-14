"use client"

import Link from "next/link"
import { BackgroundGradient } from "@/components/background-gradient"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Search, Shield, Zap } from "lucide-react"
import { ToolComparison } from "@/components/tool-comparison"
import { ExampleUseCases } from "@/components/example-use-cases"
import { FAQSection } from "@/components/faq-section"
import TextCorrectionForm from "@/components/text-correction-form"
import { motion } from "framer-motion"
// Importar o componente InlineAd
import { InlineAd } from "@/components/inline-ad"

export default function ResourcePageClient() {
  return (
    <>
      <BackgroundGradient />

      <main className="flex min-h-screen flex-col relative pt-20">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto mb-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-gradient">
                  Corretor de Texto Online e Grátis
                </h1>
                <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mb-6">
                  Guia completo sobre ferramentas gratuitas para correção de textos em português
                </p>
              </div>
            </div>

            {/* Formulário de correção de texto */}
            <div className="max-w-4xl mx-auto mb-8">
              <TextCorrectionForm />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-foreground/70 mt-8"
              >
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                  <span>100% Gratuito</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                  <span>Português BR e PT</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                  <span>Análise Detalhada</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Main Content */}
              <div className="md:col-span-2 space-y-10">
                <div className="prose prose-invert max-w-none">
                  <h2 className="text-2xl font-bold tracking-tight text-gradient">
                    O que é um Corretor de Texto Online?
                  </h2>
                  <p>
                    Um <strong>corretor de texto online e grátis</strong> é uma ferramenta digital que analisa textos
                    para identificar e corrigir erros gramaticais, ortográficos, de pontuação e estilo. Diferente dos
                    corretores tradicionais integrados a processadores de texto, as versões online oferecem a vantagem
                    de serem acessíveis de qualquer dispositivo com conexão à internet, sem necessidade de instalação de
                    software.
                  </p>
                  <p>
                    Estas ferramentas utilizam algoritmos avançados e, cada vez mais, inteligência artificial para
                    analisar o contexto das frases e oferecer correções precisas. Para usuários que escrevem em
                    português, seja brasileiro ou europeu, um bom <strong>corretor ortográfico online</strong> é
                    essencial para garantir a qualidade dos textos.
                  </p>

                  <h2 className="text-2xl font-bold tracking-tight text-gradient mt-8">
                    Tipos de Corretores de Texto Online
                  </h2>
                  <p>
                    Existem diversos tipos de corretores disponíveis gratuitamente na internet, cada um com
                    características específicas:
                  </p>

                  <h3>Corretores Ortográficos</h3>
                  <p>
                    Focados principalmente na identificação de palavras escritas incorretamente, os{" "}
                    <strong>corretores ortográficos</strong> comparam o texto com um dicionário interno e sugerem
                    correções para palavras que não são reconhecidas. São ideais para eliminar erros de digitação e
                    palavras com grafia incorreta.
                  </p>

                  <h3>Corretores Gramaticais</h3>
                  <p>
                    Mais avançados, os <strong>corretores gramaticais online</strong> analisam a estrutura das frases
                    para identificar problemas como concordância verbal e nominal, regência, uso inadequado de
                    preposições e conjunções. Estas ferramentas são essenciais para quem busca um texto gramaticalmente
                    correto.
                  </p>

                  <h3>Verificadores de Estilo</h3>
                  <p>
                    Além de corrigir erros, alguns <strong>corretores de texto grátis</strong> também oferecem sugestões
                    de estilo, identificando repetições excessivas, frases muito longas, uso de voz passiva quando a
                    ativa seria mais adequada, e outras questões que afetam a clareza e fluidez do texto.
                  </p>

                  <h3>Corretores com Análise Contextual</h3>
                  <p>
                    As ferramentas mais modernas de <strong>correção de texto online</strong> utilizam inteligência
                    artificial para compreender o contexto das frases, oferecendo correções mais precisas e
                    personalizadas. Estes corretores conseguem identificar erros sutis que dependem do contexto, como o
                    uso incorreto de palavras homônimas.
                  </p>

                  <h2 className="text-2xl font-bold tracking-tight text-gradient mt-8">
                    Benefícios de Usar um Corretor de Texto Online e Grátis
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Acessibilidade</h4>
                        <p className="text-sm text-foreground/80">
                          Disponível em qualquer dispositivo com acesso à internet, sem necessidade de instalação
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Economia</h4>
                        <p className="text-sm text-foreground/80">
                          Ferramentas gratuitas oferecem funcionalidades avançadas sem custo
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Melhoria da escrita</h4>
                        <p className="text-sm text-foreground/80">
                          Feedback imediato ajuda a aprender e evitar erros recorrentes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Economia de tempo</h4>
                        <p className="text-sm text-foreground/80">
                          Correção automática é mais rápida que a revisão manual
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Versatilidade</h4>
                        <p className="text-sm text-foreground/80">
                          Aplicável a diversos tipos de texto, de e-mails a trabalhos acadêmicos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Profissionalismo</h4>
                        <p className="text-sm text-foreground/80">
                          Textos sem erros transmitem credibilidade e competência
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-gradient mt-8">
                    Como Escolher o Melhor Corretor de Texto Online
                  </h2>
                  <p>
                    Com tantas opções disponíveis, escolher o <strong>melhor corretor de texto online e grátis</strong>{" "}
                    pode ser desafiador. Aqui estão alguns critérios importantes a considerar:
                  </p>

                  <ul>
                    <li>
                      <strong>Suporte ao português:</strong> Verifique se a ferramenta oferece suporte completo ao
                      português brasileiro ou europeu, dependendo da sua necessidade.
                    </li>
                    <li>
                      <strong>Precisão das correções:</strong> Teste a ferramenta com textos que contenham erros
                      conhecidos para avaliar a precisão das correções sugeridas.
                    </li>
                    <li>
                      <strong>Interface intuitiva:</strong> Uma boa ferramenta de{" "}
                      <strong>correção de texto grátis</strong> deve ser fácil de usar, com interface clara e
                      funcionalidades bem organizadas.
                    </li>
                    <li>
                      <strong>Recursos adicionais:</strong> Além da correção básica, verifique se a ferramenta oferece
                      recursos como análise de estilo, verificação de plágio ou sugestões de vocabulário.
                    </li>
                    <li>
                      <strong>Privacidade:</strong> Certifique-se de que a ferramenta tem políticas claras sobre o
                      armazenamento e uso dos textos enviados para correção.
                    </li>
                    <li>
                      <strong>Limitações da versão gratuita:</strong> Algumas ferramentas oferecem versões gratuitas com
                      limitações, como número máximo de caracteres ou recursos premium bloqueados.
                    </li>
                  </ul>

                  <h2 className="text-2xl font-bold tracking-tight text-gradient mt-8">
                    Como Usar um Corretor de Texto Online Eficientemente
                  </h2>
                  <p>
                    Para obter o máximo benefício de um <strong>corretor de texto online grátis</strong>, siga estas
                    práticas recomendadas:
                  </p>

                  <ol>
                    <li>
                      <strong>Escreva primeiro, corrija depois:</strong> Concentre-se em expressar suas ideias antes de
                      se preocupar com a correção. Depois, use a ferramenta para revisar o texto.
                    </li>
                    <li>
                      <strong>Revise as sugestões criticamente:</strong> Nem todas as correções sugeridas serão
                      apropriadas. Avalie cada sugestão no contexto do seu texto.
                    </li>
                    <li>
                      <strong>Use múltiplas ferramentas:</strong> Diferentes{" "}
                      <strong>corretores ortográficos online</strong> têm diferentes pontos fortes. Para textos
                      importantes, considere usar mais de uma ferramenta.
                    </li>
                    <li>
                      <strong>Aprenda com os erros:</strong> Preste atenção aos erros recorrentes identificados pelo
                      corretor para melhorar sua escrita a longo prazo.
                    </li>
                    <li>
                      <strong>Faça uma revisão final manual:</strong> Mesmo as melhores ferramentas de{" "}
                      <strong>correção de texto online</strong> podem perder alguns erros ou fazer sugestões
                      inadequadas. Uma revisão final manual é sempre recomendada.
                    </li>
                  </ol>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-8">
                    <h3 className="text-xl font-bold mb-4">Dica Profissional</h3>
                    <p className="italic">
                      "Para textos profissionais ou acadêmicos, recomendo usar um{" "}
                      <strong>corretor de texto online</strong> como primeira etapa de revisão, seguido por uma leitura
                      cuidadosa para verificar questões de coesão, coerência e adequação ao público-alvo, que são
                      aspectos que as ferramentas automáticas ainda têm dificuldade em avaliar completamente."
                    </p>
                    <p className="text-right mt-2 text-foreground/70">— Dra. Ana Silva, Linguista</p>
                  </div>
                </div>

                <div id="comparacao">
                  <h2 className="text-2xl font-bold tracking-tight text-gradient mb-6">
                    Comparação de Corretores de Texto Online e Grátis
                  </h2>
                  <ToolComparison />
                </div>

                <InlineAd format="rectangle" className="my-12" />

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-gradient mb-6">
                    Exemplos de Uso de Corretores de Texto
                  </h2>
                  <ExampleUseCases />
                </div>
              </div>

              {/* Sidebar */}
              <div className="md:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* Table of Contents */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Neste Artigo</h3>
                    <nav className="space-y-2 text-sm">
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors py-1">
                        O que é um Corretor de Texto Online?
                      </a>
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors py-1">
                        Tipos de Corretores de Texto
                      </a>
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors py-1">
                        Benefícios de Usar um Corretor
                      </a>
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors py-1">
                        Como Escolher o Melhor Corretor
                      </a>
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors py-1">
                        Como Usar Eficientemente
                      </a>
                      <a
                        href="#comparacao"
                        className="block text-foreground/80 hover:text-primary transition-colors py-1"
                      >
                        Comparação de Ferramentas
                      </a>
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors py-1">
                        Exemplos de Uso
                      </a>
                      <a href="#faq" className="block text-foreground/80 hover:text-primary transition-colors py-1">
                        Perguntas Frequentes
                      </a>
                    </nav>
                  </div>

                  {/* CTA Box */}
                  <div className="glass-card rounded-xl p-6 border-primary/20">
                    <h3 className="text-lg font-semibold mb-3">Experimente Nosso Corretor</h3>
                    <p className="text-sm text-foreground/80 mb-4">
                      Corrija seus textos em português gratuitamente com nossa ferramenta avançada de correção.
                    </p>
                    <Button className="w-full" asChild>
                      <Link href="/">
                        Corrigir Meu Texto
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {/* Features Box */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Por Que Escolher Nosso Corretor</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <Zap className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Correção inteligente com IA avançada</span>
                      </li>
                      <li className="flex items-start">
                        <Search className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Detecção precisa de erros gramaticais</span>
                      </li>
                      <li className="flex items-start">
                        <Shield className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Privacidade total dos seus textos</span>
                      </li>
                    </ul>
                  </div>

                  {/* Related Articles */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Artigos Relacionados</h3>
                    <ul className="space-y-4">
                      <li>
                        <a href="#" className="block group">
                          <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                            10 Dicas para Melhorar sua Escrita em Português
                          </h4>
                          <p className="text-xs text-foreground/60 mt-1">
                            Aprenda técnicas para aprimorar seu estilo de escrita e evitar erros comuns.
                          </p>
                        </a>
                      </li>
                      <li>
                        <a href="#" className="block group">
                          <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                            Como Escrever E-mails Profissionais Perfeitos
                          </h4>
                          <p className="text-xs text-foreground/60 mt-1">
                            Guia completo para comunicação profissional por e-mail sem erros gramaticais.
                          </p>
                        </a>
                      </li>
                      <li>
                        <a href="#" className="block group">
                          <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                            Erros Gramaticais Mais Comuns em Português
                          </h4>
                          <p className="text-xs text-foreground/60 mt-1">
                            Conheça e aprenda a evitar os erros que mais comprometem a qualidade dos textos.
                          </p>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-12 bg-dots">
          <div className="max-w-[1366px] mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Dúvidas frequentes
              </span>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-gradient">
                Perguntas Frequentes sobre Corretores de Texto
              </h2>
              <p className="text-foreground/80 max-w-[700px] mx-auto">
                Respostas para as dúvidas mais comuns sobre ferramentas de correção de texto online e gratuitas
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <FAQSection />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background z-0"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-3xl mx-auto glass-card rounded-xl p-10 text-center border-white/10 shadow-lg">
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-gradient">
                Comece a Corrigir Seus Textos Agora
              </h2>
              <p className="text-foreground/80 max-w-[700px] mx-auto mb-8">
                Experimente nosso corretor de texto online e gratuito e veja a diferença na qualidade da sua escrita em
                português.
              </p>
              <Button size="lg" className="px-8 h-12 text-base pulse-glow" asChild>
                <Link href="/">
                  Corrigir Meu Texto
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-foreground/60 mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
                <span className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
                  100% gratuito
                </span>
                <span className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
                  Sem cadastro
                </span>
                <span className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
                  Resultados instantâneos
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
