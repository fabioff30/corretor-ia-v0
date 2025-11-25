"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { X, Zap, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/use-user"
import { BLACK_FRIDAY_CONFIG, isBlackFridayActive } from "@/utils/constants"

// Pages where the banner should appear
const BANNER_PAGES = ['/', '/reescrever', '/detector-ia']

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
}

export function BlackFridayBanner() {
  const pathname = usePathname()
  const { profile, loading } = useUser()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)

  // Check if user is free or not logged in
  const isFreeOrGuest = !profile || profile.plan_type === 'free'

  // Check if current page should show banner
  const shouldShowOnPage = BANNER_PAGES.includes(pathname) || pathname.startsWith('/blog')

  // Check if promotion is still active
  const isPromoActive = isBlackFridayActive()

  useEffect(() => {
    setMounted(true)

    // Check localStorage for dismissal
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('bf-banner-dismissed')
      if (dismissed) {
        const dismissedTime = new Date(dismissed)
        // Allow showing again after 4 hours
        if (new Date().getTime() - dismissedTime.getTime() < 4 * 60 * 60 * 1000) {
          setIsDismissed(true)
          return
        }
      }
    }
  }, [])

  useEffect(() => {
    // Only show if all conditions are met
    if (mounted && !loading && isFreeOrGuest && shouldShowOnPage && isPromoActive && !isDismissed) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [mounted, loading, isFreeOrGuest, shouldShowOnPage, isPromoActive, isDismissed])

  useEffect(() => {
    if (!isVisible) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const diff = BLACK_FRIDAY_CONFIG.END_DATE.getTime() - now.getTime()

      if (diff <= 0) {
        setIsVisible(false)
        return { hours: 0, minutes: 0, seconds: 0 }
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60))
      return {
        hours: totalHours,
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('bf-banner-dismissed', new Date().toISOString())
    }
  }

  // Don't render anything if not visible or not mounted
  if (!mounted || !isVisible) return null

  return (
    <>
      {/* Spacer to push content down when banner is visible */}
      <div className="h-10 sm:h-10" />
      {/* Fixed banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white py-2 px-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 animate-pulse" />
              <span className="font-bold text-sm sm:text-base">BLACK FRIDAY:</span>
            </div>
            <span className="text-sm sm:text-base">
              Licenca <strong>VITALICIA</strong> por R$ 99,90!
            </span>
            <div className="hidden sm:flex items-center gap-1 text-xs sm:text-sm bg-black/20 rounded px-2 py-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-mono font-bold">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-orange-600 hover:bg-white/90 font-semibold text-xs sm:text-sm"
              asChild
            >
              <Link href="/black-friday">Ver oferta</Link>
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Fechar banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
