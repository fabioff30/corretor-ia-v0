"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { PixCopyButton } from "@/components/pix-copy-button"
import {
  QrCode,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Smartphone,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendGA4Event } from "@/utils/gtm-helper"
import { useRouter } from "next/navigation"
import { obfuscateIdentifier } from "@/utils/analytics"
import { useIsMobile } from "@/hooks/use-mobile"

interface PixPaymentData {
  paymentId: string
  qrCode: string
  qrCodeText: string
  amount: number
  planType: 'monthly' | 'annual'
  expiresAt: string
  payerEmail?: string
  isGuest: boolean
}

interface PremiumPixModalProps {
  isOpen: boolean
  onClose: () => void
  paymentData: PixPaymentData | null
  onSuccess?: () => void
}

export function PremiumPixModal({
  isOpen,
  onClose,
  paymentData,
  onSuccess,
}: PremiumPixModalProps) {
  const [status, setStatus] = useState<'waiting' | 'checking' | 'success' | 'error' | 'awaitingActivation'>('waiting')
  const [timeLeft, setTimeLeft] = useState<number>(1800) // 30 minutes in seconds
  const [isActivating, setIsActivating] = useState(false)
  const [activationError, setActivationError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const isMobile = useIsMobile()
  const statusRef = useRef(status)
  const redirectTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
    }
  }, [])

  const completeActivation = useCallback(async (options: { manual: boolean }) => {
    if (!paymentData) {
      return
    }

    const anonymizedPayment = await obfuscateIdentifier(paymentData.paymentId, 'pid')

    setStatus('success')

    sendGA4Event('purchase', {
      transaction_id: anonymizedPayment,
      value: paymentData.amount,
      currency: 'BRL',
      payment_method: 'pix',
      items: [{
        item_id: paymentData.planType === 'monthly' ? 'premium_monthly' : 'premium_annual',
        item_name: paymentData.planType === 'monthly' ? 'Premium Mensal' : 'Premium Anual',
        price: paymentData.amount,
        quantity: 1,
      }],
    })

    const successMessage = paymentData.isGuest
      ? "Pagamento confirmado! Vamos criar sua senha para ativar o Premium."
      : "Seu plano Premium foi ativado com sucesso."

    toast({
      title: "✅ Pagamento confirmado!",
      description: successMessage,
    })

    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current)
    }

    redirectTimeoutRef.current = window.setTimeout(() => {
      onSuccess?.()

      // Mobile + logged in: redirect to home
      if (isMobile && !paymentData.isGuest) {
        router.push('/')
      } else {
        // Desktop or guest: current behavior (success page)
        const query = new URLSearchParams({
          paymentId: paymentData.paymentId,
          plan: paymentData.planType,
          amount: paymentData.amount.toString(),
        })

        if (paymentData.payerEmail) {
          query.set('email', paymentData.payerEmail)
        }

        if (paymentData.isGuest) {
          query.set('guest', '1')
        }

        router.push(`/premium/pix-sucesso?${query.toString()}`)
      }
    }, 2000)
  }, [onSuccess, paymentData, router, toast, isMobile])

  // Timer countdown
  useEffect(() => {
    if (!isOpen || !paymentData || status !== 'waiting') return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setStatus('error')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, paymentData, status])

  // Check payment status and profile activation
  useEffect(() => {
    if (!isOpen || !paymentData) {
      return
    }

    if (statusRef.current === 'success' || statusRef.current === 'error' || statusRef.current === 'awaitingActivation') {
      return
    }

    let isCancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null
    let checkCount = 0
    const maxChecks = 36 // 36 checks * 5s = 3 minutes timeout

    const checkPayment = async () => {
      if (isCancelled || !paymentData || statusRef.current === 'success' || statusRef.current === 'error') {
        return
      }

      checkCount++

      // Timeout after 3 minutes (36 checks)
      if (checkCount > maxChecks) {
        console.log('[PIX Modal] Timeout reached after 3 minutes')
        setStatus('error')
        toast({
          title: "Verificação prolongada",
          description: "O pagamento está demorando mais que o esperado. Entre em contato com o suporte se já pagou.",
          variant: "destructive",
        })
        if (intervalId) {
          clearInterval(intervalId)
        }
        return
      }

      setStatus(current => (current === 'checking' ? current : 'checking'))

      try {
        // Use new verification endpoint that checks BOTH payment AND profile activation
        const response = await fetch(
          `/api/verify-pix-activation?paymentId=${paymentData.paymentId}`,
          {
            credentials: "include",
          }
        )

        if (!response.ok) {
          throw new Error('Failed to check payment status')
        }

        const data = await response.json()

        if (isCancelled) {
          return
        }

        console.log('[PIX Modal] Verification result:', {
          paymentApproved: data.paymentApproved,
          profileActivated: data.profileActivated,
          subscriptionCreated: data.subscriptionCreated,
          ready: data.ready,
          checkCount,
        })

        // Only proceed if EVERYTHING is ready (payment + profile + subscription)
        if (data.ready) {
          await completeActivation({ manual: false })
          if (intervalId) {
            clearInterval(intervalId)
          }
        } else if (data.paymentApproved && !data.profileActivated) {
          console.log('[PIX Modal] Payment approved, waiting for profile activation...')
          setStatus('awaitingActivation')
          if (intervalId) {
            clearInterval(intervalId)
          }
        } else {
          // Payment not yet approved
          setStatus('waiting')
        }
      } catch (error) {
        console.error('Error checking payment:', error)
        if (!isCancelled) {
          setStatus('waiting')
        }
      }
    }

    void checkPayment()
    intervalId = setInterval(() => {
      void checkPayment()
    }, 5000)

    return () => {
      isCancelled = true
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isOpen, paymentData, completeActivation])

  const handleManualActivation = useCallback(async () => {
    if (!paymentData) return

    setIsActivating(true)
    setActivationError(null)

    try {
      sendGA4Event('pix_manual_activation_attempt', {
        plan: paymentData.planType,
        guest: paymentData.isGuest,
      })

      const response = await fetch('/api/mercadopago/activate-pix-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: paymentData.paymentId,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error || 'Não foi possível ativar o plano. Tente novamente.'
        setActivationError(message)
        toast({
          title: 'Erro ao ativar assinatura',
          description: message,
          variant: 'destructive',
        })
        return
      }

      await completeActivation({ manual: true })
    } catch (error) {
      console.error('[PIX Modal] Manual activation error:', error)
      const message = 'Erro inesperado ao ativar. Tente novamente.'
      setActivationError(message)
      toast({
        title: 'Erro ao ativar assinatura',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsActivating(false)
    }
  }, [completeActivation, paymentData, toast])

  const handleRefreshStatus = useCallback(async () => {
    if (!paymentData) return

    setStatus('checking')
    setActivationError(null)

    try {
      const response = await fetch(
        `/api/verify-pix-activation?paymentId=${paymentData.paymentId}`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to recheck payment status')
      }

      const data = await response.json()

      if (data.ready) {
        await completeActivation({ manual: false })
      } else if (data.paymentApproved) {
        setStatus('awaitingActivation')
      } else {
        setStatus('waiting')
      }
    } catch (error) {
      console.error('[PIX Modal] Error refreshing status:', error)
      setStatus('awaitingActivation')
      setActivationError('Não foi possível verificar o status agora.')
    }
  }, [completeActivation, paymentData])

  // Track when QR is displayed
  useEffect(() => {
    if (!isOpen || !paymentData) {
      return
    }

    let isMounted = true

    const trackDisplay = async () => {
      const anonymizedPayment = await obfuscateIdentifier(paymentData.paymentId, 'pid')
      if (!isMounted) {
        return
      }

      sendGA4Event('pix_qr_displayed', {
        transaction_id: anonymizedPayment,
        plan: paymentData.planType,
        value: paymentData.amount,
        currency: 'BRL',
      })
    }

    void trackDisplay()

    return () => {
      isMounted = false
    }
  }, [isOpen, paymentData])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleClose = () => {
    if (status === 'success') {
      return // Don't allow closing on success
    }

    const logCancellation = async () => {
      const anonymizedPayment = await obfuscateIdentifier(paymentData?.paymentId, 'pid')
      sendGA4Event('pix_payment_canceled', {
        transaction_id: anonymizedPayment,
        plan: paymentData?.planType,
        currency: 'BRL',
      })
    }

    void logCancellation()

    onClose()
  }

  if (!paymentData) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {status !== 'success' && status !== 'awaitingActivation' && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-green-600" />
            Pagamento via PIX
          </DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? "Pagamento confirmado! Redirecionando..."
              : `Escaneie o QR Code ou copie o código PIX para pagar R$ ${paymentData.amount.toFixed(2)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 animate-pulse" />
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">
                  Pagamento confirmado!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu plano {paymentData.planType === 'monthly' ? 'mensal' : 'anual'} foi ativado.
                </p>
              </div>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : status === 'awaitingActivation' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-green-600">
                  Pagamento confirmado!
                </p>
                <p className="text-sm text-muted-foreground">
                  Clique abaixo para ativar sua assinatura Premium. Se o problema persistir, entre em contato com o suporte.
                </p>
                {activationError && (
                  <p className="text-xs text-red-500">{activationError}</p>
                )}
              </div>
              <div className="flex flex-col items-center gap-3 w-full">
                <Button
                  className="w-full"
                  onClick={handleManualActivation}
                  disabled={isActivating}
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ativando assinatura...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Ativar assinatura
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRefreshStatus} disabled={isActivating}>
                  Rechecar status
                </Button>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-600" />
              <div className="text-center">
                <p className="text-lg font-semibold text-red-600">
                  PIX expirado
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  O tempo limite foi excedido. Por favor, tente novamente.
                </p>
              </div>
              <Button onClick={onClose} variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              {/* Timer */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Tempo restante:</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : ''}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <Card className="border-2 border-green-600">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    {paymentData.qrCode ? (
                      <img
                        src={`data:image/png;base64,${paymentData.qrCode}`}
                        alt="QR Code PIX"
                        className="w-64 h-64 object-contain"
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      Aponte a câmera do seu banco para o QR Code
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* PIX Copy Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ou copie o código PIX:</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                    {paymentData.qrCodeText || 'Carregando...'}
                  </div>
                  <PixCopyButton
                    pixKey={paymentData.qrCodeText || ''}
                    label="Código PIX copiado! Cole no seu app de banco."
                  />
                </div>
              </div>

              {/* Status */}
              {status === 'checking' && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    <p className="font-medium">Verificando pagamento e ativação...</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Aguarde enquanto confirmamos seu pagamento e ativamos seu plano Premium.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p className="font-medium">Como pagar:</p>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>Abra o app do seu banco</li>
                    <li>Escolha pagar com PIX</li>
                    <li>Escaneie o QR Code ou cole o código</li>
                    <li>Confirme o pagamento de R$ {paymentData.amount.toFixed(2)}</li>
                    <li>Aguarde a confirmação automática</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* Plan info */}
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Plano selecionado:</strong> Premium {paymentData.planType === 'monthly' ? 'Mensal' : 'Anual'}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Após o pagamento, seu plano será ativado automaticamente.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
