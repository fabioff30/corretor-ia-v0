"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star } from "lucide-react"

export function RatingStatsSection() {
  const [stats, setStats] = useState<{
    averageRating: number
    totalRatings: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/rating-stats", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (err) {
        console.error("Erro ao buscar estatísticas:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return null
  }

  if (!stats || stats.totalRatings === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="mt-6 text-center"
    >
      {/* Adicionar o schema markup do Google para ratings */}
      {stats && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              name: "CorretorIA",
              description: "Corretor de texto em português com inteligência artificial",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: stats.averageRating.toFixed(1),
                bestRating: "5",
                worstRating: "1",
                ratingCount: stats.totalRatings,
              },
            }),
          }}
        />
      )}
      <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
        <span className="text-sm">
          <span className="font-medium">{stats.averageRating.toFixed(1)}/5</span> de{" "}
          <span className="font-medium">{stats.totalRatings}</span> avaliações
        </span>
      </div>
    </motion.div>
  )
}
