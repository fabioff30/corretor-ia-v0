"use client"

import { useState, useEffect } from "react"
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
import { sendGTMEvent } from "@/utils/gtm-helper"
import { useRouter } from "next/navigation"

interface PixPaymentData {
  paymentId: string
  qrCode: string
  qrCodeText: string
  amount: number
  planType: 'monthly' | 'annual'
  expiresAt: string
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
  const [status, setStatus] = useState<'waiting' | 'checking' | 'success' | 'error'>('waiting')
  const [timeLeft, setTimeLeft] = useState<number>(1800) // 30 minutes in seconds
  const { toast } = useToast()
  const router = useRouter()

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

  // Check payment status
  useEffect(() => {
    if (!isOpen || !paymentData || status === 'success' || status === 'error') return

    const checkPayment = async () => {
      try {
        setStatus('checking')
        const response = await fetch(
          `/api/mercadopago/create-pix-payment?paymentId=${paymentData.paymentId}`
        )
        const data = await response.json()

        if (data.status === 'approved') {
          setStatus('success')
          sendGTMEvent('pix_payment_confirmed', {
            payment_id: paymentData.paymentId,
            plan: paymentData.planType,
            value: paymentData.amount,
          })

          toast({
            title: "✅ Pagamento confirmado!",
            description: "Seu plano Premium foi ativado com sucesso.",
          })

          setTimeout(() => {
            onSuccess?.()
            router.push('/dashboard/subscription')
          }, 2000)
        } else {
          setStatus('waiting')
        }
      } catch (error) {
        console.error('Error checking payment:', error)
        setStatus('waiting')
      }
    }

    // Check every 5 seconds
    const interval = setInterval(checkPayment, 5000)

    // Initial check
    checkPayment()

    return () => clearInterval(interval)
  }, [isOpen, paymentData, status, router, toast, onSuccess])

  // Track when QR is displayed
  useEffect(() => {
    if (isOpen && paymentData) {
      sendGTMEvent('pix_qr_displayed', {
        payment_id: paymentData.paymentId,
        plan: paymentData.planType,
        value: paymentData.amount,
      })
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

    sendGTMEvent('pix_payment_canceled', {
      payment_id: paymentData?.paymentId,
      plan: paymentData?.planType,
    })

    onClose()
  }

  if (!paymentData) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {status !== 'success' && (
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
                    Verificando pagamento...
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