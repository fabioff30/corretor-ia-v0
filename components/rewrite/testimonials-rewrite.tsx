import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Ana Carolina Silva",
    role: "Jornalista",
    company: "Folha Digital",
    avatar: "AC",
    rating: 5,
    text: "Uso o CorretorIA diariamente para adaptar notícias para diferentes públicos. Em segundos, consigo transformar um texto técnico em linguagem acessível para nossos leitores. Economizo horas de trabalho!",
    highlight: "Economizo horas de trabalho!"
  },
  {
    name: "Dr. Ricardo Mendes",
    role: "Professor Universitário",
    company: "UFMG",
    avatar: "RM",
    rating: 5,
    text: "Excelente para simplificar artigos acadêmicos para meus alunos de graduação. A ferramenta mantém a precisão científica enquanto torna o conteúdo mais digestível. Fundamental para a educação moderna.",
    highlight: "Fundamental para a educação moderna"
  },
  {
    name: "Mariana Santos",
    role: "Gerente de Marketing",
    company: "TechStart",
    avatar: "MS",
    rating: 5,
    text: "Criamos múltiplas versões de copy para testes A/B usando diferentes estilos. Nossa taxa de conversão aumentou 40% desde que começamos a usar a ferramenta para personalizar mensagens.",
    highlight: "Taxa de conversão aumentou 40%"
  },
  {
    name: "João Pedro Costa",
    role: "Estudante de Mestrado",
    company: "USP",
    avatar: "JP",
    rating: 5,
    text: "Perfeito para reescrever seções da minha dissertação evitando repetições. Consegui diversificar meu vocabulário acadêmico mantendo o rigor científico. Recomendo para todos os pós-graduandos.",
    highlight: "Diversificar vocabulário acadêmico"
  },
  {
    name: "Beatriz Oliveira",
    role: "Criadora de Conteúdo",
    company: "@biaoliveira",
    avatar: "BO",
    rating: 5,
    text: "Uso para adaptar o mesmo conteúdo para Instagram, LinkedIn e blog. Cada plataforma exige um tom diferente e a ferramenta entende perfeitamente essas nuances. Minha produtividade triplicou!",
    highlight: "Produtividade triplicou!"
  },
  {
    name: "Carlos Eduardo",
    role: "Advogado",
    company: "Silva & Associados",
    avatar: "CE",
    rating: 5,
    text: "Transformo petições complexas em linguagem acessível para meus clientes. Eles entendem melhor os processos e ficam mais confiantes. A comunicação jurídica nunca foi tão clara.",
    highlight: "Comunicação jurídica nunca foi tão clara"
  }
]

export function TestimonialsRewrite() {
  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Depoimentos de Usuários</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Veja como profissionais de diferentes áreas estão transformando sua produtividade
          e qualidade de comunicação com nossa ferramenta de reescrita inteligente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              <div className="relative">
                <Quote className="h-6 w-6 text-primary/20 absolute -top-2 -left-1" />
                <p className="text-sm leading-relaxed mb-4 pl-4">
                  {testimonial.text}
                </p>
              </div>

              <Badge variant="secondary" className="text-xs">
                "{testimonial.highlight}"
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">50K+</div>
            <p className="text-sm text-muted-foreground">Usuários ativos mensais</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">4.8★</div>
            <p className="text-sm text-muted-foreground">Avaliação média dos usuários</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">2M+</div>
            <p className="text-sm text-muted-foreground">Textos reescritos com sucesso</p>
          </div>
        </div>
      </div>
    </section>
  )
}