"use client"

import { useEffect } from "react"
import Link from "next/link"
import { BackgroundGradient } from "@/components/background-gradient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { sendGTMEvent } from "@/utils/gtm-helper"

export default function CheckoutSuccessPage() {
  useEffect(() => {
    // Enviar evento de conversão
    sendGTMEvent("purchase_complete", {
      event_category: "ecommerce",
      event_label: "premium_subscription",
    })
  }, [])

  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-md mx-auto py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-green-500/30">
            <CardHeader className="pb-4">
              <div className="mx-auto bg-green-500/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-center">Assinatura Confirmada!</CardTitle>
              <CardDescription className="text-center">Seu pagamento foi processado com sucesso</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <p className="mb-6">Parabéns! Você agora tem acesso a todos os recursos premium do CorretorIA.</p>

              <div className="bg-muted/30 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Detalhes da sua assinatura:</h3>
                <ul className="space-y-2 text-sm text-left">
                  <li className="flex justify-between">
                    <span>Plano:</span>
                    <span className="font-medium">Premium</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-green-500">Ativo</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Próxima cobrança:</span>
                    <span className="font-medium">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                Um recibo foi enviado para o seu email. Você pode gerenciar sua assinatura a qualquer momento na sua
                conta.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  Começar a usar o Premium
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/account">Gerenciar assinatura</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
