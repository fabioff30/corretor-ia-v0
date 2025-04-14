import type { Metadata } from "next"
import Link from "next/link"
import { BackgroundGradient } from "@/components/background-gradient"
import { Card, CardContent } from "@/components/ui/card"
import { Check, AlertTriangle, Shield, Ban, FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Termos de Uso | CorretorIA",
  description: "Termos de uso do CorretorIA - Conheça as regras e condições para utilização do nosso serviço.",
}

const CHARACTER_LIMIT = 2000

export default function TermsOfServicePage() {
  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-4xl mx-auto py-12 px-4 md:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Termos de Uso</h1>
          <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 mb-8">
                <p className="text-sm text-foreground/80 italic">
                  Ao utilizar o CorretorIA, você concorda com estes termos de uso. Por favor, leia-os atentamente.
                </p>
              </div>

              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p>
                Bem-vindo ao CorretorIA, um serviço online de correção de textos em português. Estes Termos de Uso regem
                o acesso e uso do nosso serviço, incluindo todos os recursos, funcionalidades e conteúdos disponíveis
                através do site corretoria.vercel.app.
              </p>
              <p>
                Ao acessar ou usar o CorretorIA, você concorda em ficar vinculado a estes Termos de Uso. Se você não
                concordar com qualquer parte destes termos, não poderá acessar ou usar o serviço.
              </p>

              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Check className="h-6 w-6 text-green-500 mr-2" />
                Uso Permitido
              </h2>
              <p>Você pode usar o CorretorIA para:</p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Verificar e corrigir erros gramaticais, ortográficos e de estilo em seus textos em português</li>
                <li>Copiar e usar o texto corrigido para seus próprios fins legítimos</li>
                <li>Acessar o serviço gratuitamente dentro dos limites estabelecidos</li>
                <li>Enviar feedback e sugestões para melhorarmos o serviço</li>
              </ul>

              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Ban className="h-6 w-6 text-red-500 mr-2" />
                Uso Proibido
              </h2>
              <p>Você não pode usar o CorretorIA para:</p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Qualquer finalidade ilegal ou que viole leis locais, estaduais, nacionais ou internacionais</li>
                <li>
                  Enviar, transmitir ou fazer upload de conteúdo que:
                  <ul className="list-disc pl-6 mt-2">
                    <li>
                      Seja ilegal, prejudicial, ameaçador, abusivo, difamatório, vulgar ou invasivo à privacidade de
                      terceiros
                    </li>
                    <li>
                      Infrinja direitos autorais, marcas registradas ou outros direitos de propriedade intelectual
                    </li>
                    <li>Contenha vírus, malware, spyware ou qualquer outro código malicioso</li>
                    <li>Seja de natureza pornográfica, obscena ou ofensiva</li>
                  </ul>
                </li>
                <li>Tentar acessar, modificar ou interferir nos nossos sistemas, servidores ou redes</li>
                <li>Realizar engenharia reversa, descompilar ou desmontar qualquer parte do serviço</li>
                <li>
                  Usar o serviço de forma automatizada (bots, scripts, crawlers, etc.) sem nossa autorização expressa
                </li>
                <li>Sobrecarregar intencionalmente o serviço com um volume excessivo de dados ou requisições</li>
                <li>Contornar ou tentar contornar as limitações técnicas ou medidas de segurança do serviço</li>
              </ul>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-1 flex-shrink-0" />
                  <p>
                    <strong>Aviso importante:</strong> O uso abusivo do serviço, incluindo tentativas de contornar
                    limites de uso ou sobrecarregar nossos servidores, pode resultar em bloqueio temporário ou
                    permanente do seu acesso ao CorretorIA.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Shield className="h-6 w-6 text-blue-500 mr-2" />
                Privacidade e Segurança
              </h2>
              <div className="space-y-4 mb-6">
                <p>
                  <strong>Seus textos são seus.</strong> Você mantém todos os direitos sobre os textos que envia para
                  correção. Não reivindicamos propriedade sobre seu conteúdo.
                </p>
                <p>
                  <strong>Processamento temporário.</strong> Para fornecer o serviço de correção, precisamos processar
                  temporariamente os textos que você envia. Após a correção, os textos são automaticamente excluídos dos
                  nossos sistemas ativos.
                </p>
                <p>
                  <strong>Limitações de uso.</strong> Para garantir a disponibilidade e qualidade do serviço para todos
                  os usuários, implementamos as seguintes limitações:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Limite de {CHARACTER_LIMIT} caracteres por correção</li>
                  <li>Limite de requisições por usuário em um determinado período</li>
                  <li>Filtragem de conteúdo potencialmente malicioso ou inadequado</li>
                </ul>
                <p>
                  <strong>Cookies e dados de uso.</strong> Coletamos informações básicas sobre como você usa nosso site
                  para melhorar a experiência e garantir a segurança. Para saber mais, consulte nossa{" "}
                  <Link href="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </div>

              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <FileText className="h-6 w-6 text-purple-500 mr-2" />
                Limitações de Responsabilidade
              </h2>
              <div className="space-y-4 mb-6">
                <p>
                  <strong>Sem garantias.</strong> O CorretorIA é fornecido "como está", sem garantias de qualquer tipo,
                  expressas ou implícitas. Não garantimos que o serviço será ininterrupto, seguro ou livre de erros.
                </p>
                <p>
                  <strong>Precisão das correções.</strong> Embora nos esforcemos para oferecer correções precisas, a
                  tecnologia de IA pode cometer erros. Recomendamos que você sempre revise o texto corrigido antes de
                  usá-lo para fins importantes.
                </p>
                <p>
                  <strong>Limitação de responsabilidade.</strong> Em nenhuma circunstância seremos responsáveis por
                  quaisquer danos diretos, indiretos, incidentais, especiais, punitivos ou consequentes resultantes do
                  uso ou incapacidade de usar o serviço.
                </p>
              </div>

              <h2 className="text-2xl font-semibold mb-4">5. Alterações nos Termos</h2>
              <p>
                Podemos atualizar estes Termos de Uso a qualquer momento, a nosso critério exclusivo. As alterações
                entrarão em vigor imediatamente após a publicação dos termos atualizados nesta página. Ao continuar a
                usar o serviço após as alterações, você concorda com os novos termos.
              </p>
              <p>
                Recomendamos que você revise periodicamente estes Termos de Uso para estar ciente de quaisquer
                alterações.
              </p>

              <h2 className="text-2xl font-semibold mb-4">6. Contato</h2>
              <p>Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:</p>
              <p className="mb-6">
                <strong>Email:</strong>{" "}
                <a href="mailto:contato@corretordetextoonline.com.br" className="text-primary hover:underline">
                  contato@corretordetextoonline.com.br
                </a>
              </p>

              <div className="border-t pt-6 mt-8">
                <p className="text-center text-sm text-muted-foreground">
                  Ao usar o CorretorIA, você confirma que leu, entendeu e concorda com estes Termos de Uso.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-primary hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </>
  )
}
