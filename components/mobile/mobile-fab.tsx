"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Settings, Upload, History, HelpCircle, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/hooks/use-haptic"

interface FABAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  color?: string
}

interface MobileFABProps {
  onSettingsClick?: () => void
  onFileUpload?: () => void
  onHistoryClick?: () => void
  onHelpClick?: () => void
  onAIToggle?: () => void
  className?: string
}

export function MobileFAB({
  onSettingsClick,
  onFileUpload,
  onHistoryClick,
  onHelpClick,
  onAIToggle,
  className
}: MobileFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const haptic = useHaptic()

  const actions: FABAction[] = [
    {
      id: 'settings',
      label: 'Opções',
      icon: <Settings className="h-5 w-5" />,
      onClick: () => {
        haptic.medium()
        onSettingsClick?.()
        setIsOpen(false)
      },
      color: 'bg-blue-500'
    },
    {
      id: 'upload',
      label: 'Arquivo',
      icon: <Upload className="h-5 w-5" />,
      onClick: () => {
        haptic.medium()
        onFileUpload?.()
        setIsOpen(false)
      },
      color: 'bg-green-500'
    },
    {
      id: 'ai',
      label: 'IA Avançada',
      icon: <Sparkles className="h-5 w-5" />,
      onClick: () => {
        haptic.medium()
        onAIToggle?.()
        setIsOpen(false)
      },
      color: 'bg-purple-500'
    },
    {
      id: 'history',
      label: 'Histórico',
      icon: <History className="h-5 w-5" />,
      onClick: () => {
        haptic.medium()
        onHistoryClick?.()
        setIsOpen(false)
      },
      color: 'bg-orange-500'
    },
    {
      id: 'help',
      label: 'Ajuda',
      icon: <HelpCircle className="h-5 w-5" />,
      onClick: () => {
        haptic.medium()
        onHelpClick?.()
        setIsOpen(false)
      },
      color: 'bg-pink-500'
    },
  ].filter(action => {
    // Only show actions that have handlers
    if (action.id === 'settings' && !onSettingsClick) return false
    if (action.id === 'upload' && !onFileUpload) return false
    if (action.id === 'history' && !onHistoryClick) return false
    if (action.id === 'help' && !onHelpClick) return false
    if (action.id === 'ai' && !onAIToggle) return false
    return true
  })

  const toggleMenu = () => {
    haptic.light()
    setIsOpen(!isOpen)
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Speed Dial Actions */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-20 right-0 flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 20, y: 20 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              >
                {/* Label */}
                <motion.span
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium",
                    "bg-background shadow-lg border border-border",
                    "whitespace-nowrap"
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                >
                  {action.label}
                </motion.span>

                {/* Action Button */}
                <button
                  onClick={action.onClick}
                  className={cn(
                    "w-12 h-12 rounded-full shadow-lg",
                    "flex items-center justify-center",
                    "text-white transition-transform active:scale-90",
                    action.color || "bg-primary"
                  )}
                >
                  {action.icon}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={toggleMenu}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl",
          "bg-primary text-primary-foreground",
          "flex items-center justify-center",
          "transition-transform active:scale-90",
          "hover:shadow-primary/50"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </motion.button>

      {/* Ripple Effect on Click */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary opacity-30 -z-10"
            initial={{ scale: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
