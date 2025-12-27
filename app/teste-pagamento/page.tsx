"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, QrCode, CreditCard, Mail, AlertCircle } from "lucide-react"
import { WhatsAppInput, validateWhatsAppPhone } from "@/components/bundle/whatsapp-input"
import { PremiumPixModal } from "@/components/premium-pix-modal"
import { RegisterForBundleDialog } from "@/components/bundle/register-for-bundle-dialog"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Test price ID for R$1 subscription
const TEST_STRIPE_PRICE_ID = "price_1Sj3cSAaDWyHAlql4Z3Ns6T8"

export default function TestePagemento() {
  const [whatsapp, setWhatsapp] = useState("")
  const [whatsappError, setWhatsappError] = useState("")
  const [isPixLoading, setIsPixLoading] = useState(false)
  const [isCardLoading, setIsCardLoading] = useState(false)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)
  const pixGeneratedRef = useRef(false)

  const { user, profile } = useUser()
  const { toast } = useToast()

  const userEmail = user?.email || profile?.email || ""

  const validateForm = () => {
    setWhatsappError("")
    const whatsappValidation = validateWhatsAppPhone(whatsapp)
    if (!whatsappValidation.isValid) {
      setWhatsappError(whatsappValidation.message || "WhatsApp inválido")
      return false
    }
    return true
  }

  // Create PIX payment
  const createPixPayment = useCallback(async (whatsappPhone?: string) => {
    const phoneToUse = whatsappPhone || whatsapp

    if (pixGeneratedRef.current || isPixLoading) return

    // Validate WhatsApp
    const whatsappValidation = validateWhatsAppPhone(phoneToUse)
    if (!whatsappValidation.isValid) {
      setWhatsappError(whatsappValidation.message || "WhatsApp inválido")
      return
    }

    // Must be logged in
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar logado para gerar o PIX",
      })
      return
    }

    setIsPixLoading(true)
    pixGeneratedRef.current = true

    try {
      const response = await fetch("/api/mercadopago/create-pix-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: "bundle_monthly",
          userEmail: userEmail,
          whatsappPhone: phoneToUse,
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
      pixGeneratedRef.current = false
    } finally {
      setIsPixLoading(false)
    }
  }, [whatsapp, user, userEmail, isPixLoading, toast])

  // Auto-generate PIX after registration
  useEffect(() => {
    if (!justRegistered || !user) return

    const pendingWhatsApp = localStorage.getItem('pendingBundleWhatsApp')
    if (pendingWhatsApp && !pixGeneratedRef.current) {
      localStorage.removeItem('pendingBundleWhatsApp')
      setJustRegistered(false)
      setWhatsapp(pendingWhatsApp)

      setTimeout(() => {
        createPixPayment(pendingWhatsApp)
      }, 500)
    }
  }, [user, justRegistered, createPixPayment])

  const handlePixPayment = async () => {
    if (!validateForm()) return

    // If not logged in, open registration dialog
    if (!user) {
      localStorage.setItem('pendingBundleWhatsApp', whatsapp)
      setIsRegisterDialogOpen(true)
      return
    }

    // User is logged in, generate PIX directly
    await createPixPayment()
  }

  const handleCardPayment = async () => {
    if (!validateForm()) return

    // If not logged in, open registration dialog
    if (!user) {
      localStorage.setItem('pendingBundleWhatsApp', whatsapp)
      localStorage.setItem('pendingBundlePaymentMethod', 'card')
      setIsRegisterDialogOpen(true)
      return
    }

    setIsCardLoading(true)
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: "bundle_monthly_test", // Test plan type
          userEmail: userEmail,
          userId: user?.id,
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

  const handleRegisterSuccess = () => {
    setIsRegisterDialogOpen(false)
    setJustRegistered(true)
    toast({
      title: "Conta criada!",
      description: "Gerando seu QR Code PIX...",
    })
  }

  const handlePixModalClose = () => {
    setIsPixModalOpen(false)
    pixGeneratedRef.current = false
    setPaymentData(null)
  }

  return (
    <>
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
            {/* Auth status indicator */}
            {user ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email da conta
                </Label>
                <div className="h-10 px-3 flex items-center rounded-md bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                  {userEmail}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você precisará criar uma conta para completar o pagamento.
                </AlertDescription>
              </Alert>
            )}

            <WhatsAppInput
              value={whatsapp}
              onChange={(value) => {
                setWhatsapp(value)
                setWhatsappError("")
              }}
              error={whatsappError}
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
              {user
                ? "Página de teste - não usar em produção"
                : "Crie sua conta para continuar com o pagamento."
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Dialog */}
      <RegisterForBundleDialog
        isOpen={isRegisterDialogOpen}
        onClose={() => setIsRegisterDialogOpen(false)}
        onSuccess={handleRegisterSuccess}
        whatsappPhone={whatsapp}
        planPrice={1.00}
      />

      {/* PIX Modal */}
      {paymentData && (
        <PremiumPixModal
          isOpen={isPixModalOpen}
          onClose={handlePixModalClose}
          paymentData={{
            paymentId: paymentData.paymentId,
            qrCode: paymentData.qrCode,
            qrCodeText: paymentData.qrCodeText,
            amount: paymentData.amount,
            planType: "bundle_monthly",
            expiresAt: paymentData.expiresAt,
            isGuest: false, // Always false - user must be logged in
            payerEmail: userEmail,
          }}
        />
      )}
    </>
  )
}
