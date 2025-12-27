"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, QrCode, CreditCard } from "lucide-react"
import { WhatsAppInput, validateWhatsAppPhone } from "@/components/bundle/whatsapp-input"
import { PremiumPixModal } from "@/components/premium-pix-modal"
import { useToast } from "@/hooks/use-toast"

// Test price ID for R$1 subscription
const TEST_STRIPE_PRICE_ID = "price_1Sj3cSAaDWyHAlql4Z3Ns6T8"

export default function TestePagemento() {
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [isPixLoading, setIsPixLoading] = useState(false)
  const [isCardLoading, setIsCardLoading] = useState(false)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const { toast } = useToast()

  const validateForm = () => {
    if (!email.trim()) {
      toast({ variant: "destructive", title: "Digite seu email" })
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({ variant: "destructive", title: "Email inválido" })
      return false
    }
    const whatsappValidation = validateWhatsAppPhone(whatsapp)
    if (!whatsappValidation.isValid) {
      toast({ variant: "destructive", title: whatsappValidation.message || "WhatsApp inválido" })
      return false
    }
    return true
  }

  const handlePixPayment = async () => {
    if (!validateForm()) return

    setIsPixLoading(true)
    try {
      const response = await fetch("/api/mercadopago/create-pix-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: "bundle_monthly",
          guestEmail: email,
          whatsappPhone: whatsapp,
          testMode: true, // Flag for R$1 test
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar pagamento")
      }

      setPaymentData(data)
      setIsPixModalOpen(true)
    } catch (error) {
      console.error("Error creating PIX payment:", error)
      toast({
        variant: "destructive",
        title: "Erro ao gerar PIX",
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    } finally {
      setIsPixLoading(false)
    }
  }

  const handleCardPayment = async () => {
    if (!validateForm()) return

    setIsCardLoading(true)
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: "bundle_monthly_test", // Test plan type
          guestEmail: email,
          whatsappPhone: whatsapp,
          testPriceId: TEST_STRIPE_PRICE_ID,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar sessão de pagamento")
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error("URL de checkout não recebida")
      }
    } catch (error) {
      console.error("Error creating card payment:", error)
      toast({
        variant: "destructive",
        title: "Erro ao iniciar pagamento",
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    } finally {
      setIsCardLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Teste de Pagamento - R$ 1,00
          </CardTitle>
          <p className="text-center text-muted-foreground text-sm">
            Bundle CorretorIA + Julinho (Teste)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPixLoading || isCardLoading}
            />
          </div>

          <WhatsAppInput
            value={whatsapp}
            onChange={setWhatsapp}
            disabled={isPixLoading || isCardLoading}
          />

          <div className="space-y-3 pt-4">
            <Button
              onClick={handlePixPayment}
              disabled={isPixLoading || isCardLoading}
              className="w-full h-12 bg-green-600 hover:bg-green-700"
            >
              {isPixLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Pagar R$ 1,00 com PIX
                </>
              )}
            </Button>

            <Button
              onClick={handleCardPayment}
              disabled={isPixLoading || isCardLoading}
              variant="outline"
              className="w-full h-12"
            >
              {isCardLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar R$ 1,00 com Cartão
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Página de teste - não usar em produção
          </p>
        </CardContent>
      </Card>

      {paymentData && (
        <PremiumPixModal
          isOpen={isPixModalOpen}
          onClose={() => {
            setIsPixModalOpen(false)
            setPaymentData(null)
          }}
          paymentData={{
            paymentId: paymentData.paymentId,
            qrCode: paymentData.qrCode,
            qrCodeText: paymentData.qrCodeText,
            amount: paymentData.amount,
            planType: "bundle_monthly",
            expiresAt: paymentData.expiresAt,
            isGuest: true,
            payerEmail: email,
          }}
        />
      )}
    </div>
  )
}
