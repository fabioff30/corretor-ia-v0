"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, User, Loader2, CheckCircle, ShieldCheck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { sendGA4Event } from "@/utils/gtm-helper"
import { obfuscateIdentifier } from "@/utils/analytics"

type PlanType = "monthly" | "annual" | "test"

const planCopy: Record<PlanType, { title: string; description: string }> = {
  monthly: {
    title: "Plano Premium Mensal",
    description: "Acesso ilimitado renovado mês a mês",
  },
  annual: {
    title: "Plano Premium Anual",
    description: "12 meses com desconto especial",
  },
  test: {
    title: "Plano de Teste",
    description: "Acesso temporário para validação interna",
  },
}

interface PixPostPaymentProps {
  paymentId?: string
  email?: string
  plan?: PlanType
  amount?: number
  isGuest?: boolean
}

export function PixPostPayment(props: PixPostPaymentProps) {
  const { paymentId, email, plan = "monthly", amount, isGuest = false } = props
  const { user, loading, signUp } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const formattedAmount = useMemo(() => {
    if (typeof amount !== "number") return null
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    })
  }, [amount])

  const planDetails = useMemo(() => planCopy[plan] ?? planCopy.monthly, [plan])

  const buildTrackingPayload = useCallback(
    async (extra?: Record<string, unknown>) => {
      const payload: Record<string, unknown> = {
        plan,
        isGuest,
        loggedIn: !!user,
      }

      if (typeof amount === "number") {
        payload.amount = amount
      }

      if (paymentId) {
        payload.payment = await obfuscateIdentifier(paymentId, "pid")
      }

      if (email) {
        payload.email = await obfuscateIdentifier(email, "email")
      }

      return {
        ...payload,
        ...(extra ?? {}),
      }
    },
    [plan, isGuest, user, amount, paymentId, email]
  )

  useEffect(() => {
    const trackView = async () => {
      const payload = await buildTrackingPayload()
      sendGA4Event("pix_post_payment_view", payload)
    }

    void trackView()
  }, [buildTrackingPayload])

  const handleLoggedCta = useCallback(
    async (destination: "dashboard" | "subscription") => {
      const payload = await buildTrackingPayload({ destination })
      sendGA4Event("pix_post_payment_logged_cta_click", payload)

      router.push(destination === "dashboard" ? "/dashboard" : "/dashboard/subscription")
    },
    [buildTrackingPayload, router]
  )

  if (!loading && user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              Pagamento confirmado!
            </CardTitle>
            <CardDescription className="text-base">
              Sua conta já está ativa. Acesse o painel para aproveitar os recursos Premium.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <p>
                Se você pagou utilizando outro email, basta finalizar o login com ele para
                vincular automaticamente o plano ao seu perfil.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Plano:</span> {planDetails.title}
              </div>
              {formattedAmount && (
                <div>
                  <span className="font-medium text-foreground">Valor pago:</span> {formattedAmount}
                </div>
              )}
              {paymentId && (
                <div>
                  <span className="font-medium text-foreground">Código do pagamento:</span>{" "}
                  <span className="font-mono">{paymentId}</span>
                </div>
              )}
            </div>
            <div className="space-y-3 rounded-lg border border-primary/10 bg-primary/5 p-4 text-left text-sm leading-relaxed text-muted-foreground">
              <p className="text-foreground font-medium">Próximos passos recomendados:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Acesse o painel para testar as ferramentas ilimitadas liberadas pelo plano Premium.</li>
                <li>Revise sua assinatura em <Link href="/dashboard/subscription" className="text-primary underline">Configurações &gt; Assinatura</Link> para confirmar dados de cobrança.</li>
                <li>Adicione o CorretorIA aos favoritos e acompanhe as novidades pelo email cadastrado.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={() => void handleLoggedCta("dashboard")}>
              Ir para o painel
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void handleLoggedCta("subscription")}
            >
              Gerenciar assinatura
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!email) {
      setError("Não foi possível identificar o email do pagamento. Tente fazer login com o email usado no PIX.")
      return
    }

    if (!name.trim()) {
      setError("Informe seu nome completo")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem")
      return
    }

    if (!acceptTerms) {
      setError("Você precisa aceitar os Termos de Uso para continuar")
      return
    }

    const basePayload = await buildTrackingPayload({
      step: "create_password",
      nameProvided: !!name.trim(),
      acceptTerms,
    })

    sendGA4Event("pix_post_payment_create_password_submit", { ...basePayload })

    setIsSubmitting(true)

    try {
      const { error: signUpError } = await signUp(email, password, name)

      if (signUpError) {
        setError(signUpError.message)
        toast({
          title: "Erro ao criar senha",
          description: signUpError.message,
          variant: "destructive",
        })
        sendGA4Event("pix_post_payment_create_password_error", {
          ...basePayload,
          error: signUpError.message,
          stage: "signUpError",
        })
        return
      }

      // Enviar email de boas-vindas via Brevo após signup bem-sucedido
      if (email) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        try {
          const emailResponse = await fetch('/api/emails/welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              name,
            }),
            signal: controller.signal,
          })

          if (emailResponse.ok) {
            setEmailSent(true)
          } else {
            setEmailError("O email de confirmação pode demorar alguns minutos para chegar. Verifique sua caixa de spam.")
          }
        } catch (welcomeError) {
          console.error('Erro ao enviar email de boas-vindas:', welcomeError)
          setEmailError("O email de confirmação pode demorar alguns minutos para chegar. Verifique sua caixa de spam.")
        } finally {
          clearTimeout(timeout)
        }
      }

      setSuccess(true)

      const successMessage = emailSent
        ? "Email de confirmação enviado! Você será redirecionado em instantes."
        : "Conta criada com sucesso! Verifique seu email para confirmar."

      toast({
        title: "✅ Senha criada com sucesso!",
        description: successMessage,
      })
      sendGA4Event("pix_post_payment_create_password_success", {
        ...basePayload,
        emailSent
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao salvar sua senha"
      setError(message)
      toast({
        title: "Erro ao criar senha",
        description: message,
        variant: "destructive",
      })
      sendGA4Event("pix_post_payment_create_password_error", {
        ...basePayload,
        error: message,
        stage: "unexpected",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-green-600">Tudo certo!</h2>
                <p className="text-muted-foreground">
                  Seu acesso Premium está sendo ativado. Redirecionaremos você automaticamente.
                </p>
                {email && (
                  <p className="text-sm text-muted-foreground bg-green-50 p-3 rounded-lg">
                    📧 Enviamos um email de confirmação para <strong className="text-green-700">{email}</strong>
                    <br />
                    <span className="text-xs">Verifique sua caixa de entrada ou spam.</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-b from-green-50/50 to-background p-4">
      <Card className="w-full max-w-4xl border shadow-xl">
        <CardHeader className="space-y-4 pb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <CardTitle className="text-2xl font-bold text-green-800">
                Pagamento PIX confirmado!
              </CardTitle>
              <CardDescription className="text-base text-green-700">
                {isGuest
                  ? "Último passo: crie sua senha para ativar o plano Premium no seu email."
                  : "Confirme seus dados para finalizar a ativação do plano Premium."}
              </CardDescription>
            </div>
          </div>
          {emailError && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-sm text-yellow-800">
                <strong>⚠️ Aviso:</strong> {emailError}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-5 md:gap-12 pt-8">
          <div className="md:col-span-2 space-y-5">
            <div className="rounded-xl bg-gradient-to-b from-primary/10 to-primary/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Plano Contratado</p>
                  <p className="text-lg font-bold text-foreground">{planDetails.title}</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Acesso ilimitado renovado {plan === 'annual' ? 'anualmente' : 'mensalmente'}. Após ativar sua conta, você poderá usar todas as ferramentas Premium sem restrições.
              </p>

              <div className="space-y-3 rounded-lg bg-white border border-primary/20 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium text-foreground truncate max-w-[60%]">
                    {email ?? "Não informado"}
                  </span>
                </div>
                {formattedAmount && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor pago</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formattedAmount}
                    </span>
                  </div>
                )}
                {paymentId && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">ID do pagamento</p>
                    <p className="text-xs font-mono bg-muted/50 p-2 rounded break-all">{paymentId}</p>
                  </div>
                )}
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-sm">
                <strong>Já tem uma conta?</strong> <Link href="/login" className="text-primary underline font-medium">Faça login aqui</Link> para ativar o Premium imediatamente.
              </AlertDescription>
            </Alert>
          </div>

          <div className="md:col-span-3 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Complete seu cadastro</h3>
              <p className="text-sm text-muted-foreground">
                Preencha os dados abaixo para criar sua conta e ativar o plano Premium.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email do pagamento
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email ?? ""}
                    disabled
                    className="pl-10 bg-muted/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Este email foi usado no pagamento e não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome completo <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Crie uma senha <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`h-1.5 w-1.5 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={password.length >= 6 ? 'text-green-600' : 'text-muted-foreground'}>
                    Mínimo de 6 caracteres
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirme a senha <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`h-1.5 w-1.5 rounded-full ${password === confirmPassword && password.length > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-red-600'}>
                      {password === confirmPassword && password.length > 0 ? 'As senhas conferem' : 'As senhas não conferem'}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={acceptTerms}
                    onChange={(event) => setAcceptTerms(event.target.checked)}
                    required
                  />
                  <span className="text-sm leading-relaxed">
                    Li e concordo com os{" "}
                    <Link href="/termos" className="text-primary underline font-medium">
                      Termos de Uso
                    </Link>{" "}
                    e com a{" "}
                    <Link href="/privacidade" className="text-primary underline font-medium">
                      Política de Privacidade
                    </Link>
                    {" "}do CorretorIA.
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting || !acceptTerms}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando sua conta...
                  </>
                ) : (
                  "Ativar acesso Premium"
                )}
              </Button>

              <div className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-primary underline">
                  Faça login
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
