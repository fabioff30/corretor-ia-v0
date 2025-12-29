"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  MessageCircle,
  PenTool,
  Check,
  Loader2,
  QrCode,
  Gift,
  Zap,
  Crown,
  CreditCard,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WhatsAppInput, validateWhatsAppPhone } from "./whatsapp-input"
import { PremiumPixModal } from "@/components/premium-pix-modal"
import { RegisterForBundleDialog } from "./register-for-bundle-dialog"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { cn } from "@/lib/utils"

interface BundlePricingCardProps {
  className?: string
}

export function BundlePricingCard({ className }: BundlePricingCardProps) {
  const [whatsapp, setWhatsapp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCardLoading, setIsCardLoading] = useState(false)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [whatsappError, setWhatsappError] = useState("")
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)
  const pixGeneratedRef = useRef(false)

  const { user, profile } = useUser()
  const { toast } = useToast()

  // Get email from user if logged in
  const userEmail = user?.email || profile?.email || ""

  // Create PIX payment
  const createPixPayment = useCallback(async (whatsappPhone?: string) => {
    const phoneToUse = whatsappPhone || whatsapp

    if (pixGeneratedRef.current || isLoading) return

    // Validate WhatsApp
    const whatsappValidation = validateWhatsAppPhone(phoneToUse)
    if (!whatsappValidation.isValid) {
      setWhatsappError(whatsappValidation.message || "WhatsApp inválido")
      return
    }

    // Must be logged in at this point
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar logado para gerar o PIX",
      })
      return
    }

    // Track begin checkout
    sendGTMEvent({
      event: "begin_checkout",
      currency: "BRL",
      value: 19.90,
      items: [
        { item_name: "CorretorIA Premium", item_category: "bundle" },
        { item_name: "Julinho Premium", item_category: "bundle" },
      ],
      coupon: "FIMDEANO2025",
    })

    setIsLoading(true)
    pixGeneratedRef.current = true

    try {
      const response = await fetch("/api/mercadopago/create-pix-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: "bundle_monthly",
          userEmail: userEmail,
          whatsappPhone: phoneToUse,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar pagamento")
      }

      setPaymentData(data)
      setIsPixModalOpen(true)

      // Track PIX generated
      sendGTMEvent({
        event: "add_payment_info",
        payment_type: "pix",
        value: 19.90,
        currency: "BRL",
      })
    } catch (error) {
      console.error("Error creating bundle payment:", error)
      toast({
        variant: "destructive",
        title: "Erro ao gerar PIX",
        description:
          error instanceof Error ? error.message : "Tente novamente em instantes",
      })
      pixGeneratedRef.current = false
    } finally {
      setIsLoading(false)
    }
  }, [whatsapp, user, userEmail, isLoading, toast])

  // Auto-generate PIX after registration
  useEffect(() => {
    if (!justRegistered || !user) return

    const pendingWhatsApp = localStorage.getItem('pendingBundleWhatsApp')
    if (pendingWhatsApp && !pixGeneratedRef.current) {
      localStorage.removeItem('pendingBundleWhatsApp')
      setJustRegistered(false)
      setWhatsapp(pendingWhatsApp)

      // Small delay to ensure user state is fully updated
      setTimeout(() => {
        createPixPayment(pendingWhatsApp)
      }, 500)
    }
  }, [user, justRegistered, createPixPayment])

  const handleSubmit = async () => {
    // Reset errors
    setWhatsappError("")

    // Validate WhatsApp
    const whatsappValidation = validateWhatsAppPhone(whatsapp)
    if (!whatsappValidation.isValid) {
      setWhatsappError(whatsappValidation.message || "WhatsApp inválido")
      return
    }

    // If not logged in, open registration dialog
    if (!user) {
      localStorage.setItem('pendingBundleWhatsApp', whatsapp)
      setIsRegisterDialogOpen(true)
      return
    }

    // User is logged in, generate PIX directly
    await createPixPayment()
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

  const handleCardPayment = async () => {
    // Prevent double submission
    if (isCardLoading || isLoading) return

    // Reset errors
    setWhatsappError("")

    // Validate WhatsApp
    const whatsappValidation = validateWhatsAppPhone(whatsapp)
    if (!whatsappValidation.isValid) {
      setWhatsappError(whatsappValidation.message || "WhatsApp inválido")
      return
    }

    // If not logged in, open registration dialog
    if (!user) {
      localStorage.setItem('pendingBundleWhatsApp', whatsapp)
      localStorage.setItem('pendingBundlePaymentMethod', 'card')
      setIsRegisterDialogOpen(true)
      return
    }

    // Track begin checkout
    sendGTMEvent({
      event: "begin_checkout",
      currency: "BRL",
      value: 19.90,
      items: [
        { item_name: "CorretorIA Premium", item_category: "bundle" },
        { item_name: "Julinho Premium", item_category: "bundle" },
      ],
      coupon: "FIMDEANO2025",
      payment_method: "card",
    })

    setIsCardLoading(true)

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: "bundle_monthly",
          userEmail: userEmail,
          userId: user?.id,
          whatsappPhone: whatsapp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar sessão de pagamento")
      }

      // Track payment info
      sendGTMEvent({
        event: "add_payment_info",
        payment_type: "card",
        value: 19.90,
        currency: "BRL",
      })

      // Redirect to Stripe Checkout
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
        description:
          error instanceof Error ? error.message : "Tente novamente em instantes",
      })
    } finally {
      setIsCardLoading(false)
    }
  }

  const features = [
    {
      icon: PenTool,
      title: "CorretorIA Premium",
      items: [
        "Correções ilimitadas",
        "Até 20.000 caracteres",
        "Análise de estilo avançada",
        "Sem anúncios",
      ],
    },
    {
      icon: MessageCircle,
      title: "Julinho Premium",
      items: [
        "Mensagens ilimitadas",
        "Correção via WhatsApp",
        "Respostas instantâneas",
        "Suporte prioritário",
      ],
    },
  ]

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={cn("w-full max-w-2xl mx-auto", className)}
      >
        <Card className="relative overflow-hidden border-2 border-amber-400/50 bg-gradient-to-br from-background via-background to-amber-950/10 shadow-2xl shadow-amber-500/10">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/20 to-transparent rounded-tr-full" />

          {/* Badge */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 blur-md opacity-50" />
              <div className="relative bg-gradient-to-r from-amber-400 to-amber-500 text-black px-6 py-1.5 rounded-b-xl font-bold text-sm flex items-center gap-2">
                <Gift className="h-4 w-4" />
                OFERTA EXCLUSIVA
              </div>
            </div>
          </div>

          <CardHeader className="pt-12 pb-4 text-center">
            <CardTitle className="text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
                2 Produtos pelo Preço de 1
              </span>
            </CardTitle>

            {/* Pricing */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg text-muted-foreground line-through">
                  R$ 39,80
                </span>
                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-sm font-semibold">
                  50% OFF
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-sm text-muted-foreground">R$</span>
                <span className="text-6xl md:text-7xl font-black bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                  19
                </span>
                <span className="text-3xl font-bold text-foreground/70">,90</span>
                <span className="text-muted-foreground ml-1">/mês</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Preço promocional travado
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* Features grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((product) => (
                <div
                  key={product.title}
                  className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <product.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm">{product.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {product.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              {/* Show logged in user email */}
              {user && userEmail && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email da conta
                  </Label>
                  <div className="h-12 px-4 flex items-center rounded-md bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                    {userEmail}
                  </div>
                </div>
              )}

              <WhatsAppInput
                value={whatsapp}
                onChange={(value) => {
                  setWhatsapp(value)
                  setWhatsappError("")
                }}
                error={whatsappError}
                disabled={isLoading}
              />

              {/* Payment buttons */}
              <div className="space-y-3">
                {/* PIX button (primary) */}
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || isCardLoading}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:via-amber-300 hover:to-amber-400 text-black shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-5 w-5" />
                      Pagar com PIX
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                {/* Card button (secondary) */}
                <Button
                  onClick={handleCardPayment}
                  disabled={isLoading || isCardLoading}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold border-white/20 hover:bg-white/5 hover:border-white/30 transition-all duration-300"
                >
                  {isCardLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pagar com Cartão
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {user
                  ? "Assinatura mensal. Acesso imediato após confirmação."
                  : "Crie sua conta para continuar com o pagamento."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Registration Dialog */}
      <RegisterForBundleDialog
        isOpen={isRegisterDialogOpen}
        onClose={() => setIsRegisterDialogOpen(false)}
        onSuccess={handleRegisterSuccess}
        whatsappPhone={whatsapp}
        planPrice={19.90}
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
            planType: 'bundle_monthly',
            expiresAt: paymentData.expiresAt,
            isGuest: false, // Always false now - user must be logged in
            payerEmail: userEmail,
          }}
        />
      )}
    </>
  )
}
