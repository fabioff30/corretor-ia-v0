"use client"
import { sendGTMEvent } from "@/utils/gtm-helper"
import Link from "next/link"
import { BackgroundGradient } from "@/components/background-gradient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Zap, Shield, Heart, Star, Crown } from "lucide-react"
import { AboutAuthorSection } from "@/components/about-author-section"

export default function AboutPageClient() {
  return (
    <>
      <BackgroundGradient />
      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-gradient">
                Sobre o CorretorIA
              </h1>
              <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl">
                Nossa missão é democratizar o acesso à comunicação escrita de qualidade em português
              </p>
            </div>
          </div>
        </section>

        {/* About CorretorIA Section */}
        <section className="w-full py-12 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-6 text-gradient">O que é o CorretorIA?</h2>
                <div className="space-y-4 text-foreground/80">
                  <p>
                    O CorretorIA é uma ferramenta online gratuita que utiliza inteligência artificial para corrigir
                    textos em português, identificando e corrigindo erros de gramática, ortografia, pontuação e estilo.
                  </p>
                  <p>
                    Desenvolvido com foco na língua portuguesa (tanto na variante brasileira quanto na europeia), o
                    CorretorIA vai além da simples correção ortográfica: ele analisa o contexto das frases, sugere
                    melhorias de estilo e oferece uma avaliação detalhada do texto.
                  </p>
                  <p>
                    Nossa ferramenta nasceu da percepção de que muitas pessoas têm ótimas ideias, mas enfrentam
                    dificuldades na hora de expressá-las por escrito. Acreditamos que a tecnologia pode e deve ser uma
                    aliada para derrubar essas barreiras.
                  </p>
                </div>
                <div className="mt-8">
                  <Button asChild>
                    <Link href="/">Experimentar agora</Link>
                  </Button>
                </div>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-4">Nossos diferenciais</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Foco exclusivo na língua portuguesa</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Análise contextual avançada</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Comparação visual entre o texto original e o corrigido</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Avaliação detalhada com pontos fortes e fracos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Sugestões de melhoria personalizadas</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>100% gratuito e sem necessidade de cadastro</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* About Author Section */}
        <AboutAuthorSection />

        {/* Plans Section */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-gradient">Nossos Planos</h2>
              <p className="text-foreground/80 max-w-[700px] mx-auto">
                Escolha a melhor forma de apoiar o CorretorIA e desbloqueie recursos exclusivos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Free Plan */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center mb-2">
                    <CardTitle className="text-xl">Gratuito</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <CardDescription>Acesso básico para todos</CardDescription>
                  <div className="mt-2 text-2xl font-bold">R$0</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Correção gramatical e ortográfica</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Comparação visual</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Avaliação básica do texto</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Limite de 1.500 caracteres</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/">Começar agora</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Supporter Plan */}
              <Card className="border-primary shadow-md">
                <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-lg">
                  <div className="flex justify-between items-center mb-2">
                    <CardTitle className="text-xl">Apoiador</CardTitle>
                    <div className="p-2 bg-white/20 rounded-full">
                      <Heart className="h-5 w-5" />
                    </div>
                  </div>
                  <CardDescription className="text-white/90">Apoie o projeto</CardDescription>
                  <div className="mt-2 text-2xl font-bold">R$10+</div>
                  <div className="text-sm mt-1 text-white/80">Doação única</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Tudo do plano gratuito</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Sem anúncios por 1 mês</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Limite de 2.000 caracteres</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Nome na lista de apoiadores</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link
                      href="/apoiar"
                      onClick={() => {
                        sendGTMEvent("donation_click", {
                          location: "about_page",
                          element_type: "bronze_tier_button",
                          section: "pricing_plans",
                        })
                      }}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Apoiar agora
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Premium Plan */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center mb-2">
                    <CardTitle className="text-xl">Premium</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <CardDescription>Acesso completo</CardDescription>
                  <div className="mt-2 text-2xl font-bold">R$9,90</div>
                  <div className="text-sm mt-1 text-muted-foreground">por mês</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Tudo do plano apoiador</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Sem anúncios permanentemente</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Sem limite de caracteres</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Análise de estilo avançada</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Prioridade no processamento</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link
                      href="/apoiar"
                      onClick={() => {
                        sendGTMEvent("donation_click", {
                          location: "about_page",
                          element_type: "premium_tier_button",
                          section: "pricing_plans",
                        })
                      }}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Assinar agora
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="w-full py-12 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-gradient">Nossa Missão</h2>
              <div className="space-y-4 text-foreground/80">
                <p className="text-lg">
                  Acreditamos que a comunicação escrita de qualidade não deve ser um privilégio, mas um direito de
                  todos.
                </p>
                <p>
                  Nossa missão é democratizar o acesso a ferramentas que ajudem as pessoas a se expressarem melhor em
                  português, independentemente de sua formação acadêmica ou recursos financeiros.
                </p>
                <p>
                  Queremos que cada estudante, profissional, empreendedor ou qualquer pessoa que precise se comunicar
                  por escrito possa fazê-lo com confiança e clareza, sem que erros gramaticais ou ortográficos sejam uma
                  barreira.
                </p>
                <p>
                  Com o CorretorIA, estamos construindo uma ponte entre a tecnologia avançada de inteligência artificial
                  e a necessidade humana básica de comunicação eficaz.
                </p>
              </div>
              <div className="mt-8">
                <Button asChild>
                  <Link
                    href="/apoiar"
                    onClick={() => {
                      sendGTMEvent("donation_click", {
                        location: "about_page",
                        element_type: "mission_button",
                        section: "mission_section",
                      })
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Apoie nossa missão
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
