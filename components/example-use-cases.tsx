import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ExampleUseCases() {
  return (
    <div className="glass-card rounded-xl p-6">
      <Tabs defaultValue="academic">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger
            value="academic"
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Acadêmico
          </TabsTrigger>
          <TabsTrigger
            value="professional"
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Profissional
          </TabsTrigger>
          <TabsTrigger
            value="creative"
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Criativo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="mt-0">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Uso em Trabalhos Acadêmicos</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Texto Original (com erros):</h4>
                <div className="p-4 bg-background/50 rounded-lg border border-white/10 text-foreground/80">
                  <p>
                    A pesquisa cientifica tem como objetivo principal contribuir para o avanco do conhecimento em
                    determinada área. Porem, para que os resultados sejam validos, é necessario seguir uma metodologia
                    adequada. Muitos pesquisadores enfrentam dificuldades na hora de redigir seus trabalhos academicos,
                    cometendo erros gramaticais e de pontuacao que podem comprometer a clareza do texto.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Texto Corrigido:</h4>
                <div className="p-4 bg-background/50 rounded-lg border border-white/10 text-foreground/80">
                  <p>
                    A pesquisa científica tem como objetivo principal contribuir para o avanço do conhecimento em
                    determinada área. Porém, para que os resultados sejam válidos, é necessário seguir uma metodologia
                    adequada. Muitos pesquisadores enfrentam dificuldades na hora de redigir seus trabalhos acadêmicos,
                    cometendo erros gramaticais e de pontuação que podem comprometer a clareza do texto.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Benefícios da Correção:</h4>
                <ul className="list-disc pl-5 space-y-1 text-foreground/80">
                  <li>
                    Adição de acentos em palavras como "científica", "avanço", "porém", "necessário", "válidos" e
                    "acadêmicos"
                  </li>
                  <li>Correção da pontuação para melhorar a fluidez do texto</li>
                  <li>Aumento da credibilidade do trabalho acadêmico</li>
                  <li>Maior clareza na comunicação das ideias de pesquisa</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="professional" className="mt-0">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Uso em Comunicações Profissionais</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">E-mail Original (com erros):</h4>
                <div className="p-4 bg-background/50 rounded-lg border border-white/10 text-foreground/80">
                  <p>
                    Prezado cliente,
                    <br />
                    <br />
                    Venho por meio deste, informa-lo que recebemos sua solicitacao e estamos trabalhando para atende-la
                    o mais rapido possivel. Nossa equipe entrará em contato com o senhor até amanha para agenda uma
                    reunião e discutir os detalhes do projeto. Pedimos desculpa pelo atrazo na resposta.
                    <br />
                    <br />
                    Atenciosamente,
                    <br />
                    Departamento Comercial
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">E-mail Corrigido:</h4>
                <div className="p-4 bg-background/50 rounded-lg border border-white/10 text-foreground/80">
                  <p>
                    Prezado cliente,
                    <br />
                    <br />
                    Venho por meio deste informá-lo que recebemos sua solicitação e estamos trabalhando para atendê-la o
                    mais rápido possível. Nossa equipe entrará em contato com o senhor até amanhã para agendar uma
                    reunião e discutir os detalhes do projeto. Pedimos desculpas pelo atraso na resposta.
                    <br />
                    <br />
                    Atenciosamente,
                    <br />
                    Departamento Comercial
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Benefícios da Correção:</h4>
                <ul className="list-disc pl-5 space-y-1 text-foreground/80">
                  <li>Remoção da vírgula incorreta após "deste"</li>
                  <li>
                    Adição de acentos em palavras como "informá-lo", "solicitação", "atendê-la", "rápido", "possível",
                    "amanhã"
                  </li>
                  <li>Correção de "agenda" para "agendar" e "desculpa" para "desculpas"</li>
                  <li>Correção de "atrazo" para "atraso"</li>
                  <li>Transmissão de profissionalismo e atenção aos detalhes</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="creative" className="mt-0">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Uso em Conteúdo Criativo</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Texto Original (com erros):</h4>
                <div className="p-4 bg-background/50 rounded-lg border border-white/10 text-foreground/80">
                  <p>
                    O sol se punha no orizonte, tingindo o céu com tons de laranja e vermelho. Maria observava a
                    paisajem com um misto de admiracao e melancolia. Haviam se passado dez anos desde a ultima vez que
                    ela estivera naquela praia. As lembrancas vieram a tona, como ondas que quebram na areia. Ela fechou
                    os olhos e respirou fundo, sentindo o cheiro do mar invadir suas narinas.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Texto Corrigido:</h4>
                <div className="p-4 bg-background/50 rounded-lg border border-white/10 text-foreground/80">
                  <p>
                    O sol se punha no horizonte, tingindo o céu com tons de laranja e vermelho. Maria observava a
                    paisagem com um misto de admiração e melancolia. Havia se passado dez anos desde a última vez que
                    ela estivera naquela praia. As lembranças vieram à tona, como ondas que quebram na areia. Ela fechou
                    os olhos e respirou fundo, sentindo o cheiro do mar invadir suas narinas.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Benefícios da Correção:</h4>
                <ul className="list-disc pl-5 space-y-1 text-foreground/80">
                  <li>Correção de "orizonte" para "horizonte" e "paisajem" para "paisagem"</li>
                  <li>Adição de acentos em "admiração", "última", "lembranças"</li>
                  <li>Correção de "Haviam" para "Havia" (concordância verbal)</li>
                  <li>Adição da crase em "à tona"</li>
                  <li>Preservação do estilo narrativo e tom emocional do texto</li>
                  <li>Melhoria da experiência de leitura sem alterar a voz do autor</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
