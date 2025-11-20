"use client"

import { useState, useEffect } from "react"
import { X, Sparkles, Clock, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface CopyPromoBannerProps {
  onClose: () => void
}

export function CopyPromoBanner({ onClose }: CopyPromoBannerProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 })

  useEffect(() => {
    // Importa dinamicamente para evitar problemas com SSR
    import("@/utils/promo-banner-control").then(({ getPromoEndTime, calculateTimeLeft }) => {
      const endTime = getPromoEndTime()

      const timer = setInterval(() => {
        const time = calculateTimeLeft(endTime)
        setTimeLeft(time)

        // Para o timer se o tempo expirou
        if (time.hours === 0 && time.minutes === 0 && time.seconds === 0) {
          clearInterval(timer)
        }
      }, 1000)

      // Atualiza imediatamente
      setTimeLeft(calculateTimeLeft(endTime))

      return () => clearInterval(timer)
    })
  }, [])

  const handleUpgrade = () => {
    // Registra o evento de conversão
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "promo_banner_click", {
        event_category: "engagement",
        event_label: "copy_promo_banner_50_off"
      })
    }

    onClose()
    router.push("/premium?promo=COPY50")
  }

  const handleClose = () => {
    // Registra o fechamento do banner
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "promo_banner_close", {
        event_category: "engagement",
        event_label: "copy_promo_banner_dismissed"
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="relative w-full max-w-lg mx-4 overflow-hidden border-2 border-primary shadow-2xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 hover:bg-white/20"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 md:p-8">
          {/* Badge de Oferta Limitada */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Oferta Exclusiva
            </span>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>

          {/* Título Principal */}
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            🎉 Parabéns por usar o CorretorIA!
          </h2>

          <p className="text-center text-muted-foreground mb-6">
            Você copiou seu texto corrigido! Que tal aproveitar nossa oferta especial?
          </p>

          {/* Oferta de Desconto */}
          <div className="bg-primary/10 rounded-lg p-4 mb-6 border-2 border-primary/20">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-primary mb-2">
                50% OFF
              </div>
              <p className="text-lg font-semibold mb-2">
                na Assinatura Premium
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">Pague com PIX e ative na hora!</span>
              </div>
            </div>
          </div>

          {/* Contador Regressivo */}
          <div className="bg-background/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold uppercase">
                Oferta expira em:
              </span>
            </div>
            <div className="flex justify-center gap-2 md:gap-4">
              <div className="flex flex-col items-center bg-primary/20 rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[80px]">
                <span className="text-2xl md:text-3xl font-bold text-primary">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted-foreground uppercase">Horas</span>
              </div>
              <div className="flex flex-col items-center bg-primary/20 rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[80px]">
                <span className="text-2xl md:text-3xl font-bold text-primary">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted-foreground uppercase">Min</span>
              </div>
              <div className="flex flex-col items-center bg-primary/20 rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[80px]">
                <span className="text-2xl md:text-3xl font-bold text-primary">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted-foreground uppercase">Seg</span>
              </div>
            </div>
          </div>

          {/* Benefícios */}
          <div className="bg-background/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3 text-center">Com o Premium você ganha:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Correções ilimitadas de até 5.000 caracteres</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Reescritas ilimitadas com vários estilos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Análises de IA ilimitadas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Suporte prioritário</span>
              </li>
            </ul>
          </div>

          {/* Call to Action */}
          <Button
            size="lg"
            className="w-full text-lg font-bold shadow-lg hover:shadow-xl transition-all"
            onClick={handleUpgrade}
          >
            Aproveitar 50% de Desconto
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-3">
            Pagamento seguro via PIX • Ativação instantânea
          </p>
        </div>
      </Card>
    </div>
  )
}
