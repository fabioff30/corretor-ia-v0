import { CheckCircle, FileText, GitCompare, Lightbulb } from "lucide-react"

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Recursos Principais</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Nossa ferramenta oferece tudo o que você precisa para aprimorar seus textos em português
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <CheckCircle className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Correção Inteligente</h3>
            <p className="text-center text-muted-foreground">
              Identifica e corrige erros de gramática, ortografia e pontuação automaticamente
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <GitCompare className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Comparação Visual</h3>
            <p className="text-center text-muted-foreground">
              Visualize as diferenças entre o texto original e o corrigido com destaque colorido
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <Lightbulb className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Sugestões de Melhoria</h3>
            <p className="text-center text-muted-foreground">
              Receba dicas personalizadas para aprimorar seu estilo de escrita
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
            <FileText className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Avaliação Detalhada</h3>
            <p className="text-center text-muted-foreground">
              Análise completa com pontos fortes e fracos do seu texto
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
