/**
 * Register Dialog for PIX Payment
 * Forces user to create account BEFORE generating PIX QR Code
 * Eliminates orphaned guest payments
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, User, Lock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface RegisterForPixDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  planType: 'monthly' | 'annual'
  planPrice: number
}

export function RegisterForPixDialog({
  isOpen,
  onClose,
  onSuccess,
  planType,
  planPrice,
}: RegisterForPixDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signUp } = useAuth()
  const { toast } = useToast()

  const planName = planType === 'monthly' ? 'Mensal' : 'Anual'
  const formattedPrice = planPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

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

      toast({
        title: '✅ Conta criada com sucesso!',
        description: 'Gerando seu QR Code PIX...',
      })

      // Small delay to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 500))

      // Close dialog and trigger PIX generation
      onSuccess()
      onClose()
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Criar Conta para Continuar</DialogTitle>
          <DialogDescription className="text-base">
            Para gerar o PIX do plano <strong>{planName}</strong> ({formattedPrice}), precisamos que você crie sua
            conta primeiro. Assim garantimos que você possa ativar o plano após o pagamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="register-name">Nome completo *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-name"
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
            <Label htmlFor="register-email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-email"
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

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="register-password">Senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-password"
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
            <Label htmlFor="register-confirm-password">Confirme a senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-confirm-password"
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
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
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
                </Link>{' '}
                do CorretorIA.
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !acceptTerms} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Criar e Gerar PIX
                </>
              )}
            </Button>
          </DialogFooter>

          {/* Already have account */}
          <div className="text-center text-sm text-muted-foreground pt-2">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary underline" onClick={onClose}>
              Fazer login
            </Link>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
