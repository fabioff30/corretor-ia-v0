"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, Check, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { useRouter } from "next/navigation"

export function PremiumPlan() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const features = [
    { name: "Sem limite de caracteres", included: true },
    { name: "Sem anúncios", included: true },
    { name: "Correções ilimitadas", included: true },
    { name: "Análise de estilo avançada", included: true },
    { name: "Sugestões de reescrita", included: true },
    { name: "Prioridade no processamento", included: true },
    { name: "Histórico de correções", included: false, comingSoon: true },
    { name: "Extensão para navegador", included: false, comingSoon: true },
  ]

  const handleSubscribe = () => {
    setIsLoading(true)

    sendGTMEvent("premium_subscription_click", {
      plan: "mensal",
      price: "9.90",
    })

    // Redirecionar para a página de doação
    setTimeout(() => {
      router.push(
        "/apoiar?plan=premium&billing=monthly&utm_source=premium_plan&utm_medium=button&utm_campaign=monthly_subscription",
      )
    }, 500)
  }

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Versão Premium
        </span>
        <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Desbloqueie Todo o Potencial</h2>
        <p className="text-foreground/80 max-w-[700px] mx-auto">
          Aprimore sua experiência com recursos exclusivos e sem limitações
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Card className="border-primary shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">CorretorIA Premium</CardTitle>
                <div className="p-2 bg-white/20 rounded-full">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <CardDescription className="text-white/90 mt-2">Correção de texto sem limites</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">R$9,90</span>
                <span className="text-white/90 ml-1">/mês</span>
              </div>
              <div className="text-sm mt-1 text-white/80">ou R$89,90/ano (economia de 25%)</div>
            </CardHeader>

            <CardContent className="pt-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground"}>
                      {feature.name}
                      {feature.comingSoon && (
                        <span className="ml-2 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded">
                          Em breve
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Cancele a qualquer momento. Oferecemos garantia de 7 dias de reembolso se você não ficar satisfeito.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSubscribe} disabled={isLoading}>
                {isLoading ? "Processando..." : "Assinar agora"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(
                    "/apoiar?plan=premium&billing=yearly&utm_source=premium_plan&utm_medium=button&utm_campaign=yearly_subscription",
                  )
                }
              >
                Plano anual com 25% de desconto
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
