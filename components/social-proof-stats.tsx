"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Star, Users, CheckCircle, TrendingUp } from "lucide-react"

interface SocialProofData {
  ratings: {
    average: number
    total: number
  }
  users: {
    premium: number
  }
  corrections: {
    last30Days: number
  }
}

export function SocialProofStats() {
  const [data, setData] = useState<SocialProofData>({
    ratings: { average: 4.8, total: 1247 },
    users: { premium: 127 },
    corrections: { last30Days: 15234 },
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/social-proof")
        if (response.ok) {
          const stats = await response.json()
          setData(stats)
        }
      } catch (error) {
        console.error("Failed to fetch social proof stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const stats = [
    {
      icon: Star,
      value: data.ratings.average.toFixed(1),
      label: `${data.ratings.total.toLocaleString("pt-BR")} avaliações`,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: Users,
      value: `${data.users.premium}+`,
      label: "Usuários Premium",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: CheckCircle,
      value: `${(data.corrections.last30Days / 1000).toFixed(1)}k`,
      label: "Correções este mês",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ]

  return (
    <div className="py-6">
      <div className="flex items-center justify-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <p className="text-sm font-medium text-foreground/70">
          Junte-se a milhares de usuários satisfeitos
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-primary/10 bg-background/50"
          >
            <div className={`p-3 rounded-full ${stat.bgColor} mb-2`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                stat.value
              )}
            </div>
            <div className="text-xs text-foreground/60 text-center mt-1">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
