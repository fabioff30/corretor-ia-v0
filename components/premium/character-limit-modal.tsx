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
import { AlertTriangle, Crown, Scissors, Zap, Infinity, Shield, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { sendGTMEvent } from "@/utils/gtm-helper"

interface CharacterLimitModalProps {
  isOpen: boolean
  onClose: () => void
  onReduceText: () => void
  currentCount: number
  limit: number
}

const PREMIUM_BENEFITS = [
  {
    icon: Infinity,
    text: "Correcoes ilimitadas por dia",
    highlight: true,
  },
  {
    icon: Zap,
    text: "Ate 20.000 caracteres por texto",
    highlight: true,
  },
  {
    icon: Shield,
    text: "IA Avancada com analise profunda",
    highlight: false,
  },
  {
    icon: CheckCircle2,
    text: "Historico completo de correcoes",
    highlight: false,
  },
]

/**
 * CharacterLimitModal
 *
 * Modal exibido quando usuario gratuito tenta usar mais caracteres que o limite.
 * Oferece opcao de reduzir texto ou assinar Premium.
 */
export function CharacterLimitModal({
  isOpen,
  onClose,
  onReduceText,
  currentCount,
  limit,
}: CharacterLimitModalProps) {
  const excessCharacters = currentCount - limit

  const handleReduceClick = () => {
    sendGTMEvent("character_limit_modal_reduce", {
      current_count: currentCount,
      limit: limit,
      excess: excessCharacters,
    })
    onReduceText()
    onClose()
  }

  const handleUpgradeClick = () => {
    sendGTMEvent("character_limit_modal_upgrade", {
      current_count: currentCount,
      limit: limit,
      location: "character_limit_modal",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="text-center sm:text-center">
          {/* Icone de alerta */}
          <motion.div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </motion.div>

          <DialogTitle className="text-xl">
            Limite de Caracteres Atingido
          </DialogTitle>

          <DialogDescription className="text-base space-y-2 pt-2">
            <p>
              Seu texto possui{" "}
              <span className="font-bold text-foreground">
                {currentCount.toLocaleString("pt-BR")}
              </span>{" "}
              caracteres, mas o limite gratuito e de{" "}
              <span className="font-bold text-foreground">
                {limit.toLocaleString("pt-BR")}
              </span>
              .
            </p>
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              Excedente: {excessCharacters.toLocaleString("pt-BR")} caracteres
            </p>
          </DialogDescription>
        </DialogHeader>

        {/* Beneficios Premium */}
        <div className="my-4 space-y-3">
          <p className="text-sm font-medium text-center text-muted-foreground">
            Com o Premium voce desbloqueia:
          </p>
          <div className="grid gap-2">
            {PREMIUM_BENEFITS.map((benefit, index) => (
              <motion.div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  benefit.highlight
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/30 border-border"
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    benefit.highlight
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <benefit.icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-sm ${
                    benefit.highlight ? "font-medium" : ""
                  }`}
                >
                  {benefit.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {/* Botao Principal - Assinar Premium */}
          <Button
            asChild
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-12 text-base font-semibold shadow-lg"
            onClick={handleUpgradeClick}
          >
            <Link href="/premium" className="flex items-center justify-center gap-2">
              <Crown className="h-5 w-5" />
              Assinar Premium - R$ 29,90/mes
            </Link>
          </Button>

          {/* Botao Secundario - Reduzir texto */}
          <Button
            variant="outline"
            onClick={handleReduceClick}
            className="w-full h-10"
          >
            <Scissors className="mr-2 h-4 w-4" />
            Reduzir texto para {limit.toLocaleString("pt-BR")} caracteres
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
