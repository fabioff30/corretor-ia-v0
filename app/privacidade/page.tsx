import type { Metadata } from "next"
import Link from "next/link"
import { BackgroundGradient } from "@/components/background-gradient"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Política de Privacidade | CorretorIA",
  description: "Política de privacidade do CorretorIA - Saiba como tratamos seus dados e protegemos sua privacidade.",
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-4xl mx-auto py-12 px-4 md:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p>
                Bem-vindo à Política de Privacidade do CorretorIA. Respeitamos sua privacidade e estamos comprometidos
                em proteger seus dados pessoais. Esta política de privacidade informará como cuidamos de seus dados
                pessoais quando você visita nosso site e informa sobre seus direitos de privacidade e como a lei o
                protege.
              </p>
              <p>
                Nosso serviço de correção de texto online foi projetado com sua privacidade em mente. Entendemos a
                natureza sensível dos textos que você pode enviar para correção e tratamos essas informações com o
                máximo cuidado e confidencialidade.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">2. Dados que Coletamos</h2>
              <p>
                Quando você utiliza nosso serviço de correção de texto, podemos coletar os seguintes tipos de dados:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>Textos enviados para correção:</strong> O conteúdo que você submete para ser corrigido por
                  nossa ferramenta.
                </li>
                <li>
                  <strong>Dados de uso:</strong> Informações sobre como você interage com nosso site, incluindo páginas
                  visitadas, tempo gasto no site e padrões de navegação.
                </li>
                <li>
                  <strong>Informações técnicas:</strong> Endereço IP, tipo de navegador, dispositivo utilizado, sistema
                  operacional e outras tecnologias nos dispositivos que você usa para acessar nosso site.
                </li>
                <li>
                  <strong>Cookies e tecnologias similares:</strong> Informações coletadas automaticamente através de
                  cookies e tecnologias semelhantes.
                </li>
              </ul>
              <p>
                <strong>Importante:</strong> Não coletamos informações pessoais identificáveis, como nome, endereço ou
                número de telefone, a menos que você as forneça voluntariamente ao entrar em contato conosco.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">3. Como Usamos Seus Dados</h2>
              <p>Utilizamos os dados coletados para os seguintes propósitos:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>Fornecer nosso serviço:</strong> Processar e corrigir os textos que você envia.
                </li>
                <li>
                  <strong>Melhorar nosso serviço:</strong> Analisar padrões de uso para aprimorar a funcionalidade e a
                  precisão de nossa ferramenta de correção.
                </li>
                <li>
                  <strong>Personalizar sua experiência:</strong> Adaptar nosso site e conteúdo às suas preferências.
                </li>
                <li>
                  <strong>Comunicação:</strong> Responder às suas solicitações ou perguntas quando você entra em contato
                  conosco.
                </li>
                <li>
                  <strong>Análise e pesquisa:</strong> Conduzir pesquisas para melhorar nossos serviços.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mb-4 mt-8">4. Retenção e Exclusão de Dados</h2>
              <p>
                <strong>Textos enviados para correção:</strong> Os textos que você envia para correção são processados
                em tempo real e não são armazenados permanentemente em nossos servidores. Após a conclusão da correção e
                a exibição dos resultados, os textos são automaticamente excluídos de nossos sistemas ativos.
              </p>
              <p>
                <strong>Dados de uso e técnicos:</strong> Mantemos esses dados por um período limitado (geralmente não
                mais que 90 dias) para fins de análise e melhoria do serviço, após o qual são anonimizados ou excluídos.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">5. Compartilhamento de Dados</h2>
              <p>
                Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.
                Podemos compartilhar dados nas seguintes circunstâncias:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>Provedores de serviços:</strong> Podemos compartilhar dados com terceiros que nos auxiliam na
                  operação de nosso site e serviços (como provedores de hospedagem, análise e processamento de
                  pagamentos).
                </li>
                <li>
                  <strong>Requisitos legais:</strong> Podemos divulgar seus dados quando exigido por lei ou em resposta
                  a processos legais válidos.
                </li>
                <li>
                  <strong>Proteção de direitos:</strong> Podemos divulgar dados para proteger nossos direitos,
                  privacidade, segurança ou propriedade, ou os de nossos usuários ou outros.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mb-4 mt-8">6. Cookies e Tecnologias Semelhantes</h2>
              <p>
                Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência em nosso site, entender como
                você interage com nosso conteúdo e oferecer funcionalidades personalizadas.
              </p>
              <p>
                Você pode configurar seu navegador para recusar todos ou alguns cookies, ou para alertá-lo quando os
                sites definem ou acessam cookies. Se você desativar ou recusar cookies, observe que algumas partes deste
                site podem se tornar inacessíveis ou não funcionar adequadamente.
              </p>
              <p>
                Para mais informações sobre os cookies que utilizamos, consulte nossa{" "}
                <Link href="/cookies" className="text-primary hover:underline">
                  Política de Cookies
                </Link>
                .
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">7. Segurança de Dados</h2>
              <p>
                Implementamos medidas de segurança apropriadas para proteger seus dados contra perda, acesso, alteração
                ou divulgação não autorizados. Essas medidas incluem:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Criptografia de dados em trânsito usando SSL/TLS</li>
                <li>Acesso restrito a dados pessoais apenas a funcionários autorizados</li>
                <li>Monitoramento regular de nossos sistemas para possíveis vulnerabilidades</li>
                <li>Avaliações periódicas de segurança e testes de penetração</li>
              </ul>
              <p>
                No entanto, nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100%
                seguro. Embora nos esforcemos para usar meios comercialmente aceitáveis para proteger seus dados
                pessoais, não podemos garantir sua segurança absoluta.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">8. Seus Direitos de Privacidade</h2>
              <p>
                Dependendo da sua localização, você pode ter os seguintes direitos em relação aos seus dados pessoais:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Direito de acesso aos seus dados pessoais</li>
                <li>Direito de retificação de dados imprecisos</li>
                <li>Direito de exclusão de seus dados pessoais</li>
                <li>Direito de restringir o processamento de seus dados</li>
                <li>Direito à portabilidade de dados</li>
                <li>Direito de se opor ao processamento de seus dados</li>
                <li>Direito de retirar o consentimento a qualquer momento</li>
              </ul>
              <p>
                Para exercer qualquer um desses direitos, entre em contato conosco através do email:{" "}
                <a href="mailto:contato@corretordetextoonline.com.br" className="text-primary hover:underline">
                  contato@corretordetextoonline.com.br
                </a>
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">9. Alterações nesta Política de Privacidade</h2>
              <p>
                Podemos atualizar nossa Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer
                alterações publicando a nova Política de Privacidade nesta página e, se as alterações forem
                significativas, forneceremos um aviso mais proeminente.
              </p>
              <p>
                Recomendamos que você revise esta Política de Privacidade periodicamente para quaisquer alterações.
                Alterações nesta Política de Privacidade são efetivas quando publicadas nesta página.
              </p>

              <h2 className="text-2xl font-semibold mb-4 mt-8">10. Contato</h2>
              <p>
                Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade ou nossas práticas de dados,
                entre em contato conosco:
              </p>
              <p className="mb-6">
                <strong>Email:</strong>{" "}
                <a href="mailto:contato@corretordetextoonline.com.br" className="text-primary hover:underline">
                  contato@corretordetextoonline.com.br
                </a>
              </p>
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
