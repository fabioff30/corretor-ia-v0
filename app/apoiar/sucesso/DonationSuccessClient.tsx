"use client"

import Link from "next/link"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BackgroundGradient } from "@/components/background-gradient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight, Copy, Share2 } from "lucide-react"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

// Importar o utilitário do Meta Pixel
import { trackPixelEvent } from "@/utils/meta-pixel"

// Add this function to send the Google Ads conversion event
function sendGoogleAdsConversion(transactionId: string, amount: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: "AW-16935786537/i2yhCNa1r7UaEKmwzos_",
      value: amount,
      currency: "BRL",
      transaction_id: transactionId,
    })
    console.log("Google Ads conversion event sent:", { transactionId, amount })
  }
}

interface DonationData {
  amount: number
  name?: string
  email?: string
  paymentMethod?: string
  timestamp?: string
  transactionId?: string
}

export default function DonationSuccessClient() {
  const [donationData, setDonationData] = useState<DonationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const generateTransactionId = () => {
    return `TRX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString("pt-BR")
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const copyReceipt = () => {
    if (!donationData) return

    const receiptText = `
Recibo de Doação - CorretorIA
------------------------------
Valor: ${formatCurrency(donationData.amount)}
Data: ${formatDate(donationData.timestamp)}
ID da Transação: ${donationData.transactionId || generateTransactionId()}
${donationData.name ? `Nome: ${donationData.name}` : ""}
${donationData.email ? `Email: ${donationData.email}` : ""}
Método de Pagamento: ${donationData.paymentMethod || "Mercado Pago"}

Obrigado por apoiar o CorretorIA!
    `.trim()

    navigator.clipboard.writeText(receiptText)
    toast({
      title: "Recibo copiado!",
      description: "O recibo foi copiado para a área de transferência.",
    })
  }

  const shareOnWhatsApp = () => {
    if (!donationData) return

    const message = `
Acabei de apoiar o CorretorIA com ${formatCurrency(donationData.amount)}! 
Esta ferramenta gratuita ajuda milhares de pessoas a escreverem melhor em português.
Conheça em: https://corretordetextoonline.com.br
    `.trim()

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  useEffect(() => {
    try {
      const storedData = localStorage.getItem("donation_data")
      if (storedData) {
        const parsedData = JSON.parse(storedData) as DonationData

        if (!parsedData.transactionId) {
          parsedData.transactionId = generateTransactionId()
        }

        setDonationData(parsedData)

        // Send GTM event
        sendGTMEvent("purchase", {
          transaction_id: parsedData.transactionId,
          value: parsedData.amount,
          currency: "BRL",
          items: [
            {
              item_name: "Doação CorretorIA",
              item_category: "Donation",
              price: parsedData.amount,
              quantity: 1,
            },
          ],
          user_name: parsedData.name || "Anônimo",
          user_email: parsedData.email || "não informado",
          payment_method: parsedData.paymentMethod || "Mercado Pago",
        })

        // Rastrear evento de compra concluída no Meta Pixel
        trackPixelEvent("Purchase", {
          value: parsedData.amount,
          currency: "BRL",
          transaction_id: parsedData.transactionId,
          content_name: "Doação CorretorIA",
          content_category: "Donation",
          payment_method: parsedData.paymentMethod || "Mercado Pago",
        })

        // Send Google Ads conversion event
        sendGoogleAdsConversion(parsedData.transactionId, parsedData.amount)

        localStorage.removeItem("donation_data")
      } else {
        const urlParams = new URLSearchParams(window.location.search)
        const amount = Number(urlParams.get("amount") || 0)

        if (amount > 0) {
          const newDonationData = {
            amount,
            transactionId: urlParams.get("payment_id") || generateTransactionId(),
            timestamp: new Date().toISOString(),
            paymentMethod: urlParams.get("payment_type") || "Mercado Pago",
          }

          setDonationData(newDonationData)

          // Send GTM event
          sendGTMEvent("purchase", {
            transaction_id: newDonationData.transactionId,
            value: amount,
            currency: "BRL",
            items: [
              {
                item_name: "Doação CorretorIA",
                item_category: "Donation",
                price: amount,
                quantity: 1,
              },
            ],
            payment_method: newDonationData.paymentMethod,
          })

          // Send Google Ads conversion event
          sendGoogleAdsConversion(newDonationData.transactionId, amount)
        } else {
          setError("Não foi possível encontrar os detalhes da sua doação.")
        }
      }
    } catch (err) {
      console.error("Erro ao processar dados da doação:", err)
      setError("Ocorreu um erro ao processar os detalhes da sua doação.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <>
        <BackgroundGradient />
        <div className="container max-w-md mx-auto py-16 px-4">
          <Card>
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <p className="text-center text-muted-foreground">Processando sua doação...</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <BackgroundGradient />
        <div className="container max-w-md mx-auto py-16 px-4">
          <Card className="border-amber-500/30">
            <CardHeader className="pb-4">
              <div className="mx-auto bg-amber-500/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl text-center">Doação Processada</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <p className="mb-6">
                Agradecemos sua doação ao CorretorIA! {error} No entanto, sua contribuição foi registrada com sucesso.
              </p>
              <p className="text-sm text-muted-foreground">
                Se você tiver qualquer dúvida, entre em contato conosco pelo email{" "}
                <a href="mailto:contato@corretordetextoonline.com.br" className="text-primary hover:underline">
                  contato@corretordetextoonline.com.br
                </a>
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

  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-md mx-auto py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-green-500/30 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-400 to-green-600 w-full"></div>
            <CardHeader className="pb-4">
              <div className="mx-auto bg-green-500/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-center">Doação Confirmada!</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <p className="mb-6">
                Muito obrigado pelo seu apoio ao CorretorIA! Sua contribuição de{" "}
                <span className="font-bold text-green-600 dark:text-green-400">
                  {donationData?.amount ? formatCurrency(donationData.amount) : ""}
                </span>{" "}
                ajuda a manter o serviço gratuito e a desenvolver novos recursos para todos os usuários.
              </p>

              <div className="bg-muted/30 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-medium mb-2 text-center">Detalhes da Transação</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-medium">
                      {donationData?.amount ? formatCurrency(donationData.amount) : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data:</span>
                    <span>{donationData?.timestamp ? formatDate(donationData.timestamp) : formatDate()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID da Transação:</span>
                    <span className="font-mono text-xs">{donationData?.transactionId || generateTransactionId()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método de Pagamento:</span>
                    <span>{donationData?.paymentMethod || "Mercado Pago"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <Button variant="outline" size="sm" onClick={copyReceipt}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Recibo
                </Button>
                <Button variant="outline" size="sm" onClick={shareOnWhatsApp}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-2">O que sua doação possibilita:</h3>
                <ul className="space-y-2 text-sm text-left">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Manutenção dos servidores</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Melhoria dos algoritmos de IA</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Desenvolvimento de novos recursos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Acesso gratuito para todos</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                Um recibo foi enviado para o seu email. Se tiver qualquer dúvida, entre em contato conosco pelo email{" "}
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
        </motion.div>
      </div>
    </>
  )
}
