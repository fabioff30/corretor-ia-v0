import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, QrCode, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PixCopyButton } from "@/components/pix-copy-button"

export const metadata: Metadata = {
  title: "Apoie o CorretorIA - Ajude a Manter a Ferramenta Gratuita",
  description:
    "Ajude a manter o CorretorIA 100% gratuito para todos. Faça uma doação via PIX e contribua para o desenvolvimento de novas ferramentas de IA.",
  keywords: ["apoiar corretoria", "doar pix", "doação corretoria", "contribuir", "apoiar projeto"],
  alternates: {
    canonical: "https://www.corretordetextoonline.com.br/apoiar",
  },
  openGraph: {
    title: "Apoie o CorretorIA - Mantenha a Ferramenta Gratuita",
    description: "Faça uma doação via PIX e ajude a desenvolver mais ferramentas gratuitas de IA.",
    url: "https://www.corretordetextoonline.com.br/apoiar",
    siteName: "CorretorIA",
    locale: "pt_BR",
    type: "website",
  },
}

export default function ApoiarPage() {
  const pixKey = "contato@corretordetextoonline.com.br"

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 gradient-text">Apoie o CorretorIA</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ajude a manter o CorretorIA <strong>100% gratuito</strong> para todos e contribua para o desenvolvimento
            de novas ferramentas de IA
          </p>
        </div>

        {/* PIX Donation - FIRST */}
        <Card className="mb-8 border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Doar via PIX
            </CardTitle>
            <CardDescription>Doação rápida, segura e sem taxas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PIX Key */}
            <div>
              <label className="text-sm font-medium mb-2 block">Chave PIX (E-mail)</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">{pixKey}</div>
                <PixCopyButton pixKey={pixKey} />
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border-2">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <img
                  src="/pix-qrcode.png"
                  alt="QR Code PIX para doação"
                  className="w-64 h-64 object-contain"
                />
                <p className="text-sm text-muted-foreground font-medium">
                  📱 Escaneie o QR Code com seu app de banco
                </p>
              </div>
            </div>

            {/* Instructions */}
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">📱 Como doar via PIX:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                    <li>Abra o aplicativo do seu banco</li>
                    <li>Selecione a opção PIX</li>
                    <li>Escolha "Pagar com chave" ou "Copiar e Colar"</li>
                    <li>Cole a chave PIX acima</li>
                    <li>Insira o valor que deseja doar</li>
                    <li>Confirme a transação</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Why Support - After donation */}
        <Card className="mb-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Por que apoiar?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                O CorretorIA é uma ferramenta <strong>totalmente gratuita</strong> que oferece correção de textos,
                reescrita e detecção de IA usando tecnologia de ponta. Manter o serviço funcionando requer:
              </p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Custos de API dos modelos de IA (OpenAI, Anthropic, Google)</li>
                <li>Infraestrutura de servidores e hospedagem</li>
                <li>Desenvolvimento de novas funcionalidades</li>
                <li>Manutenção e suporte contínuo</li>
              </ul>
              <p className="pt-2">
                Sua doação, por menor que seja, faz uma <strong>grande diferença</strong> e nos ajuda a continuar
                oferecendo essas ferramentas gratuitamente para todos!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Impact */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle>💡 Impacto da sua doação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background/80 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">R$ 10</div>
                <p className="text-sm text-muted-foreground">~100 correções de texto gratuitas</p>
              </div>
              <div className="text-center p-4 bg-background/80 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">R$ 30</div>
                <p className="text-sm text-muted-foreground">~300 correções + detecções de IA</p>
              </div>
              <div className="text-center p-4 bg-background/80 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">R$ 50+</div>
                <p className="text-sm text-muted-foreground">Apoio ao desenvolvimento de novas features</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thank You */}
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="pt-6 text-center">
            <Heart className="h-12 w-12 text-primary mx-auto mb-4" fill="currentColor" />
            <h2 className="text-2xl font-bold mb-2">Muito Obrigado!</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada doação, independente do valor, nos ajuda a continuar desenvolvendo e mantendo o CorretorIA gratuito
              para milhares de usuários. Seu apoio faz toda a diferença! ❤️
            </p>
            <div className="mt-6">
              <Button asChild variant="outline">
                <a href="/">Voltar para o Corretor</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
