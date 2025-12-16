import type { Metadata } from "next"
import Link from "next/link"
import { Gift, PartyPopper, Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackgroundGradient } from "@/components/background-gradient"

export const metadata: Metadata = {
  title: "Presente Enviado - CorretorIA",
  description: "Seu presente foi enviado com sucesso!",
}

export default function GiftSuccessPage() {
  return (
    <>
      <BackgroundGradient />
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-green-500/20 rounded-full animate-ping" />
            </div>
            <div className="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <PartyPopper className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">Presente enviado com sucesso!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Um email com o codigo de resgate foi enviado para o presenteado.
            Ele podera usar o codigo para ativar o CorretorIA Premium.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email enviado
              </CardTitle>
              <CardDescription>
                O presenteado recebera instrucoes para resgatar o presente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 text-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p className="text-left">O presenteado recebe um email com o codigo</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p className="text-left">Ele acessa o link e cria uma conta (ou faz login)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <p className="text-left">O plano Premium e ativado automaticamente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/presente">
                <Gift className="h-4 w-4 mr-2" />
                Comprar outro presente
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/">
                <ArrowRight className="h-4 w-4 mr-2" />
                Voltar para o inicio
              </Link>
            </Button>
          </div>

          {/* Festive decoration */}
          <div className="mt-12 text-4xl">
            🎄 🎁 ⭐ 🎁 🎄
          </div>
        </div>
      </main>
    </>
  )
}
