"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, Loader2, Lock, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const setupAuth = async () => {
      try {
        // Forçar processamento do hash/query params do Supabase
        await supabase.auth.getSession()

        // Aguardar processamento da URL
        await new Promise(resolve => setTimeout(resolve, 500))

        // Verificar se há sessão ativa
        const { data } = await supabase.auth.getSession()
        if (mounted && data.session) {
          setIsReady(true)
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (mounted && event === "PASSWORD_RECOVERY") {
        setIsReady(true)
      }
    })

    setupAuth()

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Use letras maiúsculas, minúsculas e números na nova senha.")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas precisam coincidir.")
      return
    }

    setIsSubmitting(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Senha redefinida",
        description: "Você já pode acessar o CorretorIA com a nova senha.",
      })

      setTimeout(() => {
        router.push("/login")
      }, 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível redefinir a senha."
      setError(message)
    } finally {
      setIsSubmitting(false)
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
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-3xl font-bold gradient-text">CorretorIA</span>
        </Link>

        <Card>
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold">Definir nova senha</CardTitle>
            <CardDescription>
              Escolha uma nova senha forte para proteger a sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isReady ? (
              <Alert>
                <AlertDescription>
                  Validando link de recuperação... Caso a página não carregue, gere um novo link em <Link href="/recuperar-senha" className="underline">recuperar senha</Link>.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isSubmitting}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, com letras maiúsculas, minúsculas e números.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={isSubmitting}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar nova senha"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-xs text-muted-foreground">
              Voltar para o <Link href="/login" className="text-primary font-medium hover:underline">login</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
