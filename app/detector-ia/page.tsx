import type { Metadata } from "next"
import HumanizeForm from "@/components/humanize-form"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Detector de IA – Analise se um texto foi escrito por inteligência artificial",
  description:
    "Cole o seu texto e receba um veredito instantâneo sobre a probabilidade de ele ter sido escrito por inteligência artificial. Resultados explicados com sinais, termos e brasileirismos.",
  keywords: "detector de ia, detectar texto gpt, identificar texto artificial, detector chatgpt, analisar texto ia",
  openGraph: {
    title: "Detector de IA – Analise se um texto foi escrito por inteligência artificial",
    description:
      "Descubra a probabilidade de um texto ter sido produzido por IA e visualize sinais detalhados, termos suspeitos e brasileirismos.",
    url: "https://www.corretordetextoonline.com.br/detector-ia",
    siteName: "CorretorIA",
    locale: "pt_BR",
    type: "website",
  },
}

export default function DetectorIAPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">Detector de IA</h1>
        <p className="text-muted-foreground mb-8 text-center">
          Analise o texto e receba um veredito explicado: probabilidade de autoria por IA, sinais linguísticos e presença de brasileirismos.
        </p>

        <Card className="mb-8">
          <CardContent className="p-0">
            <HumanizeForm />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Como o detector avalia o texto</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Sinais linguísticos:</strong> analisamos conectivos, escolhas lexicais e construções sintáticas que costumam aparecer em respostas artificiais.
              </li>
              <li>
                <strong>Padrões estruturais:</strong> medimos o quão previsível e fracionado está o texto, incluindo listas, títulos e blocos excessivamente organizados.
              </li>
              <li>
                <strong>Brasileirismos e regionalismos:</strong> identificamos a presença (ou ausência) de vocabulário típico do português brasileiro para reforçar o veredito.
              </li>
              <li>
                <strong>Probabilidade geral:</strong> combinamos os fatores anteriores para gerar um percentual com nível de confiança claro.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">O que você recebe ao final</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <h3 className="font-semibold mb-1">Veredito + porcentagem</h3>
                <p className="text-sm text-muted-foreground">
                  Indicamos se o texto parece humano, híbrido ou artificial, sempre acompanhado da probabilidade estimada e da confiança do detector.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <h3 className="font-semibold mb-1">Principais sinais</h3>
                <p className="text-sm text-muted-foreground">
                  Veja quais trechos chamaram atenção, com descrições claras do porquê eles contam pontos para humano ou IA.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <h3 className="font-semibold mb-1">Termos suspeitos</h3>
                <p className="text-sm text-muted-foreground">
                  Listamos palavras recorrentes em IA, além de indicadores de densidade e repetição.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <h3 className="font-semibold mb-1">Brasileirismos</h3>
                <p className="text-sm text-muted-foreground">
                  Identifique vocabulário regional presente (ou ausente) e sugestões de ajustes quando o texto estiver formal demais.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Limites e recomendações</h2>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-2 text-sm text-yellow-800">
              <p>
                • Usuários gratuitos: 1 análise por mês, com textos de até 2.000 caracteres. Premium: 2 análises por dia, com limite ampliado.
              </p>
              <p>
                • Textos muito curtos (menos de 80 palavras) podem gerar vereditos menos confiáveis. Sempre que possível, envie o trecho completo.
              </p>
              <p>
                • Resultados não são definitivos: revise o contexto e combine com a sua análise manual.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Dicas para interpretar o resultado</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Probabilidades acima de 80% com confiança alta indicam forte chance de autoria artificial.</li>
              <li>
                Se o veredito for humano, mas a confiança estiver baixa, revise os sinais destacados: alguns ajustes podem aumentar a naturalidade.
              </li>
              <li>
                Brasileirismos ajudam a reforçar autoria humana: gírias, referências culturais e variações regionais são bons sinais.
              </li>
              <li>
                Use a seção de sinais para orientar feedback ou ações corretivas (reescrita, ajustes de tom, etc.).
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
