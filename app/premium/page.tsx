import type { Metadata } from "next"
import { PremiumPlan } from "@/components/premium-plan"
import { BackgroundGradient } from "@/components/background-gradient"
import { DonationTiers } from "@/components/donation-tiers"

// Atualizar os metadados da página premium
export const metadata: Metadata = {
  title: "CorretorIA Premium - Correção de Texto Sem Limites",
  description:
    "Assine o plano premium do CorretorIA e desbloqueie correção de texto sem limites, análise avançada e muito mais.",
}

export default function PremiumPage() {
  return (
    <>
      <BackgroundGradient />
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4 gradient-text">Eleve sua Escrita ao Próximo Nível</h1>
            <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
              Escolha o plano ideal para suas necessidades e desbloqueie todo o potencial do CorretorIA
            </p>
          </div>

          <PremiumPlan />

          <div className="my-16 border-t border-b py-16">
            <DonationTiers />
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Perguntas Frequentes</h2>
            <div className="max-w-3xl mx-auto space-y-6 text-left">
              <div>
                <h3 className="text-lg font-medium mb-2">Qual a diferença entre doação e assinatura premium?</h3>
                <p className="text-foreground/80">
                  As doações são contribuições únicas para apoiar o projeto, com alguns benefícios temporários como
                  agradecimento. A assinatura premium é um serviço recorrente que oferece acesso contínuo a todos os
                  recursos avançados.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Posso cancelar minha assinatura a qualquer momento?</h3>
                <p className="text-foreground/80">
                  Sim, você pode cancelar sua assinatura a qualquer momento pela sua conta. Após o cancelamento, você
                  continuará tendo acesso aos recursos premium até o final do período pago.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Como funciona a garantia de reembolso?</h3>
                <p className="text-foreground/80">
                  Se você não estiver satisfeito com o serviço premium, pode solicitar um reembolso em até 7 dias após a
                  assinatura. Basta entrar em contato conosco por email.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Quais métodos de pagamento são aceitos?</h3>
                <p className="text-foreground/80">
                  Aceitamos cartões de crédito (Visa, Mastercard, American Express) e pagamentos via PIX. Todos os
                  pagamentos são processados com segurança pelo Mercado Pago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
