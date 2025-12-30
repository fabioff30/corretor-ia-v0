"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Crown,
  Sparkles,
  BarChart3,
  MessageSquare,
  Lightbulb,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { sendGTMEvent } from "@/utils/gtm-helper"

interface PremiumFeatureUpsellModalProps {
  isOpen: boolean
  onClose: () => void
  featureName?: string
}

const PREMIUM_FEATURES = [
  {
    icon: BarChart3,
    title: "Estatisticas de Erros",
    description: "Categorias detalhadas dos seus erros",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: MessageSquare,
    title: "Dicas Personalizadas",
    description: "Feedback especifico para o seu texto",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Lightbulb,
    title: "Sugestoes de Melhoria",
    description: "O que, por que e como melhorar",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Target,
    title: "Analise de Estilo",
    description: "Clareza, coesao e fluidez",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
]

/**
 * PremiumFeatureUpsellModal
 *
 * Modal exibido quando usuario gratuito clica em conteudo premium bloqueado.
 * Mostra os beneficios e incentiva a assinatura.
 */
export function PremiumFeatureUpsellModal({
  isOpen,
  onClose,
  featureName = "Analises Avancadas",
}: PremiumFeatureUpsellModalProps) {
  const handleUpgradeClick = () => {
    sendGTMEvent("premium_upsell_modal_upgrade", {
      feature_name: featureName,
      location: "premium_feature_upsell_modal",
    })
    onClose()
  }

  const handleMaybeLater = () => {
    sendGTMEvent("premium_upsell_modal_dismiss", {
      feature_name: featureName,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="text-center sm:text-center">
          {/* Icone de coroa com brilho */}
          <motion.div
            className="mx-auto mb-4 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/30">
              <Crown className="h-10 w-10 text-amber-500" />
            </div>
            {/* Particulas de brilho */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5 text-amber-400" />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -left-1"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="h-4 w-4 text-amber-300" />
            </motion.div>
          </motion.div>

          <DialogTitle className="text-2xl bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            Desbloqueie {featureName}
          </DialogTitle>

          <DialogDescription className="text-base pt-2">
            Acesse recursos exclusivos que vao transformar a qualidade dos seus textos.
          </DialogDescription>
        </DialogHeader>

        {/* Grid de features */}
        <div className="my-6 grid grid-cols-2 gap-3">
          {PREMIUM_FEATURES.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${feature.bgColor}`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h4 className="font-semibold text-sm">{feature.title}</h4>
              <p className="text-xs text-muted-foreground leading-tight">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Preco */}
        <motion.div
          className="text-center py-4 px-6 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-muted-foreground">Por apenas</p>
          <p className="text-3xl font-bold text-primary">
            R$ 29,90
            <span className="text-base font-normal text-muted-foreground">/mes</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span>Cancele quando quiser</span>
          </div>
        </motion.div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-2">
          {/* Botao Principal - Assinar Premium */}
          <Button
            asChild
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white h-12 text-base font-semibold shadow-lg shadow-amber-500/20"
            onClick={handleUpgradeClick}
          >
            <Link href="/premium" className="flex items-center justify-center gap-2">
              <Crown className="h-5 w-5" />
              Assinar Premium Agora
            </Link>
          </Button>

          {/* Botao Secundario - Talvez depois */}
          <Button
            variant="ghost"
            onClick={handleMaybeLater}
            className="w-full h-10 text-muted-foreground hover:text-foreground"
          >
            Talvez Depois
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
