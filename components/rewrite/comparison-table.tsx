import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  X,
  Star,
  Clock,
  Target,
  Zap
} from "lucide-react"

const comparisonData = {
  features: [
    "Mantém significado original",
    "Corrige erros gramaticais",
    "Adapta vocabulário",
    "Ajusta tom e estilo",
    "Preserva informações técnicas",
    "Melhora fluidez da leitura",
    "Evita repetições",
    "Otimiza estrutura das frases"
  ],
  methods: [
    {
      name: "CorretorIA",
      type: "IA Avançada",
      color: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
      badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      icon: Zap,
      features: [true, true, true, true, true, true, true, true],
      pros: [
        "Reescrita instantânea em segundos",
        "5 estilos diferentes disponíveis",
        "Mantém 100% do significado original",
        "Corrige erros automaticamente"
      ],
      time: "10-30 segundos",
      quality: "Alta",
      cost: "Gratuito + Premium"
    },
    {
      name: "Reescrita Manual",
      type: "Humana",
      color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      icon: Target,
      features: [true, true, true, true, true, true, false, true],
      pros: [
        "Controle total sobre o resultado",
        "Adaptação específica ao contexto",
        "Criatividade ilimitada",
        "Conhecimento do assunto"
      ],
      time: "30-60 minutos",
      quality: "Variável",
      cost: "Tempo pessoal"
    },
    {
      name: "Ferramentas Básicas",
      type: "Sinônimos",
      color: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
      badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      icon: Clock,
      features: [false, false, true, false, false, false, true, false],
      pros: [
        "Processo relativamente rápido",
        "Controle palavra por palavra",
        "Não depende de internet",
        "Sem limite de uso"
      ],
      time: "15-45 minutos",
      quality: "Baixa a Média",
      cost: "Gratuito"
    }
  ]
}

export function ComparisonTable() {
  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Comparação de Métodos de Reescrita</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Veja por que nossa ferramenta de IA é superior aos métodos tradicionais de reescrita,
          oferecendo qualidade profissional em uma fração do tempo.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {comparisonData.methods.map((method, index) => {
              const Icon = method.icon
              return (
                <Card key={index} className={`${method.color} relative`}>
                  {index === 0 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Recomendado
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm w-fit mb-3">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{method.name}</CardTitle>
                    <Badge className={method.badge}>{method.type}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tempo:</span>
                        <span className="font-medium">{method.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Qualidade:</span>
                        <span className="font-medium">{method.quality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Custo:</span>
                        <span className="font-medium">{method.cost}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Features Comparison */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center">Comparação de Recursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 font-medium text-sm border-b pb-4">
                  <div>Recurso</div>
                  <div className="text-center">CorretorIA</div>
                  <div className="text-center">Manual</div>
                  <div className="text-center">Ferramentas Básicas</div>
                </div>

                {comparisonData.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="grid grid-cols-4 gap-4 items-center py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-sm font-medium">{feature}</div>
                    {comparisonData.methods.map((method, methodIndex) => (
                      <div key={methodIndex} className="text-center">
                        {method.features[featureIndex] ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pros for each method */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparisonData.methods.map((method, index) => (
              <Card key={index} className={method.color}>
                <CardHeader>
                  <CardTitle className="text-lg">Vantagens - {method.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {method.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Card className="inline-block p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <h3 className="font-bold text-lg mb-2">Por que escolher CorretorIA?</h3>
          <p className="text-muted-foreground max-w-2xl">
            Combine a rapidez da tecnologia com a qualidade profissional.
            Nossa IA oferece resultados consistentes, economizando até 95% do seu tempo
            comparado à reescrita manual tradicional.
          </p>
        </Card>
      </div>
    </section>
  )
}