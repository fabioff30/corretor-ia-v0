import type { Metadata } from "next"
import TextCorrectionForm from "@/components/text-correction-form"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Reescrever Texto - Reescreva seus textos com Inteligência Artificial",
  description:
    "Reescreva seu texto em diferentes estilos: formal, informal, acadêmico, criativo ou infantil. Use inteligência artificial para melhorar a reescrita deles.",
  keywords: "reescrever texto, reescrita, estilo de texto, português, IA, inteligência artificial, reescrever online",
  openGraph: {
    title: "Reescrever Texto - Reescreva seus textos com Inteligência Artificial",
    description: "Reescreva seu texto em diferentes estilos com nossa ferramenta de inteligência artificial.",
    url: "https://www.corretordetextoonline.com.br/reescrever-texto",
    siteName: "CorretorIA",
    locale: "pt_BR",
    type: "website",
  },
}

export default function RewriteTextPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">Reescrever Texto</h1>
        <p className="text-muted-foreground mb-8 text-center">
          Reescreva seu texto em diferentes estilos: formal, informal, acadêmico, criativo ou infantil.
        </p>

        <Card className="mb-8">
          <CardContent className="p-0">
            <TextCorrectionForm initialMode="rewrite" />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Como funciona a reescrita de texto?</h2>
            <p className="mb-4">
              Nossa ferramenta de reescrita utiliza inteligência artificial avançada para transformar seu texto mantendo
              o significado original, mas adaptando o estilo conforme sua escolha:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Formal:</strong> Ideal para documentos profissionais, e-mails corporativos e textos oficiais.
              </li>
              <li>
                <strong>Humanizado:</strong> Perfeito para comunicações naturais, com tom conversacional e acessível.
              </li>
              <li>
                <strong>Acadêmico:</strong> Adequado para trabalhos científicos, artigos e dissertações.
              </li>
              <li>
                <strong>Criativo:</strong> Excelente para conteúdo de marketing, histórias e descrições expressivas.
              </li>
              <li>
                <strong>Como uma Criança:</strong> Simplifica o texto para uma linguagem mais acessível e inocente.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Dicas para obter melhores resultados</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Forneça um texto claro e bem estruturado para obter a melhor reescrita.</li>
              <li>Textos muito técnicos podem perder termos específicos ao serem reescritos em estilo informal.</li>
              <li>Revise sempre o resultado, pois a IA pode ocasionalmente alterar sutilmente o significado.</li>
              <li>Para textos longos, considere reescrever por parágrafos para maior precisão.</li>
              <li>Experimente diferentes estilos para encontrar o tom perfeito para sua necessidade.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
