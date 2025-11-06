"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Testimonial {
  id: string
  rating: number
  feedback: string
  timestamp: string
  initials: string
}

export function TestimonialsReal() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch("/api/testimonials")
        if (response.ok) {
          const data = await response.json()
          setTestimonials(data.slice(0, 6)) // Show only 6
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Há 1 dia"
    if (diffDays < 7) return `Há ${diffDays} dias`
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`
    return `Há ${Math.floor(diffDays / 30)} meses`
  }

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">O Que Nossos Usuários Dizem</h2>
          <p className="text-foreground/70">Avaliações reais de quem usa o CorretorIA</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 gradient-text">O Que Nossos Usuários Dizem</h2>
        <p className="text-foreground/70">Avaliações reais de quem usa o CorretorIA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="h-full border-primary/10 hover:border-primary/30 transition-colors bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                  <div className="inline-flex p-2 rounded-full bg-primary/10">
                    <Quote className="h-4 w-4 text-primary" />
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>

                {/* Feedback Text */}
                <p className="text-foreground/90 text-sm leading-relaxed mb-4 line-clamp-4">
                  "{testimonial.feedback}"
                </p>

                {/* User Info */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">{testimonial.initials}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Usuário Verificado</p>
                      <p className="text-xs text-foreground/60">{formatDate(testimonial.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trust Badge */}
      <div className="mt-8 text-center">
        <p className="text-sm text-foreground/60">
          ⚡ Depoimentos reais de usuários verificados
        </p>
      </div>
    </div>
  )
}
