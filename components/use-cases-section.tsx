"use client"

import { GraduationCap, Briefcase, BookOpen, Mail, MessageSquare, FileText } from "lucide-react"
import { motion } from "framer-motion"

export function UseCasesSection() {
  const useCases = [
    {
      icon: <GraduationCap className="h-6 w-6 text-primary" />,
      title: "Trabalhos Acadêmicos",
      description:
        "Garanta que seus trabalhos acadêmicos, teses, dissertações e artigos científicos estejam livres de erros gramaticais e ortográficos.",
    },
    {
      icon: <Briefcase className="h-6 w-6 text-primary" />,
      title: "Documentos Profissionais",
      description:
        "Melhore a qualidade de relatórios, propostas comerciais, currículos e outros documentos profissionais para causar uma boa impressão.",
    },
    {
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      title: "Conteúdo Criativo",
      description:
        "Aperfeiçoe seus textos criativos, como histórias, poemas, roteiros e postagens de blog, garantindo clareza e correção linguística.",
    },
    {
      icon: <Mail className="h-6 w-6 text-primary" />,
      title: "E-mails Importantes",
      description:
        "Certifique-se de que seus e-mails profissionais e pessoais importantes estão bem escritos e livres de erros que possam comprometer sua mensagem.",
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      title: "Redes Sociais",
      description:
        "Evite erros em suas publicações nas redes sociais, especialmente em perfis profissionais ou de negócios, onde a qualidade do texto reflete sua imagem.",
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "Traduções",
      description:
        "Refine textos traduzidos para o português, corrigindo erros comuns de tradução e adaptando o conteúdo para soar mais natural no idioma.",
    },
  ]

  return (
    <section id="casos-de-uso" className="py-20 relative">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8"> {/* Mudança aqui */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Versatilidade
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-gradient">Casos de Uso do Corretor de Texto</h2>
          <p className="text-foreground/80 max-w-[700px] mx-auto">
            Nossa ferramenta é ideal para diversos tipos de textos e situações
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="feature-card"
            >
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  {useCase.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground">{useCase.title}</h3>
              </div>
              <p className="text-foreground/70">{useCase.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 w-full max-w-[1366px] -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"></div>
      <div className="absolute bottom-0 left-1/2 w-full max-w-[1366px] -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"></div>
    </section>
  )
}
