"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { Heart, Zap, Shield, Clock, Users, CheckCircle, Copy, AlertTriangle, CreditCard, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { MercadoPagoButton } from "@/components/mercado-pago-button"
import { RoadmapSection } from "@/components/roadmap-section"
import { AboutAuthorSection } from "@/components/about-author-section"

// Importar o utilitário do Meta Pixel
import { trackPixelEvent } from "@/utils/meta-pixel"

export default function DonationPage() {
  const [customAmount, setCustomAmount] = useState("")
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [totalRaised, setTotalRaised] = useState(0)
  const [donorCount, setDonorCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix")
  const [isLoading, setIsLoading] = useState(false)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const { toast } = useToast()
  const [tierAmount, setTierAmount] = useState<string | null>(null)

  const monthlyGoal = 5000
  const pixKey = "contato@corretordetextoonline.com.br"

  // Simular dados de arrecadação
  useEffect(() => {
    // Em um cenário real, esses dados viriam de uma API
    setTotalRaised(85)
    setProgress((85 / monthlyGoal) * 100)
    setDonorCount(32)
  }, [])

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? Number.parseInt(value) || 0 : value
    return numValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)

    // Enviar evento para o Google Analytics
    sendGTMEvent("Pix", {
      action: "copy_pix_key",
      label: pixKey,
      category: "donation",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const getEffectiveAmount = () => {
    if (selectedAmount) return Number.parseInt(selectedAmount)
    if (customAmount) return Number.parseInt(customAmount)
    return 0
  }

  const createPreference = async () => {
    const amount = getEffectiveAmount()
    if (amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, selecione ou digite um valor para doar.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Armazenar dados da doação no localStorage para recuperar na página de sucesso
    const donationData = {
      amount: amount,
      name: "", // Idealmente, você teria um campo para o nome do doador
      email: "", // Idealmente, você teria um campo para o email do doador
      paymentMethod: paymentMethod,
      timestamp: new Date().toISOString(),
      transactionId: `TRX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    }
    localStorage.setItem("donation_data", JSON.stringify(donationData))

    try {
      console.log(`Creating preference for ${formatCurrency(amount)}`)

      const response = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Doação para CorretorIA - ${formatCurrency(amount)}`,
          price: amount,
          quantity: 1,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Erro ao processar pagamento"
        try {
          const errorData = await response.json()
          console.error("Detalhes do erro:", errorData)
          errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`

          // Check for specific token errors
          if (
            errorData.details &&
            (errorData.details.includes("invalid_token") || errorData.details.includes("token"))
          ) {
            errorMessage =
              "Erro de autenticação com o Mercado Pago. Por favor, tente novamente mais tarde ou entre em contato com o suporte."
          }
        } catch (e) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Preference created successfully:", data)

      // Reset preference ID first to ensure clean state
      setPreferenceId(null)

      // Set the new preference ID after a small delay
      setTimeout(() => {
        setPreferenceId(data.preferenceId)
      }, 50)

      // Registrar evento de analytics
      sendGTMEvent("donation_initiated", {
        amount: amount,
        payment_method: paymentMethod,
      })

      // Rastrear evento de doação iniciada no Meta Pixel
      trackPixelEvent("InitiateCheckout", {
        value: amount,
        currency: "BRL",
        content_category: "donation",
        payment_method: paymentMethod,
      })
    } catch (error) {
      console.error("Erro ao criar preferência:", error)
      toast({
        title: "Erro ao processar",
        description:
          error instanceof Error ? error.message : "Não foi possível iniciar o pagamento. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDonation = () => {
    if (paymentMethod === "pix") {
      // Para PIX, vamos direcionar para o Mercado Pago
      createPreference()
    } else {
      // Para cartão, também usamos o Mercado Pago
      createPreference()
    }
  }

  const handleMonthlyDonation = async () => {
    // Definir o método de pagamento como cartão
    setPaymentMethod("card")

    // Armazenar dados da doação no localStorage
    localStorage.setItem(
      "donation_data",
      JSON.stringify({
        amount: 15,
        name: "",
        email: "",
        paymentMethod: "card",
        isRecurring: true,
        timestamp: new Date().toISOString(),
      }),
    )

    // Registrar evento de analytics
    sendGTMEvent("monthly_subscription_initiated", {
      amount: 15,
      payment_method: "card",
    })

    // Rastrear evento de assinatura mensal no Meta Pixel
    trackPixelEvent("Subscribe", {
      value: 15,
      currency: "BRL",
      subscription_id: "monthly_support",
      payment_method: "card",
    })

    // Iniciar o carregamento
    setIsLoading(true)

    try {
      console.log("Criando preferência para assinatura mensal de R$15")

      // Chamar diretamente a API para criar a preferência com valor fixo
      const response = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Assinatura Mensal CorretorIA",
          price: 15,
          quantity: 1,
          donorName: "", // Adicionar campos opcionais
          donorEmail: "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erro na resposta da API:", errorData)
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Preferência criada com sucesso:", data)

      // Reset preference ID first to ensure clean state
      setPreferenceId(null)

      // Set the new preference ID after a small delay
      setTimeout(() => {
        setPreferenceId(data.preferenceId)
      }, 50)
    } catch (error) {
      console.error("Erro ao criar preferência:", error)
      toast({
        title: "Erro ao processar",
        description:
          error instanceof Error ? error.message : "Não foi possível iniciar o pagamento. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const tier = searchParams.get("tier")
    const plan = searchParams.get("plan")
    const billing = searchParams.get("billing")

    if (tier) {
      // Selecionar o valor com base no tier
      switch (tier) {
        case "bronze":
          setTierAmount("10")
          break
        case "silver":
          setTierAmount("25")
          break
        case "gold":
          setTierAmount("50")
          break
        default:
          setTierAmount(null)
          break
      }
    }

    if (plan === "premium") {
      if (billing === "yearly") {
        setTierAmount("89")
      } else {
        // Mensal por padrão
        setTierAmount("15")
      }
    }
  }, [])

  useEffect(() => {
    if (tierAmount) {
      handleAmountSelect(tierAmount)
    }
  }, [tierAmount])

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section - Adaptada para a persona */}
        <section className="py-12 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent z-0"></div>
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge variant="outline" className="mb-4 px-3 py-1 bg-primary/10 text-primary border-primary/20">
                  Apoie o CorretorIA
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  Ajude a manter sua ferramenta de escrita favorita
                </h1>
                <p className="text-lg md:text-xl text-foreground/80 mb-4 max-w-2xl mx-auto">
                  Sua contribuição permite que continuemos ajudando milhares de pessoas a se comunicarem melhor e com
                  mais confiança todos os dias.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Donation Form Section - Adaptada para a persona */}
        <section className="py-8 md:py-12">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-card border rounded-xl shadow-lg p-6 mb-8"
              >
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold">Meta mensal: {formatCurrency(monthlyGoal)}</h2>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                      {Math.round(progress)}% alcançado
                    </Badge>
                  </div>
                  <div className="relative h-6 bg-muted/50 rounded-full overflow-hidden mb-2 border">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    >
                      {progress > 15 && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground">
                          {Math.round(progress)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">
                      Arrecadado: <span className="text-primary">{formatCurrency(totalRaised)}</span>
                    </span>
                    <span className="text-foreground">
                      <span className="font-medium text-primary">{donorCount}</span> pessoas já apoiaram
                    </span>
                  </div>
                </div>

                <Tabs defaultValue="pix" onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="pix" className="flex items-center">
                      <img src="/pix-logo.png" alt="PIX" className="h-5 w-5 mr-2 object-contain" />
                      PIX
                    </TabsTrigger>
                    <TabsTrigger value="card" className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Cartão
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pix">
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        {["5", "10", "25", "50"].map((amount) => (
                          <Button
                            key={amount}
                            variant={selectedAmount === amount ? "default" : "outline"}
                            onClick={() => handleAmountSelect(amount)}
                            className="h-12"
                          >
                            {formatCurrency(amount)}
                          </Button>
                        ))}
                      </div>

                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Outro valor (min. R$1)"
                          value={customAmount ? `R$ ${customAmount}` : ""}
                          onChange={handleCustomAmountChange}
                          className="h-12 pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {!customAmount && "R$"}
                        </span>
                      </div>

                      {preferenceId ? (
                        <MercadoPagoButton
                          preferenceId={preferenceId}
                          onSuccess={() => {
                            toast({
                              title: "Pagamento realizado com sucesso!",
                              description: "Obrigado pela sua doação.",
                            })
                          }}
                          onError={(error) => {
                            console.error("Erro no pagamento:", error)
                            toast({
                              title: "Erro no pagamento",
                              description: "Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.",
                              variant: "destructive",
                            })
                            // Reset preferenceId to show the button again
                            setPreferenceId(null)
                          }}
                        />
                      ) : (
                        <Button
                          className="w-full h-14 text-lg mt-4"
                          size="lg"
                          disabled={(!selectedAmount && !customAmount) || isLoading}
                          onClick={handleDonation}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              Apoiar com{" "}
                              {selectedAmount || customAmount
                                ? formatCurrency(selectedAmount || customAmount)
                                : "qualquer valor"}
                              <Heart className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      )}

                      <div className="bg-muted/30 p-4 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Chave PIX (E-mail):</span>
                          <Button variant="ghost" size="sm" onClick={copyPixKey} className="h-8">
                            {copied ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            {copied ? "Copiado!" : "Copiar"}
                          </Button>
                        </div>
                        <code className="block w-full p-2 bg-background rounded border text-xs overflow-x-auto">
                          {pixKey}
                        </code>

                        {/* Adicionar o QR Code aqui */}
                        <div className="mt-4 flex flex-col items-center">
                          <p className="text-sm font-medium mb-2">Ou escaneie o QR Code:</p>
                          <div className="bg-white p-2 rounded-lg max-w-[250px] mx-auto">
                            <img
                              src="/images/pix-qrcode-new.png"
                              alt="QR Code para pagamento via PIX"
                              className="w-full h-auto"
                            />
                          </div>
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Chave PIX: 156be350-652c-4914-9a19-da7685675964
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Após o pagamento, envie um e-mail para{" "}
                          <a
                            href="mailto:contato@corretordetextoonline.com.br"
                            className="text-primary hover:underline"
                          >
                            contato@corretordetextoonline.com.br
                          </a>{" "}
                          com o comprovante para receber seu agradecimento.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="card">
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        {["5", "10", "25", "50"].map((amount) => (
                          <Button
                            key={amount}
                            variant={selectedAmount === amount ? "default" : "outline"}
                            onClick={() => handleAmountSelect(amount)}
                            className="h-12"
                          >
                            {formatCurrency(amount)}
                          </Button>
                        ))}
                      </div>

                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Outro valor (min. R$1)"
                          value={customAmount ? `R$ ${customAmount}` : ""}
                          onChange={handleCustomAmountChange}
                          className="h-12 pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {!customAmount && "R$"}
                        </span>
                      </div>

                      {preferenceId ? (
                        <MercadoPagoButton
                          preferenceId={preferenceId}
                          onSuccess={() => {
                            toast({
                              title: "Pagamento realizado com sucesso!",
                              description: "Obrigado pela sua doação.",
                            })
                          }}
                          onError={(error) => {
                            console.error("Erro no pagamento:", error)
                            toast({
                              title: "Erro no pagamento",
                              description: "Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.",
                              variant: "destructive",
                            })
                            // Reset preferenceId to show the button again
                            setPreferenceId(null)
                          }}
                        />
                      ) : (
                        <Button
                          className="w-full h-14 text-lg mt-4"
                          size="lg"
                          disabled={(!selectedAmount && !customAmount) || isLoading}
                          onClick={handleDonation}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              Apoiar com{" "}
                              {selectedAmount || customAmount
                                ? formatCurrency(selectedAmount || customAmount)
                                : "qualquer valor"}
                              <Heart className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      )}

                      <div className="bg-muted/30 p-4 rounded-lg border">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">
                            Ao clicar em "Apoiar", você será redirecionado para uma página segura de pagamento do
                            Mercado Pago para concluir sua contribuição.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-foreground/70 mb-8">
                <span className="flex items-center">
                  <Shield className="h-4 w-4 mr-1.5 text-primary" />
                  Pagamento seguro
                </span>
                <span className="flex items-center">
                  <Zap className="h-4 w-4 mr-1.5 text-primary" />
                  Processamento instantâneo
                </span>
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-1.5 text-primary" />
                  Apoie a partir de R$1
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Why Donate Section */}
        <section id="como-funciona" className="py-12 bg-muted/30">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Como Seu Apoio Faz Diferença</h2>
              <p className="text-foreground/80 max-w-2xl mx-auto">
                Entenda como sua contribuição ajuda a melhorar a comunicação escrita de milhares de pessoas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Tecnologia Avançada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">
                    Sua doação ajuda a manter e melhorar os algoritmos de IA que identificam erros gramaticais,
                    ortográficos e de pontuação que muitas vezes passam despercebidos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Acesso Para Todos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">
                    Queremos que todos possam se comunicar com confiança, independentemente de recursos financeiros. Seu
                    apoio mantém o CorretorIA gratuito para estudantes, profissionais e qualquer pessoa.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Novos Recursos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">
                    Estamos desenvolvendo novas funcionalidades como sugestões de estilo, explicações didáticas dos
                    erros e um dashboard pessoal para acompanhar seu progresso na escrita.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <RoadmapSection />

        {/* About Author Section */}
        <AboutAuthorSection />

        {/* FAQ Section */}
        <section id="faq" className="py-12">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Perguntas Frequentes</h2>
              <p className="text-foreground/80 max-w-2xl mx-auto">Tire suas dúvidas sobre como apoiar o CorretorIA</p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Por que o CorretorIA precisa de apoio financeiro?</AccordionTrigger>
                  <AccordionContent>
                    Manter uma ferramenta de IA gratuita tem custos significativos. Precisamos pagar por servidores,
                    APIs de inteligência artificial e desenvolvimento contínuo. Sem apoio da comunidade, teríamos que
                    limitar o acesso ou cobrar de todos os usuários. Preferimos manter o acesso básico gratuito para que
                    todos possam se comunicar melhor, independentemente de sua situação financeira.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Posso apoiar com qualquer valor?</AccordionTrigger>
                  <AccordionContent>
                    Sim! Aceitamos doações a partir de R$1. Cada contribuição, independentemente do valor, é importante
                    e nos ajuda a manter o serviço funcionando. Você pode escolher qualquer valor que caiba no seu
                    orçamento.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Quais benefícios recebo ao apoiar?</AccordionTrigger>
                  <AccordionContent>
                    Além da satisfação de ajudar a manter uma ferramenta que beneficia milhares de pessoas, oferecemos
                    benefícios como limite de caracteres aumentado, acesso a recursos beta antes de todos, remoção de
                    anúncios e suporte prioritário, dependendo do plano escolhido. Mas o mais importante: você estará
                    investindo na melhoria contínua de uma ferramenta que você usa regularmente.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Posso cancelar minha contribuição mensal a qualquer momento?</AccordionTrigger>
                  <AccordionContent>
                    Absolutamente! Não há compromisso de longo prazo. Você pode cancelar sua contribuição mensal quando
                    quiser, sem perguntas ou complicações. Basta enviar um e-mail para
                    contato@corretordetextoonline.com.br solicitando o cancelamento.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent z-0"></div>
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Comunique-se com mais confiança
              </h2>
              <p className="text-xl text-foreground/80 mb-8">
                Seu apoio ajuda a manter e melhorar a ferramenta que você usa para escrever sem medo de erros. Contribua
                hoje e faça parte desta missão.
              </p>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="px-8"
                  onClick={() => {
                    // Scroll suave até a seção de doação no topo da página
                    document.querySelector(".py-8.md\\:py-12")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                    // Registrar evento de analytics
                    sendGTMEvent("cta_donation_click", {
                      source: "cta_section",
                    })
                  }}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Apoiar agora
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
