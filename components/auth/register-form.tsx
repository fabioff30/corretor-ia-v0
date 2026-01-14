"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import Link from "next/link"
import { useUser } from "@/components/providers/user-provider"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useIsMobile } from "@/hooks/use-mobile"

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const { signUp, user } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()

  // Get redirect URL from query params
  // Mobile vai para home, desktop vai para dashboard por padrão
  const defaultRedirect = isMobile ? '/' : '/dashboard'
  const redirectUrl = searchParams.get('redirect') || defaultRedirect

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push(redirectUrl)
    }
  }, [user, router, redirectUrl])

  // Validação de email com regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = formData.email.trim() !== '' && emailRegex.test(formData.email)
  const showEmailError = formData.email.trim() !== '' && !isEmailValid

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório")
      return false
    }

    if (!formData.email.trim()) {
      setError("Email é obrigatório")
      return false
    }

    if (!isEmailValid) {
      setError("Digite um email válido (ex: nome@email.com)")
      return false
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return false
    }

    if (!acceptTerms) {
      setError("Você deve aceitar os termos de uso")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, formData.name)

      if (error) {
        if (error.message.includes("already registered")) {
          setError("Este email ja esta cadastrado. Tente fazer login.")
        } else {
          setError(error.message)
        }
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        })
      } else {
        setSuccess(true)
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Verifique seu email para confirmar a conta"
        })

        // Redirect after a few seconds
        setTimeout(() => {
          router.push(redirectUrl)
        }, 2000)
      }
    } catch (err) {
      const errorMessage = "Erro inesperado no cadastro"
      setError(errorMessage)
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (!acceptTerms) {
      setError("Voce deve aceitar os termos de uso para continuar")
      return
    }

    setError("")
    setIsGoogleLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
        },
      })

      if (error) throw error
    } catch (err: any) {
      console.error('Erro ao cadastrar com Google:', err)
      setError(err.message || 'Erro ao cadastrar com Google.')
      setIsGoogleLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-green-600">Cadastro realizado!</h2>
                <p className="text-muted-foreground mt-2">
                  Sua conta foi criada com sucesso. Voce sera redirecionado em instantes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-center">
            Cadastre-se gratuitamente para acessar o CorretorIA
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Google Signup Button */}
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
              <span className="bg-card px-2 text-muted-foreground">Ou cadastre-se com email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  className="pl-10"
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
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  className={`pl-10 ${showEmailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Email válido
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimo 6 caracteres"
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading || isGoogleLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading || isGoogleLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading || isGoogleLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading || isGoogleLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                disabled={isLoading || isGoogleLoading}
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground">
                Aceito os{" "}
                <Link
                  href="/termos"
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  termos de uso
                </Link>
                {" "}e{" "}
                <Link
                  href="/privacidade"
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  politica de privacidade
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isGoogleLoading || !acceptTerms}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Ja tem uma conta?{" "}
            <Link
              href={`/login${redirectUrl !== defaultRedirect ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="text-primary hover:underline font-medium"
            >
              Fazer login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
