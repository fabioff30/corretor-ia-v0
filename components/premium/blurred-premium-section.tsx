"use client"

import { Lock, Crown } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BlurredPremiumSectionProps {
  children: React.ReactNode
  onUpgradeClick: () => void
  className?: string
  title?: string
  subtitle?: string
}

/**
 * BlurredPremiumSection
 *
 * Componente wrapper que aplica blur e overlay clicavel para conteudo premium.
 * Usado para mostrar uma previa borrada do conteudo premium para usuarios gratuitos.
 */
export function BlurredPremiumSection({
  children,
  onUpgradeClick,
  className,
  title = "Desbloqueie com Premium",
  subtitle = "Clique para ver os planos"
}: BlurredPremiumSectionProps) {
  return (
    <motion.div
      className={cn(
        "relative group cursor-pointer rounded-lg overflow-hidden",
        className
      )}
      onClick={onUpgradeClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      {/* Conteudo borrado */}
      <div
        className="blur-[6px] saturate-50 brightness-95 select-none pointer-events-none"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay com gradiente */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-background/30 to-background/60 transition-all duration-300 group-hover:via-background/40 group-hover:to-background/70">
        <motion.div
          className="flex flex-col items-center gap-2 text-center px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Icone de cadeado com fundo */}
          <motion.div
            className="p-3 rounded-full bg-primary/10 border border-primary/20 shadow-lg"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Lock className="h-5 w-5 text-primary" />
          </motion.div>

          {/* Titulo */}
          <span className="font-semibold text-sm text-foreground">
            {title}
          </span>

          {/* Subtitulo com icone de coroa */}
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-background/80 px-3 py-1 rounded-full">
            <Crown className="h-3 w-3 text-amber-500" />
            {subtitle}
          </span>
        </motion.div>
      </div>

      {/* Borda animada ao hover */}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-primary/30 transition-colors duration-300 pointer-events-none" />
    </motion.div>
  )
}
