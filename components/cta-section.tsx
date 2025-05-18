"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Heart } from "lucide-react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { sendGTMEvent } from "@/utils/gtm-helper"

export function CTASection() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="max-w-[1366px] mx-auto px-4 sm:px:6 lg:px-8 relative z-10"
      >
        <Card className="max-w-3xl mx-auto p-8 text-center shadow-md border-primary/20">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium text-sm flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Comece agora mesmo
            </div>
          </div>

          <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text mt-4">
            Melhore Seus Textos com Nosso Corretor de Texto
          </h2>
          <p className="text-muted-foreground max-w-[700px] mx-auto mb-8">
            Experimente nosso corretor de texto online e gratuito e veja a diferença na qualidade da sua escrita. Sem
            cadastro, sem instalação, sem complicações.
          </p>
          <Button
            size="lg"
            className="px-8 h-12 text-base"
            onClick={() => {
              sendGTMEvent("donation_click", {
                location: "cta_section",
                element_type: "primary_button",
                section: "page_bottom",
              })
            }}
            asChild
          >
            <Link href="/apoiar">
              Apoiar o Corretor de Texto CorretorIA
              <Heart className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span className="flex items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
              Corretor de texto 100% gratuito
            </span>
            <span className="flex items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
              Sem cadastro
            </span>
            <span className="flex items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
              Resultados instantâneos
            </span>
          </p>
        </Card>
      </motion.div>
    </section>
  )
}
