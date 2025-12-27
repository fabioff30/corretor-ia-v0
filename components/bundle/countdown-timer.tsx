"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  endDate: Date
  className?: string
  onExpire?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calculateTimeLeft(endDate: Date): TimeLeft {
  const difference = endDate.getTime() - Date.now()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  }
}

function TimeUnit({
  value,
  label,
  isUrgent,
}: {
  value: number
  label: string
  isUrgent: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm",
          "border border-white/10",
          "shadow-lg",
          isUrgent && "border-red-500/50 animate-pulse"
        )}
      >
        {/* Glow effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl opacity-50 blur-xl -z-10",
            isUrgent ? "bg-red-500/30" : "bg-amber-500/20"
          )}
        />

        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "text-3xl md:text-4xl font-black tabular-nums",
              isUrgent
                ? "text-red-400"
                : "bg-gradient-to-b from-amber-300 to-amber-500 bg-clip-text text-transparent"
            )}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span
        className={cn(
          "mt-2 text-xs md:text-sm font-medium uppercase tracking-wider",
          isUrgent ? "text-red-400/80" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  )
}

function Separator() {
  return (
    <div className="flex flex-col justify-center gap-2 px-1 md:px-2">
      <div className="w-2 h-2 rounded-full bg-amber-400/60" />
      <div className="w-2 h-2 rounded-full bg-amber-400/60" />
    </div>
  )
}

export function CountdownTimer({
  endDate,
  className,
  onExpire,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(endDate)
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endDate)
      setTimeLeft(newTimeLeft)

      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate, onExpire])

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <Clock className="h-5 w-5 animate-pulse text-amber-400" />
        <span className="text-muted-foreground">Carregando...</span>
      </div>
    )
  }

  // Expired state
  if (timeLeft.total <= 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-3 p-4 rounded-xl",
          "bg-red-500/10 border border-red-500/30",
          className
        )}
      >
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <span className="text-red-400 font-semibold">Oferta encerrada!</span>
      </div>
    )
  }

  // Urgency: less than 24 hours
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <Clock
          className={cn(
            "h-4 w-4",
            isUrgent ? "text-red-400 animate-pulse" : "text-amber-400"
          )}
        />
        <span
          className={cn(
            "font-medium",
            isUrgent ? "text-red-400" : "text-amber-400"
          )}
        >
          {isUrgent ? "ÚLTIMAS HORAS!" : "Oferta termina em:"}
        </span>
      </div>

      {/* Timer units */}
      <div className="flex items-center justify-center gap-1 md:gap-2">
        <TimeUnit value={timeLeft.days} label="Dias" isUrgent={isUrgent} />
        <Separator />
        <TimeUnit value={timeLeft.hours} label="Horas" isUrgent={isUrgent} />
        <Separator />
        <TimeUnit value={timeLeft.minutes} label="Min" isUrgent={isUrgent} />
        <Separator />
        <TimeUnit value={timeLeft.seconds} label="Seg" isUrgent={isUrgent} />
      </div>
    </div>
  )
}
