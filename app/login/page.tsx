/**
 * Página de Login
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Sparkles, AlertTriangle } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { useToast } from '@/hooks/use-toast'
import { useUser } from "@/components/providers/user-provider"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const { signIn, signInWithGoogle } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (user) {
      // Redirecionar para home - o TextCorrectionForm detecta automaticamente o plano
      router.push('/')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) {
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const { error } = await signIn(formData.email, formData.password)

      if (error) {
        throw error
      }

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando...',
      })

      // Redirecionar para home - o TextCorrectionForm detecta automaticamente o plano
      router.push('/')
    } catch (err: any) {
      console.error('Erro ao fazer login:', err)
      const message =
        err?.message === 'Request rate limit reached'
          ? 'Detectamos muitas tentativas de login em sequência. Aguarde alguns segundos e tente novamente.'
          : err?.message || 'Erro ao fazer login. Verifique suas credenciais.'
      setError(message)
      toast({
        title: 'Erro ao fazer login',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) {
      return
    }

    setError(null)
    setIsGoogleLoading(true)

    try {
      const { error } = await signInWithGoogle()

      if (error) {
        throw error
      }
    } catch (err: any) {
      console.error('Erro ao fazer login com Google:', err)
      const message =
        err?.message === 'Request rate limit reached'
          ? 'Detectamos muitas tentativas de login com Google. Aguarde alguns segundos e tente novamente.'
          : err?.message || 'Erro ao fazer login com Google.'
      setError(message)
      toast({
        title: 'Erro ao fazer login com Google',
        description: message,
        variant: 'destructive',
      })
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
            <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
            <CardDescription className="text-center">
              Entre com sua conta para acessar o dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
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
                <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="/recuperar-senha"
                    className="text-xs text-primary hover:underline"
                    tabIndex={-1}
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
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
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="text-primary font-medium hover:underline">
                Criar conta
              </Link>
            </div>

            <div className="text-xs text-center text-muted-foreground">
              Ao continuar, você concorda com nossos{' '}
              <Link href="/termos" className="underline hover:text-foreground">
                Termos de Uso
              </Link>{' '}
              e{' '}
              <Link href="/privacidade" className="underline hover:text-foreground">
                Política de Privacidade
              </Link>
              .
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
