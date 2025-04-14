"use client"

import { useState, useEffect, useRef } from "react"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

interface RatingStats {
  averageRating: number
  totalRatings: number
  ratingCounts: Record<string, number>
}

// Estilo para esconder a barra de rolagem
const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

export function RatingStatsDisplay() {
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Depoimentos de usuários - últimos 9 em formato de carrossel
  const testimonials = [
    {
      name: "Cecília Bezerra",
      role: "Copywriter",
      rating: 5,
      comment:
        "Ferramenta incrível! Corrigiu meus textos com precisão e me ajudou a entregar conteúdo de qualidade para meus clientes.",
      date: "2 dias atrás",
    },
    {
      name: "Regina Lúcia Alves",
      role: "Consultora Educacional",
      rating: 5,
      comment:
        "Uso diariamente para revisar documentos acadêmicos. As sugestões são muito pertinentes e me economizam muito tempo.",
      date: "1 semana atrás",
    },
    {
      name: "Paulo Henrique",
      role: "Estudante de Direito",
      rating: 4,
      comment:
        "Excelente para revisar trabalhos acadêmicos. Só não dou 5 estrelas porque às vezes demora um pouco para processar textos maiores.",
      date: "2 semanas atrás",
    },
    {
      name: "Mariana Costa",
      role: "Jornalista",
      rating: 5,
      comment: "Indispensável para meu trabalho diário. Detecta erros sutis que passariam despercebidos.",
      date: "3 semanas atrás",
    },
    {
      name: "Carlos Eduardo",
      role: "Professor",
      rating: 5,
      comment: "Recomendo para todos os meus alunos. Ajuda muito na revisão de trabalhos e na melhoria da escrita.",
      date: "1 mês atrás",
    },
    {
      name: "Fernanda Lima",
      role: "Redatora",
      rating: 4,
      comment: "Uso para todos os meus textos profissionais. As sugestões de estilo são particularmente úteis.",
      date: "1 mês atrás",
    },
    {
      name: "Roberto Almeida",
      role: "Advogado",
      rating: 5,
      comment: "Fundamental para a revisão de petições e documentos jurídicos. Economiza muito tempo.",
      date: "2 meses atrás",
    },
    {
      name: "Juliana Martins",
      role: "Estudante de Mestrado",
      rating: 5,
      comment: "Salvou minha dissertação! Identificou vários erros que eu não tinha percebido nas revisões manuais.",
      date: "2 meses atrás",
    },
    {
      name: "André Santos",
      role: "Escritor",
      rating: 4,
      comment: "Ótima ferramenta para revisão inicial. Complemento com revisão manual, mas economiza muito tempo.",
      date: "3 meses atrás",
    },
  ]

  // Adicionar estilo para esconder a barra de rolagem
  useEffect(() => {
    // Adicionar estilo para esconder a barra de rolagem
    const styleElement = document.createElement("style")
    styleElement.textContent = scrollbarHideStyle
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/rating-stats")

        if (!response.ok) {
          throw new Error(`Erro ao buscar estatísticas: ${response.status}`)
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error("Erro ao buscar estatísticas de avaliação:", err)
        setError("Não foi possível carregar as estatísticas de avaliação")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Atualizar as estatísticas a cada 5 minutos
    const intervalId = setInterval(fetchStats, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  // Efeito para auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        setCurrentSlide((prev) => {
          const nextSlide = (prev + 1) % testimonials.length
          // Calcular a posição de scroll
          const slideWidth = carouselRef.current?.clientWidth || 0
          const scrollAmount =
            nextSlide * (slideWidth / (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1))

          // Scroll suave para o próximo slide
          carouselRef.current?.scrollTo({
            left: scrollAmount,
            behavior: "smooth",
          })

          return nextSlide
        })
      }
    }, 5000) // Muda a cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  // Adicionar esta função antes do return final
  const navigateToSlide = (index: number) => {
    setCurrentSlide(index)
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.clientWidth || 0
      const scrollAmount = index * (slideWidth / (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1))

      carouselRef.current.scrollTo({
        left: scrollAmount,
        behavior: "smooth",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="animate-pulse h-20 bg-muted/50 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>{error}</p>
      </div>
    )
  }

  if (!stats || stats.totalRatings === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Nenhuma avaliação registrada ainda.</p>
      </div>
    )
  }

  // Calcular a porcentagem para cada nível de avaliação
  const getPercentage = (count: number) => {
    return Math.round((count / stats.totalRatings) * 100) || 0
  }

  // Preparar os dados para exibição
  const ratingData = [5, 4, 3, 2, 1].map((rating) => {
    const count = stats.ratingCounts[rating.toString()] || 0
    return {
      rating,
      count,
      percentage: getPercentage(count),
    }
  })

  // Substitua a renderização dos depoimentos por um carrossel
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 bg-muted/30 rounded-lg border shadow-sm"
    >
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="text-5xl font-bold mr-3 text-primary">{stats.averageRating.toFixed(1)}</div>
          <div className="flex flex-col">
            <div className="flex mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= Math.round(stats.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Baseado em <span className="font-medium text-foreground">{stats.totalRatings}</span> avaliações
            </div>
          </div>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-lg text-sm">
          <div className="font-medium text-primary mb-1">Satisfação dos usuários</div>
          <div className="text-foreground/80">
            {Math.round(((stats.ratingCounts["5"] || 0) / stats.totalRatings) * 100)}% dos usuários recomendam
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {ratingData.map(({ rating, count, percentage }) => (
          <div key={rating} className="flex items-center">
            <div className="w-12 text-sm flex items-center">
              <span className="font-medium">{rating}</span>
              <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 mx-2 relative h-6">
              <div className="absolute inset-0 bg-muted rounded-full"></div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`absolute inset-y-0 left-0 rounded-full ${
                  rating >= 4 ? "bg-green-500/70" : rating === 3 ? "bg-yellow-500/70" : "bg-red-500/70"
                }`}
              ></motion.div>
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-xs font-medium text-white drop-shadow-sm">{count} avaliações</span>
              </div>
            </div>
            <div className="w-16 text-right text-sm font-medium">{percentage}%</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-center">Depoimentos de usuários</h3>

        {/* Carrossel de depoimentos */}
        <div className="relative overflow-hidden">
          {/* Adicionar ref e estado para controlar o carrossel */}

          <div ref={carouselRef} className="flex overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-2">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 px-2 snap-start"
              >
                <div className="bg-background rounded-lg p-4 border shadow-sm h-full flex flex-col">
                  <div className="mb-2 text-left">
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>{testimonial.role}</span>
                      <span className="text-xs">{testimonial.date}</span>
                    </div>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= testimonial.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Texto alinhado à esquerda (text-left) */}
                  <p className="text-sm text-foreground/80 italic flex-grow text-left">"{testimonial.comment}"</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Indicadores de navegação */}
          <div className="flex justify-center mt-4 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => navigateToSlide(index)}
                className={`h-2 w-2 rounded-full ${index === currentSlide ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
