import type { Metadata } from "next"
import Link from "next/link"
import { BackgroundGradient } from "@/components/background-gradient"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, DollarSign, BarChart, Target, Cookie } from "lucide-react"

export const metadata: Metadata = {
  title: "Política de Cookies | CorretorIA",
  description:
    "Política de cookies do CorretorIA - Saiba como utilizamos cookies para análise e publicidade para manter nosso serviço gratuito.",
}

export default function CookiesPolicyPage() {
  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-4xl mx-auto py-12 px-4 md:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Política de Cookies</h1>
          <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {/* Seção de destaque sobre a importância dos cookies para o projeto */}
              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20 mb-8">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <DollarSign className="h-5 w-5 text-primary mr-2" />
                  Como mantemos o CorretorIA gratuito
                </h3>
                <p className="mb-2">
                  O CorretorIA é um serviço gratuito que depende de receitas de publicidade e análise de dados para se
                  manter operacional. Ao permitir cookies de análise e publicidade, você nos ajuda a:
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Cobrir os custos de servidores e infraestrutura</li>
                  <li>Continuar desenvolvendo e melhorando o serviço</li>
                  <li>Manter o acesso gratuito para todos os usuários</li>
                  <li>Investir em tecnologias mais avançadas de correção de texto</li>
                </ul>
                <p className="text-sm italic">
                  Seu consentimento para o uso desses cookies é fundamental para a sustentabilidade do projeto e nos
                  permite continuar oferecendo este serviço sem cobrar dos usuários.
                </p>
              </div>

              <h2 className="text-2xl font-semibold mb-4">1. O que são Cookies</h2>
              <p>
                Cookies são pequenos arquivos de texto que são armazenados em seu computador ou dispositivo móvel quando
                você visita um site. Eles são amplamente utilizados para fazer os sites funcionarem de maneira mais
                eficiente, bem como fornecer informações aos proprietários do site.
              </p>
              <p>
                Os cookies permitem que um site reconheça seu dispositivo e lembre-se de informações sobre sua visita,
                como suas preferências de idioma, tamanho de fonte e outras configurações de exibição.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8 flex items-center">
                <BarChart className="h-6 w-6 text-primary mr-2" />
                2. Cookies de Análise
              </h2>
              <p>
                Os cookies de análise nos ajudam a entender como os visitantes interagem com nosso site, coletando e
                relatando informações de forma anônima. Esses dados são essenciais para:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Identificar quais páginas são mais úteis para os usuários</li>
                <li>Detectar problemas de usabilidade que precisam ser corrigidos</li>
                <li>Entender como os usuários encontram nosso site</li>
                <li>Medir a eficácia de nossas melhorias</li>
                <li>Otimizar a experiência do usuário com base em dados reais</li>
              </ul>
              <p>
                Utilizamos principalmente o Google Analytics para coletar esses dados. Sem essas informações, seria
                muito difícil melhorar nosso serviço de forma eficiente, o que poderia comprometer a qualidade e a
                gratuidade do CorretorIA.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8 flex items-center">
                <Target className="h-6 w-6 text-primary mr-2" />
                3. Cookies de Publicidade
              </h2>
              <p>
                Os cookies de publicidade nos permitem exibir anúncios mais relevantes para você, o que aumenta a
                eficácia da publicidade e, consequentemente, nossa receita. Esses cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Ajudam a evitar que você veja os mesmos anúncios repetidamente</li>
                <li>Garantem que os anúncios sejam exibidos corretamente</li>
                <li>Medem o desempenho das campanhas publicitárias</li>
                <li>Personalizam os anúncios com base em seus interesses</li>
              </ul>
              <p>
                Trabalhamos com parceiros de publicidade como Google AdSense e outros serviços de publicidade
                programática. A receita gerada por esses anúncios é a principal fonte de financiamento do CorretorIA,
                permitindo que continuemos oferecendo nossos serviços gratuitamente.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Importante:</strong> Sem receita publicitária, seria necessário implementar um modelo de
                    assinatura paga ou limitar significativamente as funcionalidades disponíveis gratuitamente.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold mb-4 mt-8">4. Cookies Essenciais</h2>
              <p>
                Além dos cookies de análise e publicidade, utilizamos cookies essenciais que são necessários para o
                funcionamento básico do site. Estes cookies permitem funcionalidades como:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Lembrar suas preferências de tema (claro/escuro)</li>
                <li>Manter sua sessão ativa enquanto você usa o serviço</li>
                <li>Garantir a segurança do site</li>
                <li>Armazenar temporariamente suas preferências de consentimento de cookies</li>
              </ul>
              <p>
                Os cookies essenciais não podem ser desativados, pois são necessários para o funcionamento básico do
                site.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">5. Nossos Parceiros</h2>
              <p>Trabalhamos com os seguintes parceiros para análise de dados e publicidade:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>Google Analytics:</strong> Para análise de tráfego e comportamento do usuário
                </li>
                <li>
                  <strong>Google AdSense/Google Ads:</strong> Para exibição de anúncios relevantes
                </li>
                <li>
                  <strong>Google Tag Manager:</strong> Para gerenciar tags de JavaScript em nosso site
                </li>
                <li>
                  <strong>Facebook Pixel:</strong> Para medir a eficácia de anúncios e entender as ações dos usuários
                </li>
              </ul>
              <p>
                Cada um desses parceiros tem sua própria política de privacidade e práticas de coleta de dados.
                Recomendamos que você consulte as políticas deles para mais informações.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">6. Gerenciamento de Cookies</h2>
              <p>
                Você tem o direito de decidir se aceita ou recusa cookies. Quando você visita nosso site pela primeira
                vez, apresentamos um banner de cookies que permite que você escolha quais tipos de cookies deseja
                aceitar.
              </p>
              <p>
                Você também pode gerenciar cookies através das configurações do seu navegador. A maioria dos navegadores
                permite que você recuse todos os cookies, aceite apenas cookies de determinados sites, ou seja
                notificado quando um cookie está sendo enviado. No entanto, recusar cookies pode impedir que algumas
                partes do nosso site funcionem corretamente.
              </p>
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 my-4">
                <div className="flex items-start">
                  <Cookie className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Lembre-se:</strong> Ao aceitar cookies de análise e publicidade, você está contribuindo
                    diretamente para a sustentabilidade do CorretorIA e nos ajudando a manter o serviço gratuito para
                    todos.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold mb-4 mt-8">7. Cookies Específicos que Utilizamos</h2>
              <p>A seguir está uma lista dos principais cookies que utilizamos:</p>
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Cookie</th>
                    <th className="text-left py-2 px-4">Tipo</th>
                    <th className="text-left py-2 px-4">Propósito</th>
                    <th className="text-left py-2 px-4">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4">_ga</td>
                    <td className="py-2 px-4">Analítico</td>
                    <td className="py-2 px-4">Usado pelo Google Analytics para distinguir usuários</td>
                    <td className="py-2 px-4">2 anos</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">_gid</td>
                    <td className="py-2 px-4">Analítico</td>
                    <td className="py-2 px-4">Usado pelo Google Analytics para distinguir usuários</td>
                    <td className="py-2 px-4">24 horas</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">_gat</td>
                    <td className="py-2 px-4">Analítico</td>
                    <td className="py-2 px-4">Usado pelo Google Analytics para limitar a taxa de solicitações</td>
                    <td className="py-2 px-4">1 minuto</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">_fbp</td>
                    <td className="py-2 px-4">Publicidade</td>
                    <td className="py-2 px-4">
                      Usado pelo Facebook para rastrear visitas em sites com pixel do Facebook
                    </td>
                    <td className="py-2 px-4">3 meses</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">IDE</td>
                    <td className="py-2 px-4">Publicidade</td>
                    <td className="py-2 px-4">
                      Usado pelo Google DoubleClick para registrar e relatar ações do usuário
                    </td>
                    <td className="py-2 px-4">1 ano</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">next-theme</td>
                    <td className="py-2 px-4">Essencial</td>
                    <td className="py-2 px-4">Armazena a preferência de tema (claro/escuro) do usuário</td>
                    <td className="py-2 px-4">1 ano</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">cookie-consent</td>
                    <td className="py-2 px-4">Essencial</td>
                    <td className="py-2 px-4">Armazena suas preferências de consentimento de cookies</td>
                    <td className="py-2 px-4">1 ano</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-2xl font-semibold mb-4 mt-8">8. Alterações em Nossa Política de Cookies</h2>
              <p>
                Podemos atualizar nossa Política de Cookies de tempos em tempos. Quaisquer alterações serão publicadas
                nesta página e, se as alterações forem significativas, forneceremos um aviso mais proeminente.
              </p>
              <p>
                Recomendamos que você revise esta política periodicamente para quaisquer alterações. Alterações nesta
                Política de Cookies são efetivas quando publicadas nesta página.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">9. Contato</h2>
              <p>Se você tiver dúvidas ou preocupações sobre nossa Política de Cookies, entre em contato conosco:</p>
              <p className="mb-6">
                <strong>Email:</strong>{" "}
                <a href="mailto:contato@corretordetextoonline.com.br" className="text-primary hover:underline">
                  contato@corretordetextoonline.com.br
                </a>
              </p>

              <div className="border-t pt-6 mt-8">
                <p className="text-center text-sm text-muted-foreground">
                  Agradecemos sua compreensão e apoio ao aceitar cookies que nos ajudam a manter o CorretorIA gratuito
                  para todos.
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
