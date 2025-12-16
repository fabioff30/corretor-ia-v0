"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Gift, Snowflake, ChevronRight, QrCode, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { CHRISTMAS_GIFT_CONFIG, getGiftPlansArray, formatGiftPrice, getDiscountPercentage } from "@/lib/gift/config"
import type { GiftPlanId, GiftFormData, GiftFormErrors, CreateGiftResponse } from "@/lib/gift/types"
import { GiftPixModal } from "./gift-pix-modal"

interface SnowflakeData {
  id: number
  left: string
  delay: number
  duration: number
}

export function GiftPageContent() {
  const [step, setStep] = useState<'plan' | 'form' | 'payment'>('plan')
  const [selectedPlan, setSelectedPlan] = useState<GiftPlanId | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [pixData, setPixData] = useState<CreateGiftResponse | null>(null)
  const [snowflakes, setSnowflakes] = useState<SnowflakeData[]>([])
  const { toast } = useToast()

  // Generate snowflakes only on client to avoid hydration mismatch
  useEffect(() => {
    setSnowflakes(
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 5,
      }))
    )
  }, [])

  const [formData, setFormData] = useState<GiftFormData>({
    buyerName: '',
    buyerEmail: '',
    recipientName: '',
    recipientEmail: '',
    planId: 'annual',
    giftMessage: 'Feliz Natal! 🎄 Agora voce nao tem mais desculpa pra escrever "menas" 😄',
    paymentMethod: 'pix',
  })

  const [errors, setErrors] = useState<GiftFormErrors>({})

  const plans = getGiftPlansArray()

  const validateForm = (): boolean => {
    const newErrors: GiftFormErrors = {}

    if (!formData.buyerName.trim()) {
      newErrors.buyerName = 'Nome e obrigatorio'
    }

    if (!formData.buyerEmail.trim()) {
      newErrors.buyerEmail = 'Email e obrigatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail)) {
      newErrors.buyerEmail = 'Email invalido'
    }

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Nome do presenteado e obrigatorio'
    }

    if (!formData.recipientEmail.trim()) {
      newErrors.recipientEmail = 'Email do presenteado e obrigatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      newErrors.recipientEmail = 'Email invalido'
    }

    if (formData.buyerEmail.toLowerCase() === formData.recipientEmail.toLowerCase()) {
      newErrors.recipientEmail = 'O email do presenteado deve ser diferente do seu'
    }

    if (formData.giftMessage.length > CHRISTMAS_GIFT_CONFIG.MAX_MESSAGE_LENGTH) {
      newErrors.giftMessage = `Mensagem muito longa (max ${CHRISTMAS_GIFT_CONFIG.MAX_MESSAGE_LENGTH} caracteres)`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePlanSelect = (planId: GiftPlanId) => {
    setSelectedPlan(planId)
    setFormData(prev => ({ ...prev, planId }))
    setStep('form')
  }

  const handleFormSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/gift/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: formData.buyerName,
          buyer_email: formData.buyerEmail,
          recipient_name: formData.recipientName,
          recipient_email: formData.recipientEmail,
          plan_id: formData.planId,
          gift_message: formData.giftMessage || undefined,
          payment_method: 'pix',
        }),
      })

      const data: CreateGiftResponse = await response.json()

      if (!data.success || !data.pix_qr_code_base64) {
        throw new Error(data.error || 'Erro ao criar presente')
      }

      setPixData(data)
      setIsPixModalOpen(true)
    } catch (error) {
      console.error('[Gift] Error creating gift:', error)
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePixSuccess = () => {
    setIsPixModalOpen(false)
    // Redirect to success page
    if (pixData?.gift_id) {
      window.location.href = `/presente/sucesso?id=${pixData.gift_id}`
    }
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Animated Snowflakes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {snowflakes.map((flake) => (
          <motion.div
            key={flake.id}
            className="absolute text-white/20"
            initial={{ y: -20, x: flake.left }}
            animate={{ y: '100vh' }}
            transition={{
              duration: flake.duration,
              repeat: Infinity,
              delay: flake.delay,
              ease: 'linear',
            }}
            style={{ left: flake.left }}
          >
            <Snowflake className="h-4 w-4" />
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full mb-4">
          <Gift className="h-5 w-5" />
          <span className="font-medium">Presente de Natal</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Presenteie quem voce ama com o <span className="text-primary">CorretorIA Premium</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Escolha um plano, preencha os dados e envie um presente especial.
          O presenteado recebera um email com o codigo de resgate.
        </p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {['Plano', 'Dados', 'Pagamento'].map((label, index) => {
          const stepIndex = ['plan', 'form', 'payment'].indexOf(step)
          const isActive = index <= stepIndex
          const isCurrent = index === stepIndex

          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                  isActive
                    ? isCurrent
                      ? 'bg-primary text-white'
                      : 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < stepIndex ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {index < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Plan Selection */}
      {step === 'plan' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {plans.map((plan) => {
            const discount = getDiscountPercentage(plan)
            return (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  plan.popular ? 'border-primary shadow-md ring-2 ring-primary/20' : ''
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    MAIS POPULAR
                  </div>
                )}
                {'badge' in plan && plan.badge && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <CardHeader className="relative pt-6">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    {'original_price' in plan && plan.original_price && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatGiftPrice(plan.original_price)}
                      </div>
                    )}
                    <div className="text-3xl font-bold text-primary">
                      {formatGiftPrice(plan.price)}
                    </div>
                    {discount && (
                      <div className="text-sm text-green-600 font-medium">
                        Economia de {discount}%
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-4"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Escolher este plano
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>
      )}

      {/* Step 2: Form */}
      {step === 'form' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Dados do Presente</CardTitle>
              <CardDescription>
                Preencha seus dados e os dados de quem vai receber o presente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buyer Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Seus dados</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyerName">Seu nome</Label>
                    <Input
                      id="buyerName"
                      placeholder="Seu nome completo"
                      value={formData.buyerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyerName: e.target.value }))}
                      className={errors.buyerName ? 'border-red-500' : ''}
                    />
                    {errors.buyerName && (
                      <p className="text-xs text-red-500">{errors.buyerName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerEmail">Seu email</Label>
                    <Input
                      id="buyerEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.buyerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyerEmail: e.target.value }))}
                      className={errors.buyerEmail ? 'border-red-500' : ''}
                    />
                    {errors.buyerEmail && (
                      <p className="text-xs text-red-500">{errors.buyerEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recipient Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Dados do presenteado</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Nome do presenteado</Label>
                    <Input
                      id="recipientName"
                      placeholder="Nome de quem vai receber"
                      value={formData.recipientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                      className={errors.recipientName ? 'border-red-500' : ''}
                    />
                    {errors.recipientName && (
                      <p className="text-xs text-red-500">{errors.recipientName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Email do presenteado</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="email@presenteado.com"
                      value={formData.recipientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      className={errors.recipientEmail ? 'border-red-500' : ''}
                    />
                    {errors.recipientEmail && (
                      <p className="text-xs text-red-500">{errors.recipientEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Gift Message */}
              <div className="space-y-2">
                <Label htmlFor="giftMessage">Mensagem personalizada (opcional)</Label>
                <Textarea
                  id="giftMessage"
                  placeholder="Escreva uma mensagem especial..."
                  value={formData.giftMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, giftMessage: e.target.value }))}
                  className={errors.giftMessage ? 'border-red-500' : ''}
                  rows={3}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {errors.giftMessage ? (
                    <p className="text-red-500">{errors.giftMessage}</p>
                  ) : (
                    <span>Esta mensagem aparecera no email do presenteado</span>
                  )}
                  <span>{formData.giftMessage.length}/{CHRISTMAS_GIFT_CONFIG.MAX_MESSAGE_LENGTH}</span>
                </div>
              </div>

              {/* Selected Plan Summary */}
              {selectedPlan && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{CHRISTMAS_GIFT_CONFIG.PLANS[selectedPlan].name}</p>
                      <p className="text-sm text-muted-foreground">
                        {CHRISTMAS_GIFT_CONFIG.PLANS[selectedPlan].description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {formatGiftPrice(CHRISTMAS_GIFT_CONFIG.PLANS[selectedPlan].price)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('plan')}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleFormSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Pagar com PIX
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* PIX Modal */}
      {pixData && (
        <GiftPixModal
          isOpen={isPixModalOpen}
          onClose={() => setIsPixModalOpen(false)}
          pixData={pixData}
          recipientName={formData.recipientName}
          onSuccess={handlePixSuccess}
        />
      )}
    </div>
  )
}
