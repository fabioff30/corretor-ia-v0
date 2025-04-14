"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BackgroundGradient } from "@/components/background-gradient"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CreditCard, Landmark, AlertTriangle } from "lucide-react"
import { activatePremiumSubscription } from "@/utils/subscription"
import { sendGTMEvent } from "@/utils/gtm-helper"

interface CheckoutPageProps {
  params: {
    plan: string
  }
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix">("credit")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  })

  const planDetails = {
    "premium-mensal": {
      name: "Premium Mensal",
      price: "R$9,90",
      interval: "mês",
      durationDays: 30,
    },
    "premium-anual": {
      name: "Premium Anual",
      price: "R$89,90",
      interval: "ano",
      durationDays: 365,
      discount: "25% de desconto",
    },
  }

  const plan = planDetails[params.plan] || planDetails["premium-mensal"]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    sendGTMEvent("checkout_submit", {
      plan: params.plan,
      payment_method: paymentMethod,
      price: plan.price,
    })

    // Simular processamento de pagamento
    setTimeout(() => {
      // Ativar assinatura (simulação)
      activatePremiumSubscription(plan.durationDays)

      // Redirecionar para página de sucesso
      router.push("/checkout/success")
    }, 2000)
  }

  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 gradient-text text-center">Finalizar Assinatura</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Resumo do pedido */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Plano</span>
                    <span className="font-medium">{plan.name}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Preço</span>
                    <span className="font-medium">
                      {plan.price}/{plan.interval}
                    </span>
                  </div>

                  {plan.discount && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Desconto</span>
                      <span className="font-medium">{plan.discount}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{plan.price}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Cancele quando quiser</p>
                <p className="mt-1">Você pode cancelar sua assinatura a qualquer momento pela sua conta.</p>
              </div>
            </div>
          </div>

          {/* Formulário de pagamento */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Pagamento</CardTitle>
                <CardDescription>Escolha seu método de pagamento preferido</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="credit" onValueChange={(value) => setPaymentMethod(value as "credit" | "pix")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="credit" className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Cartão de Crédito
                    </TabsTrigger>
                    <TabsTrigger value="pix" className="flex items-center">
                      <Landmark className="h-4 w-4 mr-2" />
                      PIX
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="credit">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome no cartão</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Nome completo"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Número do cartão</Label>
                          <Input
                            id="cardNumber"
                            name="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            required
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry">Validade</Label>
                            <Input
                              id="expiry"
                              name="expiry"
                              placeholder="MM/AA"
                              required
                              value={formData.expiry}
                              onChange={handleInputChange}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input
                              id="cvc"
                              name="cvc"
                              placeholder="123"
                              required
                              value={formData.cvc}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          `Assinar ${plan.name} por ${plan.price}`
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="pix">
                    <div className="text-center py-6">
                      <div className="bg-muted/30 p-6 rounded-lg mb-6 mx-auto max-w-[200px]">
                        <img src="/placeholder.svg?height=200&width=200" alt="Código PIX" className="w-full h-auto" />
                      </div>

                      <p className="mb-4">Escaneie o código QR ou copie a chave PIX abaixo:</p>

                      <div className="flex items-center justify-center mb-6">
                        <Input
                          value="00020126580014br.gov.bcb.pix0136a629532e-7693-4846-b028-f142082d7b5802"
                          readOnly
                          className="mr-2"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              "00020126580014br.gov.bcb.pix0136a629532e-7693-4846-b028-f142082d7b5802",
                            )
                          }}
                        >
                          Copiar
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        Após o pagamento, sua assinatura será ativada automaticamente em até 5 minutos.
                      </p>

                      <Button onClick={() => router.push("/checkout/success")} className="w-full">
                        Já fiz o pagamento
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 items-start">
                <p className="text-sm text-muted-foreground">
                  Ao assinar, você concorda com nossos{" "}
                  <a href="/termos" className="text-primary hover:underline">
                    Termos de Serviço
                  </a>{" "}
                  e{" "}
                  <a href="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                  .
                </p>
                <p className="text-sm text-muted-foreground">
                  Seus dados de pagamento são processados com segurança pelo Mercado Pago.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
