/**
 * Banner to activate pending PIX payment
 * Shows when user has approved PIX payment but profile is still 'free'
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface PendingPixActivationBannerProps {
  paymentId: string
  amount: number
  planType: 'monthly' | 'annual'
  paidAt: string
  onActivated?: () => void
  className?: string
}

export function PendingPixActivationBanner({
  paymentId,
  amount,
  planType,
  paidAt,
  onActivated,
  className,
}: PendingPixActivationBannerProps) {
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const formattedAmount = amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const planName = planType === 'monthly' ? 'Mensal' : 'Anual'

  const handleActivate = async () => {
    setIsActivating(true)
    setError(null)

    try {
      const response = await fetch('/api/mercadopago/activate-pix-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao ativar assinatura')
      }

      const data = await response.json()

      toast({
        title: '✅ Assinatura ativada com sucesso!',
        description: 'Seu plano Premium foi ativado. Aproveite todos os recursos!',
      })

      // Call callback if provided
      if (onActivated) {
        onActivated()
      }

      // Refresh page to update UI
      router.refresh()

      // Redirect to dashboard after 1s
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao ativar assinatura',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800 ${className || ''}`}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                  Pagamento PIX Aprovado! 🎉
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Seu pagamento foi confirmado. Clique no botão abaixo para ativar seu plano Premium.
                </p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plano:</span>
                <span className="font-medium">Premium {planName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">{formattedAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ID do Pagamento:</span>
                <span className="font-mono text-xs">{paymentId}</span>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Button */}
            <Button
              onClick={handleActivate}
              disabled={isActivating}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg"
            >
              {isActivating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Ativar Assinatura Premium
                </>
              )}
            </Button>

            {/* Help Text */}
            <p className="text-xs text-center text-muted-foreground">
              Ao ativar, você terá acesso imediato a todos os recursos Premium
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
