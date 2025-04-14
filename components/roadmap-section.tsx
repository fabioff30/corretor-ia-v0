"use client"

import { motion } from "framer-motion"
import { Calendar, MessageSquare, Zap, Sparkles, Rocket } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function RoadmapSection() {
  const roadmapItems = [
    {
      icon: <Zap className="h-5 w-5 text-primary" />,
      title: "Melhorias no Corretor",
      description: "Aprimoramento contínuo dos algoritmos de correção e sugestões mais contextuais.",
      status: "Em andamento",
      date: "Contínuo",
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      title: "Agente WhatsApp",
      description: "Correção de textos diretamente pelo WhatsApp para maior conveniência.",
      status: "Em desenvolvimento",
      date: "Q2 2025",
    },
    {
      icon: <Calendar className="h-5 w-5 text-primary" />,
      title: "Dashboard Pessoal",
      description: "Acompanhe seu histórico de correções e veja seu progresso ao longo do tempo.",
      status: "Planejado",
      date: "Q3 2025",
    },
    {
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      title: "Sugestões de Estilo Avançadas",
      description: "Recomendações personalizadas para melhorar a clareza e o impacto do seu texto.",
      status: "Planejado",
      date: "Q4 2025",
    },
    {
      icon: <Rocket className="h-5 w-5 text-primary" />,
      title: "Professor de português com IA para crianças carentes",
      description: "Projeto social para levar ensino de qualidade a comunidades com poucos recursos.",
      status: "Planejado",
      date: "2026",
    },
    {
      icon: <Rocket className="h-5 w-5 text-primary" />,
      title: "Fine tuning de modelo de IA específico",
      description: "Desenvolvimento de modelo especializado para melhorar a escrita em português.",
      status: "Considerando",
      date: "2026",
    },
    {
      icon: <Rocket className="h-5 w-5 text-primary" />,
      title: "Ensino de português",
      description: "Plataforma interativa para aprendizado da língua portuguesa com feedback personalizado.",
      status: "Considerando",
      date: "2026",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído":
        return "bg-green-500/10 text-green-500 border-green-500/30"
      case "Em andamento":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30"
      case "Em desenvolvimento":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30"
      case "Planejado":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30"
      case "Considerando":
        return "bg-gray-500/10 text-gray-500 border-gray-500/30"
      default:
        return "bg-primary/10 text-primary border-primary/30"
    }
  }

  return (
    <section id="roadmap" className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent z-0"></div>
      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            O que vem por aí
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Nosso Roadmap</h2>
          <p className="text-foreground/80 max-w-[700px] mx-auto">
            Estamos constantemente trabalhando para melhorar o CorretorIA. Confira nossos planos futuros:
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Linha vertical conectando os itens */}
            <div className="absolute left-[28px] top-8 bottom-0 w-0.5 bg-primary/20 hidden md:block"></div>

            <div className="space-y-8">
              {roadmapItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col md:flex-row gap-4"
                >
                  <div className="flex items-start">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 z-10">
                      {item.icon}
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-6 flex-1 ml-0 md:ml-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          {item.date}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-foreground/80">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
