"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Crown, 
  Check, 
  X, 
  Zap, 
  FileText, 
  Shield,
  Loader2,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { PREMIUM_PLAN_PRICE } from "@/utils/constants"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UpgradePage() {
  const { user } = useAuth()
  const subscription = useSubscription()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para assinar o plano premium",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    
    try {
      // Criar preferência do MercadoPago
      const response = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: "CorretorIA Pro - Assinatura Mensal",
          price: PREMIUM_PLAN_PRICE,
          quantity: 1,
          donorName: user.name,
          donorEmail: user.email,
        })
      })

      if (!response.ok) {
        throw new Error("Erro ao criar preferência de pagamento")
      }

      const { initPoint } = await response.json()
      
      // Redirecionar para o checkout do MercadoPago
      window.location.href = initPoint
      
    } catch (error) {
      console.error("Erro ao processar upgrade:", error)
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar o upgrade. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const features = [
    {
      name: "Limite de caracteres",
      free: "1.500 caracteres",
      premium: "10.000 caracteres",
      icon: FileText
    },
    {
      name: "Anúncios",
      free: "Com anúncios",
      premium: "Sem anúncios",
      icon: Shield
    },
    {
      name: "Processamento",
      free: "Padrão",
      premium: "Prioritário",
      icon: Zap
    },
    {
      name: "Análise avançada",
      free: "Básica",
      premium: "Completa",
      icon: Crown
    }
  ]

  if (subscription.isPremium) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">
              Você já é CorretorIA Pro!
            </CardTitle>
            <CardDescription>
              Sua assinatura premium está ativa e funcionando perfeitamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Sua assinatura renova em:{" "}
                <span className="font-medium">
                  {subscription.expiresAt 
                    ? new Date(subscription.expiresAt).toLocaleDateString("pt-BR")
                    : "Não informado"
                  }
                </span>
              </p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/dashboard">Ver Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/billing">Gerenciar Cobrança</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Upgrade para CorretorIA Pro
        </h1>
        <p className="text-xl text-muted-foreground">
          Desbloqueie todo o potencial do seu corretor de texto
        </p>
      </div>

      {!user && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você precisa{" "}
            <Link href="/login" className="font-medium underline">
              fazer login
            </Link>
            {" "}ou{" "}
            <Link href="/register" className="font-medium underline">
              criar uma conta
            </Link>
            {" "}para assinar o plano premium.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Plano Gratuito */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Plano Gratuito
            </CardTitle>
            <CardDescription>
              Para uso básico e esporádico
            </CardDescription>
            <div className="text-3xl font-bold mt-4">
              R$ 0<span className="text-base font-normal text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {features.map((feature) => (
              <div key={feature.name} className="flex items-center gap-3">
                <feature.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{feature.name}</div>
                  <div className="text-sm text-muted-foreground">{feature.free}</div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-6" asChild>
              <Link href="/">Usar Gratuitamente</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Plano Premium */}
        <Card className="relative border-amber-500/50 shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-amber-500 text-white">
              Mais Popular
            </Badge>
          </div>
          
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              CorretorIA Pro
            </CardTitle>
            <CardDescription>
              Para profissionais e uso intensivo
            </CardDescription>
            <div className="text-3xl font-bold mt-4 text-amber-600">
              R$ {PREMIUM_PLAN_PRICE.toFixed(2).replace(".", ",")}
              <span className="text-base font-normal text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {features.map((feature) => (
              <div key={feature.name} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-sm font-medium">{feature.name}</div>
                  <div className="text-sm text-amber-600 font-medium">{feature.premium}</div>
                </div>
              </div>
            ))}
            
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Cancelamento a qualquer momento</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Suporte prioritário</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Novos recursos em primeira mão</span>
              </div>
            </div>

            <Button 
              className="w-full mt-6 bg-amber-500 hover:bg-amber-600"
              onClick={handleUpgrade}
              disabled={isProcessing || !user}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Assinar CorretorIA Pro
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Seção */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Perguntas Frequentes
        </h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Posso cancelar a qualquer momento?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sim, você pode cancelar sua assinatura a qualquer momento. 
                Não há taxas de cancelamento e você continuará tendo acesso 
                aos recursos premium até o fim do período pago.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Como funciona a cobrança?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A cobrança é feita mensalmente via MercadoPago, com renovação 
                automática. Você receberá um email de confirmação após cada 
                pagamento.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                O que acontece se eu exceder o limite gratuito?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No plano gratuito, você pode corrigir até 1.500 caracteres por vez. 
                Com o Pro, esse limite aumenta para 10.000 caracteres, suficiente 
                para textos longos e documentos completos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}