/**
 * Inline Register Form for Premium Payment
 * Shows registration form inline on the page instead of in a dialog
 * Eliminates scroll lock issues from multiple dialogs
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, User, Lock, CheckCircle2, ArrowLeft, CreditCard, QrCode, Phone } from 'lucide-react'
import { useUser } from "@/components/providers/user-provider"
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { formatPhoneNumber, normalizePhoneNumber } from '@/utils/phone-formatter'

interface InlineRegisterFormProps {
  planType: 'monthly' | 'annual'
  planPrice: number
  paymentMethod: 'pix' | 'card'
  onSuccess: () => void
  onCancel: () => void
}

export function InlineRegisterForm({
  planType,
  planPrice,
  paymentMethod,
  onSuccess,
  onCancel,
}: InlineRegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const { signUp, signInWithGoogle } = useUser()
  const { toast } = useToast()

  const planName = planType === 'monthly' ? 'Mensal' : 'Anual'
  const formattedPrice = planPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const paymentMethodText = paymentMethod === 'pix' ? 'PIX' : 'Cartão'
  const PaymentIcon = paymentMethod === 'pix' ? QrCode : CreditCard

  // Scroll to form when it appears
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsGoogleLoading(true)

    try {
      // Save pending plan to localStorage before redirect
      const storageKey = paymentMethod === 'pix' ? 'pendingPixPlan' : 'pendingCardPlan'
      localStorage.setItem(storageKey, JSON.stringify({
        planType,
        whatsappPhone: whatsapp ? normalizePhoneNumber(whatsapp) : null
      }))

      const { error: googleError } = await signInWithGoogle()

      if (googleError) {
        setError(googleError.message)
        toast({
          title: 'Erro ao conectar com Google',
          description: googleError.message,
          variant: 'destructive',
        })
        setIsGoogleLoading(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao conectar com Google'
      setError(message)
      toast({
        title: 'Erro ao conectar com Google',
        description: message,
        variant: 'destructive',
      })
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validations
    if (!name.trim()) {
      setError('Informe seu nome completo')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem')
      return
    }

    if (!acceptTerms) {
      setError('Você precisa aceitar os Termos de Uso')
      return
    }

    setIsSubmitting(true)

    try {
      const { error: signUpError } = await signUp(email, password, name)

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Save WhatsApp to localStorage for PIX payment creation
      const storageKey = paymentMethod === 'pix' ? 'pendingPixPlan' : 'pendingCardPlan'
      localStorage.setItem(storageKey, JSON.stringify({
        planType,
        whatsappPhone: whatsapp ? normalizePhoneNumber(whatsapp) : null
      }))

      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta'
      setError(message)
      toast({
        title: 'Erro ao criar conta',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div ref={formRef} className="max-w-md mx-auto mt-6 mb-8">
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 px-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </div>
          <CardTitle className="text-xl">Criar Conta para Continuar</CardTitle>
          <CardDescription className="text-sm">
            <span className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md">
              <PaymentIcon className="h-4 w-4 text-primary" />
              <span>
                Plano <strong>{planName}</strong> • {formattedPrice} • {paymentMethodText}
              </span>
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Google Sign-in Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 gap-3"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com o Google
              </>
            )}
          </Button>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card px-2 text-xs text-muted-foreground">
                ou cadastre-se com email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="inline-register-name">Nome completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inline-register-name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="inline-register-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inline-register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* WhatsApp (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="inline-register-whatsapp">
                WhatsApp <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inline-register-whatsapp"
                  type="tel"
                  placeholder="(85) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhoneNumber(e.target.value))}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Receba o Julinho IA no seu WhatsApp gratis por 30 dias!
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="inline-register-password">Senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inline-register-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className={password.length >= 6 ? 'text-green-600' : 'text-muted-foreground'}>
                  Mínimo de 6 caracteres
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="inline-register-confirm-password">Confirme a senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inline-register-confirm-password"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                />
              </div>
              {confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      password === confirmPassword && password.length > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span
                    className={
                      password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {password === confirmPassword && password.length > 0 ? 'Senhas conferem' : 'Senhas não conferem'}
                  </span>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1"
                  required
                  disabled={isSubmitting}
                />
                <span className="text-sm leading-relaxed">
                  Li e concordo com os{' '}
                  <Link href="/termos" className="text-primary underline font-medium" target="_blank">
                    Termos de Uso
                  </Link>{' '}
                  e com a{' '}
                  <Link href="/privacidade" className="text-primary underline font-medium" target="_blank">
                    Política de Privacidade
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !acceptTerms}
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Criar conta e continuar
                </>
              )}
            </Button>

            {/* Already have account */}
            <div className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary underline">
                Fazer login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
