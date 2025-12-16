"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Copy, Check, Clock, Gift, Loader2, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { CreateGiftResponse } from "@/lib/gift/types"

interface GiftPixModalProps {
  isOpen: boolean
  onClose: () => void
  pixData: CreateGiftResponse
  recipientName: string
  onSuccess: () => void
}

export function GiftPixModal({
  isOpen,
  onClose,
  pixData,
  recipientName,
  onSuccess,
}: GiftPixModalProps) {
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<'waiting' | 'approved' | 'error'>('waiting')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const { toast } = useToast()

  // Calculate time remaining
  useEffect(() => {
    if (!pixData.pix_expires_at) return

    const updateTimer = () => {
      const expiresAt = new Date(pixData.pix_expires_at!).getTime()
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
      setTimeLeft(remaining)

      if (remaining === 0) {
        setStatus('error')
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [pixData.pix_expires_at])

  // Poll for payment status
  useEffect(() => {
    if (!isOpen || !pixData.gift_id || status !== 'waiting') return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/gift/status?id=${pixData.gift_id}`)
        const data = await response.json()

        if (data.payment_confirmed) {
          setStatus('approved')
          // Wait a bit for the success animation, then trigger onSuccess
          setTimeout(() => {
            onSuccess()
          }, 2000)
        }
      } catch (error) {
        console.error('[Gift PIX] Error checking status:', error)
      }
    }

    // Check every 3 seconds
    const interval = setInterval(checkStatus, 3000)

    // Also check immediately
    checkStatus()

    return () => clearInterval(interval)
  }, [isOpen, pixData.gift_id, status, onSuccess])

  const handleCopy = async () => {
    if (!pixData.pix_copy_paste) return

    try {
      await navigator.clipboard.writeText(pixData.pix_copy_paste)
      setCopied(true)
      toast({
        title: 'Codigo copiado!',
        description: 'Cole no app do seu banco para pagar',
      })
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Tente selecionar e copiar manualmente',
        variant: 'destructive',
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {status === 'approved' ? 'Presente enviado!' : 'Pague com PIX'}
          </DialogTitle>
          <DialogDescription>
            {status === 'approved'
              ? `${recipientName} recebera um email com o codigo de resgate`
              : 'Escaneie o QR Code ou copie o codigo PIX'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {status === 'approved' ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
              >
                <PartyPopper className="h-10 w-10 text-green-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-green-600 mb-2">Pagamento confirmado!</h3>
              <p className="text-center text-muted-foreground">
                Um email foi enviado para <strong>{recipientName}</strong> com instrucoes para resgatar o presente.
              </p>
            </motion.div>
          ) : (
            <>
              {/* QR Code */}
              {pixData.pix_qr_code_base64 && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <Image
                      src={`data:image/png;base64,${pixData.pix_qr_code_base64}`}
                      alt="QR Code PIX"
                      width={200}
                      height={200}
                      className="rounded"
                    />
                  </div>
                </div>
              )}

              {/* Timer */}
              {timeLeft !== null && timeLeft > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expira em {formatTime(timeLeft)}</span>
                </div>
              )}

              {/* Copy Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopy}
                disabled={!pixData.pix_copy_paste}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar codigo PIX
                  </>
                )}
              </Button>

              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Aguardando pagamento...</span>
              </div>

              {/* Gift Code Preview */}
              {pixData.gift_code && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600 mb-1">Codigo do presente (apos pagamento)</p>
                  <p className="font-mono font-bold text-lg text-amber-700">{pixData.gift_code}</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
