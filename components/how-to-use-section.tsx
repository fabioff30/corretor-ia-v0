"use client"

import { Pencil, MousePointerClick, FileText, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

export function HowToUseSection() {
  const steps = [
    {
      icon: <Pencil className="h-8 w-8 text-primary" />,
      number: 1,
      title: "Digite ou Cole seu Texto",
      description:
        "Insira o texto que deseja corrigir na caixa de texto. Você pode digitar diretamente ou colar de outra fonte.",
    },
    {
      icon: <MousePointerClick className="h-8 w-8 text-primary" />,
      number: 2,
      title: "Clique em Corrigir",
      description:
        'Após inserir seu texto, clique no botão "Corrigir" para iniciar o processo de análise e correção automática.',
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      number: 3,
      title: "Revise os Resultados",
      description:
        "Analise o texto corrigido, a comparação visual e a avaliação detalhada com pontos fortes e fracos do seu texto.",
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      number: 4,
      title: "Copie o Texto Corrigido",
      description:
        'Utilize o botão "Copiar Texto" para copiar a versão corrigida para a área de transferência e use onde precisar.',
    },
  ]

  return (
    <section id="como-usar" className="py-20 bg-dots relative">
      <div className="w-full max-w-[1366px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 2xl:px-32">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Fácil de usar
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-gradient">Como Usar Nosso Corretor de Texto</h2>
          <p className="text-foreground/80 max-w-[700px] mx-auto">
            Siga estes simples passos para corrigir seus textos em português
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground text-lg flex items-center justify-center font-bold">
                    {step.number}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent"></div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
              <p className="text-foreground/70">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
