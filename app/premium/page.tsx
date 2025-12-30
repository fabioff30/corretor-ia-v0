import type { Metadata } from "next"
import Link from "next/link"
import { PremiumPlan } from "@/components/premium-plan"
import { BackgroundGradient } from "@/components/background-gradient"
import { SocialProofStats } from "@/components/social-proof-stats"
import { TestimonialsReal } from "@/components/testimonials-real"
import { RotatingTestimonial } from "@/components/rotating-testimonial"
import { Button } from "@/components/ui/button"
import { Building2, Plug, ShieldCheck, Headset, ArrowRight } from "lucide-react"

// Atualizar os metadados da página premium
export const metadata: Metadata = {
  title: "CorretorIA Premium - Correção de Texto até 20 mil caracteres",
  description:
    "Assine o plano premium do CorretorIA e desbloqueie correções ilimitadas com até 20 mil caracteres por texto, análise avançada e muito mais.",
}

export default function PremiumPage() {
  return (
    <>
      <BackgroundGradient />
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4 gradient-text">Escreva Mais com CorretorIA Premium</h1>
            <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
              Correções, análises e reescritas ilimitadas com até 20 mil caracteres por texto.
              Histórico completo, análise avançada de IA e sem anúncios. Melhore sua escrita profissionalmente.
            </p>
          </div>

          {/* Social Proof Statistics - Desktop Only */}
          <div className="mb-8 hidden md:block">
            <SocialProofStats />
          </div>

          <PremiumPlan />

          {/* Rotating Testimonial */}
          <div className="mt-8">
            <RotatingTestimonial />
          </div>

          {/* Testimonials from Real Users */}
          <div className="mt-8">
            <TestimonialsReal />
          </div>

          <section className="mt-16 rounded-3xl border border-primary/15 bg-primary/5 p-8 sm:p-12 shadow-sm">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                  <Building2 className="h-4 w-4" />
                  Empresas
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight">API e integrações sob medida</h2>
                <p className="mt-4 text-lg text-foreground/80">
                  Conecte o CorretorIA ao seu fluxo de trabalho com uma infraestrutura pensada para escalar produção de
                  conteúdo, revisar textos em larga escala e oferecer correções automatizadas dentro das suas plataformas.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-foreground/80">
                  <li className="flex items-start gap-2">
                    <Plug className="mt-0.5 h-4 w-4 text-primary" />
                    Integração com CRMs, ERPs, LMS e fluxos internos via API segura e documentada.
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    SLA dedicado, logs de auditoria e opções de processamento em ambiente isolado.
                  </li>
                  <li className="flex items-start gap-2">
                    <Headset className="mt-0.5 h-4 w-4 text-primary" />
                    Time técnico respondendo em até 24 horas úteis para ajustes, onboarding e suporte contínuo.
                  </li>
                </ul>
              </div>
              <div className="space-y-6">
                <div className="rounded-2xl border border-primary/10 bg-background p-6 shadow-sm">
                  <h3 className="text-lg font-semibold">Casos de uso que aceleramos</h3>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li>• Revisão automatizada de artigos, provas e materiais educacionais.</li>
                    <li>• Geração de relatórios de qualidade de escrita em fluxos editoriais.</li>
                    <li>• Avaliação de conteúdo UGC em marketplaces e plataformas de carreira.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-primary/10 bg-background p-6 shadow-sm">
                  <h3 className="text-lg font-semibold">Como funciona</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Definimos volume, endpoints e autenticação em conjunto com seu time. Entregamos um ambiente de
                    homologação, monitoramento contínuo e treinamentos para a sua equipe.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
              >
                <Link href="/contato?assunto=empresas">
                  Fale com o time comercial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:contato@corretordetextoonline.com.br">Enviar email para o suporte</a>
              </Button>
            </div>
          </section>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Perguntas Frequentes</h2>
            <div className="max-w-3xl mx-auto space-y-6 text-left">
              <div>
                <h3 className="text-lg font-medium mb-2">Qual a diferença entre o plano gratuito e o premium?</h3>
                <p className="text-foreground/80">
                  O plano gratuito oferece correcoes, analises de IA e reescrita com limites diarios (1.000 caracteres por texto). O plano
                  premium oferece correcoes, analises e reescritas ilimitadas com ate 20.000 caracteres por texto, processamento prioritario,
                  historico automatico em "Meus textos" e acesso a recursos avancados. Em breve, tambem teremos a opcao de caracteres ilimitados.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">O que está incluso no painel “Meus textos”?</h3>
                <p className="text-foreground/80">
                  Usuários Premium têm acesso a uma página dedicada dentro do dashboard com todas as correções, reescritas e
                  análises realizadas. É possível filtrar por data, tipo de operação, buscar por palavras-chave, visualizar
                  comparativos e exportar resultados com um clique.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Existe um plano para empresas?</h3>
                <p className="text-foreground/80">
                  Sim. O plano Empresas disponibiliza API dedicada, integrações personalizadas e suporte técnico com SLA.
                  Nossa equipe ajuda a configurar endpoints, credenciais e monitoramento de uso conforme a necessidade do
                  seu time.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Posso cancelar minha assinatura a qualquer momento?</h3>
                <p className="text-foreground/80">
                  Sim, você poderá cancelar sua assinatura a qualquer momento. Após o cancelamento, você continuará tendo
                  acesso aos recursos premium até o final do período pago.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Quais métodos de pagamento serão aceitos?</h3>
                <p className="text-foreground/80">
                  Aceitaremos cartões de crédito (Visa, Mastercard, American Express) e pagamentos via PIX. Todos os
                  pagamentos serão processados com segurança.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
