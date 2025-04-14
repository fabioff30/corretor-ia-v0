import type { Metadata } from "next"
import { BackgroundGradient } from "@/components/background-gradient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Pagamento Pendente - CorretorIA",
  description: "Seu pagamento está sendo processado. Aguarde a confirmação.",
}

export default function DonationPendingPage() {
  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="border-amber-500/30">
          <CardHeader className="pb-4">
            <div className="mx-auto bg-amber-500/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle className="text-2xl text-center">Pagamento em Processamento</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="mb-6">
              Seu pagamento está sendo processado. Isso pode levar alguns minutos ou até algumas horas, dependendo do
              método de pagamento escolhido.
            </p>

            <div className="bg-muted/30 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">O que acontece agora:</h3>
              <ul className="space-y-2 text-sm text-left">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Seu pagamento está sendo processado pela instituição financeira</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Assim que confirmado, você receberá um email com o recibo</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Não é necessário realizar o pagamento novamente</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Se você tiver dúvidas sobre o status do seu pagamento, entre em contato conosco pelo email{" "}
              <a href="mailto:contato@corretordetextoonline.com.br" className="text-primary hover:underline">
                contato@corretordetextoonline.com.br
              </a>
              .
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button asChild className="w-full">
              <Link href="/">
                Voltar para o CorretorIA
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
