"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Gift, Check, AlertCircle, Loader2, PartyPopper, User, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackgroundGradient } from "@/components/background-gradient"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import type { VerifyGiftResponse, RedeemGiftResponse } from "@/lib/gift/types"
import Confetti from "react-confetti"

export default function GiftRedeemPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { user, isLoading: isUserLoading } = useUser()
  const { toast } = useToast()

  const [isVerifying, setIsVerifying] = useState(true)
  const [giftData, setGiftData] = useState<VerifyGiftResponse | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isRedeemed, setIsRedeemed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Verify gift code on mount
  useEffect(() => {
    const verifyGift = async () => {
      try {
        const response = await fetch(`/api/gift/verify?code=${code}`)
        const data: VerifyGiftResponse = await response.json()
        setGiftData(data)
      } catch (error) {
        console.error('[Gift Redeem] Error verifying code:', error)
        setGiftData({ valid: false, error: 'Erro ao verificar codigo' })
      } finally {
        setIsVerifying(false)
      }
    }

    if (code) {
      verifyGift()
    }
  }, [code])

  const handleRedeem = async () => {
    if (!user) {
      toast({
        title: 'Login necessario',
        description: 'Faca login ou crie uma conta para resgatar seu presente',
        variant: 'destructive',
      })
      return
    }

    setIsRedeeming(true)

    try {
      const response = await fetch('/api/gift/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data: RedeemGiftResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao resgatar presente')
      }

      setIsRedeemed(true)
      setShowConfetti(true)

      toast({
        title: 'Presente resgatado!',
        description: `Seu plano ${data.plan_type === 'lifetime' ? 'Vitalicio' : 'Premium'} foi ativado`,
      })

      // Stop confetti after a few seconds
      setTimeout(() => setShowConfetti(false), 5000)

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (error) {
      console.error('[Gift Redeem] Error:', error)
      toast({
        title: 'Erro ao resgatar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  if (isVerifying || isUserLoading) {
    return (
      <>
        <BackgroundGradient />
        <main className="container mx-auto py-12 px-4">
          <div className="max-w-lg mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Verificando codigo do presente...</p>
          </div>
        </main>
      </>
    )
  }

  // Gift not valid
  if (!giftData?.valid) {
    return (
      <>
        <BackgroundGradient />
        <main className="container mx-auto py-12 px-4">
          <div className="max-w-lg mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <CardTitle>Codigo invalido</CardTitle>
                <CardDescription>
                  {giftData?.error || 'Este codigo de presente nao e valido ou ja foi utilizado'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {giftData?.gift?.already_redeemed && (
                  <div className="bg-muted rounded-lg p-4 mb-4 text-sm text-left">
                    <p className="font-medium mb-2">Detalhes do presente:</p>
                    <p>Plano: {giftData.gift.plan_name}</p>
                    <p>De: {giftData.gift.buyer_name}</p>
                    <p className="text-muted-foreground mt-2">Este presente ja foi resgatado anteriormente.</p>
                  </div>
                )}
                <Button asChild className="w-full">
                  <Link href="/">Voltar para o inicio</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    )
  }

  // Gift redeemed successfully
  if (isRedeemed) {
    return (
      <>
        <BackgroundGradient />
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
        <main className="container mx-auto py-12 px-4">
          <div className="max-w-lg mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <PartyPopper className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-4"
            >
              Presente resgatado!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-muted-foreground mb-8"
            >
              Seu plano Premium foi ativado. Aproveite todos os recursos!
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button asChild size="lg" className="w-full">
                <Link href="/dashboard">
                  Acessar meu dashboard
                </Link>
              </Button>
            </motion.div>
          </div>
        </main>
      </>
    )
  }

  // Show gift details and redeem button
  const gift = giftData.gift!

  return (
    <>
      <BackgroundGradient />
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Gift className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Voce recebeu um presente!</CardTitle>
              <CardDescription>
                <span className="font-medium">{gift.buyer_name}</span> enviou um presente para voce
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gift Details */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg">{gift.plan_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {gift.duration_months === -1
                        ? 'Acesso vitalicio'
                        : `${gift.duration_months} ${gift.duration_months === 1 ? 'mes' : 'meses'} de acesso`}
                    </p>
                  </div>
                  <div className="text-4xl">🎁</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Incluso no presente:</p>
                <ul className="space-y-2 text-sm">
                  {[
                    'Correcoes ilimitadas',
                    'Reescritas ilimitadas',
                    'Analise de IA ilimitada',
                    'Ate 20.000 caracteres por texto',
                    'Sem anuncios',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expiration */}
              {gift.expires_at && (
                <p className="text-xs text-center text-muted-foreground">
                  Codigo valido ate {new Date(gift.expires_at).toLocaleDateString('pt-BR')}
                </p>
              )}

              {/* Action */}
              {user ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resgatando...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Resgatar meu presente
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground">
                    Faca login ou crie uma conta para resgatar seu presente
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button asChild variant="outline">
                      <Link href={`/auth/login?redirect=/presente/${code}`}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Entrar
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/auth/register?redirect=/presente/${code}`}>
                        <User className="h-4 w-4 mr-2" />
                        Criar conta
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Festive decoration */}
          <div className="mt-8 text-center text-4xl">
            🎄 ⭐ 🎄
          </div>
        </div>
      </main>
    </>
  )
}
