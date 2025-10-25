import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  GraduationCap,
  PenTool,
  Users,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Globe,
  Building,
  UserCheck
} from "lucide-react"

const audienceData = [
  {
    title: "Estudantes e Acadêmicos",
    icon: GraduationCap,
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    badge: "Educação",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    description: "Transforme suas pesquisas e trabalhos acadêmicos com precisão",
    useCases: [
      "Reescrever resumos e abstracts em estilo acadêmico",
      "Adaptar textos científicos para apresentações",
      "Simplificar conceitos complexos para estudo",
      "Formalizar anotações pessoais para trabalhos",
      "Criar diferentes versões de conclusões"
    ],
    benefits: [
      "Evita repetições em trabalhos longos",
      "Melhora a qualidade da escrita acadêmica",
      "Economiza tempo na redação",
      "Diversifica o vocabulário utilizado"
    ]
  },
  {
    title: "Profissionais e Empresários",
    icon: Briefcase,
    color: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    badge: "Negócios",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    description: "Aprimore sua comunicação corporativa e documentos profissionais",
    useCases: [
      "Formalizar e-mails para clientes importantes",
      "Adaptar propostas comerciais para diferentes públicos",
      "Reescrever relatórios em linguagem executiva",
      "Humanizar comunicados internos",
      "Criar versões criativas de materiais de marketing"
    ],
    benefits: [
      "Comunicação mais eficaz com clientes",
      "Padronização da linguagem corporativa",
      "Adaptação para diferentes stakeholders",
      "Economia de tempo em redação"
    ]
  },
  {
    title: "Criadores de Conteúdo",
    icon: PenTool,
    color: "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
    badge: "Criativo",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    description: "Diversifique seu conteúdo e alcance novos públicos",
    useCases: [
      "Reescrever posts para diferentes redes sociais",
      "Adaptar artigos para blogs e newsletters",
      "Criar múltiplas versões de copy publicitário",
      "Simplificar conteúdo técnico para audiências gerais",
      "Transformar textos formais em conteúdo envolvente"
    ],
    benefits: [
      "Maior engajamento nas redes sociais",
      "Conteúdo adaptado para cada plataforma",
      "Vocabulário diversificado e criativo",
      "Otimização para diferentes públicos"
    ]
  },
  {
    title: "Educadores e Professores",
    icon: Users,
    color: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-400",
    badge: "Educação",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    description: "Crie materiais didáticos adaptados para cada nível de ensino",
    useCases: [
      "Simplificar textos acadêmicos para alunos",
      "Adaptar conteúdo para diferentes faixas etárias",
      "Criar exercícios com linguagem variada",
      "Reescrever explicações em estilo mais acessível",
      "Formalizar anotações para material didático"
    ],
    benefits: [
      "Material mais acessível aos alunos",
      "Adaptação para diferentes níveis",
      "Maior clareza nas explicações",
      "Economia de tempo na preparação"
    ]
  },
  {
    title: "Escritores e Jornalistas",
    icon: BookOpen,
    color: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
    badge: "Editorial",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    description: "Explore diferentes estilos narrativos e tonalidades",
    useCases: [
      "Reescrever notícias em diferentes tons jornalísticos",
      "Adaptar textos para diferentes veículos de imprensa",
      "Criar versões mais ou menos formais de artigos",
      "Experimentar estilos narrativos variados",
      "Simplificar reportagens para público geral"
    ],
    benefits: [
      "Versatilidade na escrita jornalística",
      "Adaptação para diferentes públicos",
      "Exploração de estilos narrativos",
      "Maior alcance das publicações"
    ]
  },
  {
    title: "Profissionais de Marketing",
    icon: TrendingUp,
    color: "bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800",
    iconColor: "text-pink-600 dark:text-pink-400",
    badge: "Marketing",
    badgeColor: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    description: "Otimize suas campanhas com textos persuasivos e envolventes",
    useCases: [
      "Criar múltiplas versões de copy para testes A/B",
      "Adaptar campanhas para diferentes personas",
      "Reescrever textos formais em linguagem persuasiva",
      "Humanizar comunicações automatizadas",
      "Diversificar call-to-actions e títulos"
    ],
    benefits: [
      "Maior taxa de conversão",
      "Testes mais eficazes de conteúdo",
      "Personalização para diferentes públicos",
      "Otimização de campanhas digitais"
    ]
  }
]

export function UseCasesByAudience() {
  return (
    <section className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Casos de Uso por Público</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Descubra como profissionais de diferentes áreas usam nossa ferramenta de reescrita
          para otimizar sua comunicação e aumentar sua produtividade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {audienceData.map((audience, index) => {
          const Icon = audience.icon
          return (
            <Card key={index} className={`transition-all duration-300 hover:shadow-lg ${audience.color}`}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <Icon className={`h-6 w-6 ${audience.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{audience.title}</CardTitle>
                    <Badge className={audience.badgeColor}>{audience.badge}</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground">{audience.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Principais Usos:
                  </h4>
                  <ul className="space-y-2">
                    {audience.useCases.map((useCase, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0" />
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Benefícios Específicos:
                  </h4>
                  <ul className="space-y-2">
                    {audience.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0" />
                        <span className="font-medium">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <Card className="inline-block p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            <div className="text-left">
              <h3 className="font-bold text-lg">Mais de 50.000 profissionais</h3>
              <p className="text-muted-foreground">já confiam em nossa tecnologia de reescrita</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}