/**
 * Página de Cadastro
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Sparkles, AlertTriangle, Check, X } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useUser } from '@/hooks/use-user'

export default function CadastroPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = formData.email.trim() !== '' && emailRegex.test(formData.email)
  const showEmailError = formData.email.trim() !== '' && !isEmailValid

  // Validação de senha
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  }

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (!formData.fullName.trim()) {
      setError('Informe seu nome completo.')
      return
    }

    if (!formData.email.trim()) {
      setError('Informe seu email.')
      return
    }

    if (!isEmailValid) {
      setError('Digite um email válido (ex: nome@email.com)')
      return
    }

    if (!acceptedTerms) {
      setError('Você precisa aceitar os Termos de Uso e Política de Privacidade.')
      return
    }

    if (!isPasswordValid) {
      setError('A senha não atende aos requisitos mínimos.')
      return
    }

    if (!passwordsMatch) {
      setError('As senhas não coincidem.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        fetch('/api/emails/welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            name: formData.fullName,
          }),
          signal: controller.signal,
        }).catch((welcomeError) => {
          console.error('Erro ao enviar email de boas-vindas:', welcomeError)
        }).finally(() => {
          clearTimeout(timeout)
        })
      }

      // Verificar se precisa confirmar email
      if (data.user && !data.session) {
        toast({
          title: 'Confirme seu email',
          description: 'Enviamos um link de confirmação para seu email. Verifique sua caixa de entrada.',
        })
      } else {
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Redirecionando para o dashboard...',
        })
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Erro ao criar conta:', err)
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (!acceptedTerms) {
      setError('Você precisa aceitar os Termos de Uso e Política de Privacidade.')
      return
    }

    setError(null)
    setIsGoogleLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err: any) {
      console.error('Erro ao cadastrar com Google:', err)
      setError(err.message || 'Erro ao cadastrar com Google.')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-3xl font-bold gradient-text">CorretorIA</span>
        </Link>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
            <CardDescription className="text-center">
              Crie sua conta gratuita e comece a corrigir seus textos
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Google Signup */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="mr-2 h-5 w-5" />
              )}
              Continuar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou cadastre-se com</span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    className="pl-10"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className={`pl-10 ${showEmailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                {showEmailError && (
                  <p className="text-xs text-red-500">
                    Digite um email válido (ex: nome@email.com)
                  </p>
                )}
                {formData.email && isEmailValid && (
                  <PasswordRequirement met={true} text="Email válido" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="space-y-1 text-xs">
                    <PasswordRequirement
                      met={passwordRequirements.minLength}
                      text="Mínimo de 8 caracteres"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.hasUpperCase}
                      text="Pelo menos uma letra maiúscula"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.hasLowerCase}
                      text="Pelo menos uma letra minúscula"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.hasNumber}
                      text="Pelo menos um número"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                {formData.confirmPassword && (
                  <PasswordRequirement
                    met={passwordsMatch}
                    text="As senhas coincidem"
                  />
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  disabled={isLoading || isGoogleLoading}
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Eu concordo com os{' '}
                  <Link href="/termos" className="underline hover:text-foreground" target="_blank">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link href="/privacidade" className="underline hover:text-foreground" target="_blank">
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isGoogleLoading || !acceptedTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Fazer login
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Link para voltar */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para o site
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

// Componente auxiliar para mostrar requisitos de senha
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
      {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      <span>{text}</span>
    </div>
  )
}
