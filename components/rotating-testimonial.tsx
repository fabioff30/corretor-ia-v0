"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  rating: 5
  date: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ana Paula Silva",
    role: "Estudante de Direito",
    content: "Incrível! O CorretorIA me salvou na hora de revisar meu TCC. Encontrou erros que eu nem imaginava que existiam. Recomendo muito!",
    rating: 5,
    date: "Há 2 dias",
  },
  {
    id: 2,
    name: "Carlos Eduardo Santos",
    role: "Jornalista",
    content: "Uso diariamente para revisar meus artigos. A qualidade das correções é impressionante e o tempo que economizo é valioso. Vale muito a pena!",
    rating: 5,
    date: "Há 1 semana",
  },
  {
    id: 3,
    name: "Mariana Costa",
    role: "Professora",
    content: "Excelente ferramenta! Além de corrigir, ainda explica os erros. Uso tanto para meu trabalho quanto para ensinar meus alunos. Top demais!",
    rating: 5,
    date: "Há 3 dias",
  },
  {
    id: 4,
    name: "Rafael Oliveira",
    role: "Redator Publicitário",
    content: "A melhor IA de correção que já usei! Muito mais precisa que as outras ferramentas. Desde que assinei o Premium, minha produtividade dobrou.",
    rating: 5,
    date: "Há 5 dias",
  },
  {
    id: 5,
    name: "Juliana Ferreira",
    role: "Empresária",
    content: "Uso para revisar e-mails e documentos importantes. A correção é rápida e muito eficiente. Já indiquei para toda minha equipe!",
    rating: 5,
    date: "Há 1 dia",
  },
  {
    id: 6,
    name: "Pedro Henrique",
    role: "Desenvolvedor",
    content: "Perfeito para revisar documentação técnica. As sugestões são sempre pertinentes e a interface é super intuitiva. Vale cada centavo!",
    rating: 5,
    date: "Há 4 dias",
  },
  {
    id: 7,
    name: "Camila Rodrigues",
    role: "Advogada",
    content: "Essencial no meu dia a dia! Reviso contratos e petições com muito mais segurança. A precisão das correções é excepcional.",
    rating: 5,
    date: "Há 2 semanas",
  },
  {
    id: 8,
    name: "Lucas Martins",
    role: "Estudante de Letras",
    content: "Como estudante, essa ferramenta é um presente! Me ajuda a aprender com meus erros e escrever cada vez melhor. Simplesmente sensacional!",
    rating: 5,
    date: "Há 6 dias",
  },
]

export function RotatingTestimonial() {
  const [currentTestimonial, setCurrentTestimonial] = useState<Testimonial | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Selecionar um depoimento aleatório
    const randomIndex = Math.floor(Math.random() * testimonials.length)
    setCurrentTestimonial(testimonials[randomIndex])
  }, [])

  if (!isClient || !currentTestimonial) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-8 shadow-lg"
    >
      {/* Badge */}
      <div className="absolute -top-3 left-6 z-20">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
          <Star className="h-3 w-3 fill-white" />
          Verificado
        </div>
      </div>

      {/* Quote Icon */}
      <div className="absolute top-6 right-6 opacity-10">
        <Quote className="h-16 w-16 text-primary" />
      </div>

      {/* Stars */}
      <div className="flex gap-1 mb-4 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-5 w-5 fill-yellow-500 text-yellow-500"
          />
        ))}
      </div>

      {/* Testimonial Content */}
      <blockquote className="relative z-10 mb-6">
        <p className="text-lg font-medium text-foreground leading-relaxed">
          "{currentTestimonial.content}"
        </p>
      </blockquote>

      {/* Author Info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">
            {currentTestimonial.name}
          </p>
          <p className="text-sm text-foreground/60">
            {currentTestimonial.role}
          </p>
        </div>
        <div className="text-sm text-foreground/50">
          {currentTestimonial.date}
        </div>
      </div>
    </motion.div>
  )
}
