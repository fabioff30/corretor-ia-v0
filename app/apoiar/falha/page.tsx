import type { Metadata } from "next"
import { BackgroundGradient } from "@/components/background-gradient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Falha no Pagamento - CorretorIA",
  description: "Ocorreu um problema com o seu pagamento. Por favor, tente novamente.",
}

export default function DonationFailurePage() {
  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="border-red-500/30">
          <CardHeader className="pb-4">
            <div className="mx-auto bg-red-500/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-center">Pagamento não Concluído</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="mb-6">
              Infelizmente, ocorreu um problema ao processar o seu pagamento. Sua doação não foi concluída.
            </p>

            <div className="bg-muted/30 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">Possíveis motivos:</h3>
              <ul className="space-y-2 text-sm text-left">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Problemas com o cartão de crédito ou conta bancária</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Conexão interrompida durante o processo de pagamento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Cancelamento do pagamento</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Se você acredita que houve um erro, ou se o valor foi debitado da sua conta, entre em contato conosco pelo
              email{" "}
              <a href="mailto:contato@corretordetextoonline.com.br" className="text-primary hover:underline">
                contato@corretordetextoonline.com.br
              </a>
              .
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button asChild className="w-full">
              <Link href="/apoiar">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tentar novamente
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Voltar para o CorretorIA</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
