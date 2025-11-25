"use client"

import { useState, useEffect } from "react"
import { BLACK_FRIDAY_CONFIG } from "@/utils/constants"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface BlackFridayCountdownProps {
  compact?: boolean
}

export function BlackFridayCountdown({ compact = false }: BlackFridayCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isExpired, setIsExpired] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = BLACK_FRIDAY_CONFIG.END_DATE.getTime() - now.getTime()

      if (difference <= 0) {
        setIsExpired(true)
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return null
  }

  if (isExpired) {
    return (
      <div className="text-center text-red-500 font-bold">
        Promo encerrada!
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 font-mono text-sm font-bold">
        <span>{String(timeLeft.days).padStart(2, '0')}d</span>
        <span>:</span>
        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span className="text-red-500">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    )
  }

  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      <TimeBox value={timeLeft.days} label="Dias" />
      <TimeBox value={timeLeft.hours} label="Horas" />
      <TimeBox value={timeLeft.minutes} label="Min" />
      <TimeBox value={timeLeft.seconds} label="Seg" isUrgent />
    </div>
  )
}

interface TimeBoxProps {
  value: number
  label: string
  isUrgent?: boolean
}

function TimeBox({ value, label, isUrgent }: TimeBoxProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center
          font-mono text-2xl sm:text-3xl font-bold
          ${isUrgent
            ? 'bg-red-600 text-white animate-pulse'
            : 'bg-gradient-to-br from-orange-500 to-red-600 text-white'
          }
          shadow-lg
        `}
      >
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-2 text-xs sm:text-sm text-foreground/70 font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}
