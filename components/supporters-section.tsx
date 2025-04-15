"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, Coffee, Star } from "lucide-react"
import { motion } from "framer-motion"
import { sendGTMEvent } from "@/utils/gtm-helper"
import Link from "next/link"

export function SupportersSection() {
  // Atualizar o array de supporters para incluir apenas as duas pessoas reais e um espaço para "Esse pode ser você"
  const supporters = [
    {
      name: "Cecília Bezerra",
      role: "Copywriter",
      avatar:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ceci-apioadora_webp-oY8q263D1e9fbTdrBQAX2XAnVCyWGD.webp",
      contribution: "Apoiadora Mensal",
    },
    {
      name: "Regina Lúcia Alves Costa",
      role: "Consultora Educacional",
      avatar:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/regina-apoiadora_webp-OJWYzy6Xcjkg9wBNqWnT4rFfFkFdRt.webp",
      contribution: "Doadora Platinum",
    },
    {
      name: "Esse pode ser você",
      role: "Apoiador",
      avatar: "",
      contribution: "Junte-se a nós",
      isPlaceholder: true,
    },
  ]

  return (
    <section className="py-16 relative overflow-hidden bg-muted/30">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background opacity-50"></div>

      <div className="max-w-[1366px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Comunidade
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Nossos Apoiadores</h2>
          <p className="text-foreground/80 max-w-[700px] mx-auto">
            Pessoas que acreditam no projeto e ajudam a manter o CorretorIA gratuito para todos
          </p>
        </div>

        {/* Modificar a renderização dos supporters para tratar o placeholder especial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {supporters.map((supporter, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-4">
                {supporter.isPlaceholder ? (
                  <div className="h-20 w-20 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-primary/5">
                    <Heart className="h-8 w-8 text-primary/40" />
                  </div>
                ) : (
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarImage src={supporter.avatar || "/placeholder.svg"} alt={supporter.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {supporter.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!supporter.isPlaceholder && (
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 inline-block mr-0.5" />
                    <span className="text-[10px]">Apoiador</span>
                  </div>
                )}
              </div>
              <h3 className={`font-medium text-foreground ${supporter.isPlaceholder ? "text-primary" : ""}`}>
                {supporter.name}
              </h3>
              <p className="text-sm text-foreground/60">{supporter.role}</p>
              <p className={`text-xs mt-1 ${supporter.isPlaceholder ? "text-primary font-medium" : "text-primary"}`}>
                {supporter.contribution}
              </p>
              {supporter.isPlaceholder && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-primary/30 text-primary hover:bg-primary/10"
                  asChild
                >
                  <Link
                    href="/apoiar"
                    onClick={() => {
                      sendGTMEvent("donation_click", {
                        location: "supporters_section",
                        element_type: "supporter_card_button",
                        section: "community_supporters",
                      })
                    }}
                  >
                    Doar agora
                  </Link>
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto glass-card rounded-xl p-6 md:p-8 border-primary/20 text-center"
        >
          <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-6 w-6 text-primary" />
          </div>

          <h3 className="text-2xl font-bold mb-4 gradient-text">Ajude a Manter o CorretorIA Gratuito</h3>

          <p className="text-foreground/80 mb-6">
            O CorretorIA é um projeto independente que depende do apoio de pessoas como você para continuar oferecendo
            correção de textos gratuita e de alta qualidade. Sua contribuição, por menor que seja, faz toda a diferença!
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-white/10">
            <h4 className="font-medium mb-3 text-foreground">Com sua doação, você nos ajuda a:</h4>
            <ul className="text-sm text-foreground/80 space-y-2 max-w-md mx-auto text-left">
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                  <span className="text-green-500 text-xs">✓</span>
                </div>
                <span>Manter nossos servidores funcionando 24/7</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                  <span className="text-green-500 text-xs">✓</span>
                </div>
                <span>Melhorar a precisão da correção com modelos de IA mais avançados</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                  <span className="text-green-500 text-xs">✓</span>
                </div>
                <span>Desenvolver novos recursos como sugestões de estilo e análises mais detalhadas</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                  <span className="text-green-500 text-xs">✓</span>
                </div>
                <span>Manter o serviço gratuito e acessível para estudantes e profissionais</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white" asChild>
              <Link
                href="/apoiar"
                onClick={() => {
                  sendGTMEvent("donation_click", {
                    location: "supporters_section",
                    element_type: "primary_donation_button",
                    section: "supporters_cta",
                  })
                }}
              >
                <Heart className="mr-2 h-4 w-4" />
                Fazer uma Doação
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => sendGTMEvent("coffee_click", { donationSource: "supporters_section" })}
              asChild
            >
              <Link
                href="/apoiar"
                onClick={() => {
                  sendGTMEvent("donation_click", {
                    location: "supporters_section",
                    element_type: "coffee_button",
                    section: "supporters_cta",
                  })
                }}
              >
                <Coffee className="mr-2 h-4 w-4" />
                Pagar um Café
              </Link>
            </Button>
          </div>

          <p className="text-xs text-foreground/60 mt-6">
            Todas as doações são processadas com segurança via PIX ou cartão de crédito através do Mercado Pago.
            <br />
            Ao fazer uma doação, você se junta à nossa comunidade de apoiadores e ajuda a manter este projeto vivo!
          </p>
        </motion.div>
      </div>
    </section>
  )
}
