"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { Quote } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    {
      avatar: "/placeholder.svg?height=40&width=40",
      name: "Ricardo Pereira",
      role: "Estudante de Mestrado",
      content:
        "O corretor de texto online foi fundamental para a revisão da minha dissertação. Identificou erros que eu não havia percebido e sugeriu melhorias que tornaram meu texto muito mais claro e profissional.",
    },
    {
      avatar: "/placeholder.svg?height=40&width=40",
      name: "Carla Santos",
      role: "Redatora Freelancer",
      content:
        "Como redatora, preciso entregar textos impecáveis para meus clientes. Esta ferramenta gratuita me ajuda a garantir a qualidade do meu trabalho, economizando tempo e evitando revisões desnecessárias.",
    },
    {
      avatar: "/placeholder.svg?height=40&width=40",
      name: "Marcos Almeida",
      role: "Gerente de Marketing",
      content:
        "Nossa equipe utiliza este corretor diariamente para revisar e-mails importantes e conteúdos para redes sociais. A interface é intuitiva e as correções são precisas, o que melhorou significativamente nossa comunicação.",
    },
  ]

  return (
    <section id="depoimentos" className="py-20 bg-dots relative">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Experiências reais
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-gradient">O Que Dizem Nossos Usuários</h2>
          <p className="text-foreground/80 max-w-[700px] mx-auto">
            Veja como nosso corretor de texto tem ajudado pessoas a melhorar sua escrita
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card rounded-xl p-6 relative"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
              <div className="flex items-center mb-4">
                <Avatar className="h-12 w-12 mr-4 border-2 border-primary/20">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-foreground/60">{testimonial.role}</p>
                </div>
              </div>
              <p className="italic text-foreground/80 relative">"{testimonial.content}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
