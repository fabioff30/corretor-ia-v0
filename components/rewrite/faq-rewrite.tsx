"use client"

import React, { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { HelpCircle, ChevronDown } from "lucide-react"

// Exported for use in JSON-LD schema
export const faqData = [
  {
    question: "Como funciona a reescrita de texto com inteligência artificial?",
    answer: "Nossa IA analisa seu texto original compreendendo o contexto, significado e estrutura. Em seguida, ela reescreve o conteúdo adaptando o vocabulário, tom e estilo conforme sua escolha, mantendo sempre o significado original intacto."
  },
  {
    question: "Posso confiar na qualidade da reescrita automática?",
    answer: "Sim! Nossa tecnologia de IA foi treinada especificamente para textos em português brasileiro. Ela mantém a coerência, corrige erros gramaticais e adapta o estilo sem alterar o significado. Recomendamos sempre revisar o resultado final."
  },
  {
    question: "Qual a diferença entre os estilos formal e acadêmico?",
    answer: "O estilo formal é ideal para comunicações profissionais como e-mails corporativos e relatórios, usando linguagem respeitosa e clara. O acadêmico é específico para trabalhos científicos, com terminologia técnica e estrutura argumentativa mais rigorosa."
  },
  {
    question: "O estilo 'humanizado' realmente deixa o texto mais natural?",
    answer: "Absolutamente! O estilo humanizado transforma textos robóticos em comunicações naturais e conversacionais, usando expressões cotidianas e tom acessível, perfeito para redes sociais e comunicação pessoal."
  },
  {
    question: "Quantas palavras posso reescrever por vez?",
    answer: "Usuarios gratuitos podem reescrever ate 1.000 caracteres por vez. Com o plano Premium, esse limite aumenta para 20.000 caracteres, permitindo reescrever textos mais longos de uma so vez."
  },
  {
    question: "A reescrita preserva o significado original do texto?",
    answer: "Sim, nossa prioridade é manter o significado intacto. A IA reformula apenas a forma de expressão - vocabulário, estrutura das frases e tom - sem alterar as ideias e informações originais do seu texto."
  },
  {
    question: "Posso usar a ferramenta para textos técnicos ou especializados?",
    answer: "Sim! A ferramenta funciona bem com textos técnicos. Recomendamos usar o estilo 'formal' ou 'acadêmico' para preservar a terminologia específica. Para textos muito técnicos, revise sempre o resultado."
  },
  {
    question: "A ferramenta detecta e corrige erros de português?",
    answer: "Sim! Durante o processo de reescrita, nossa IA também corrige automaticamente erros de gramática, ortografia e concordância, entregando um texto não apenas reescrito, mas também corrigido."
  },
  {
    question: "Como escolher o melhor estilo para meu texto?",
    answer: "Considere seu público e objetivo: 'formal' para negócios, 'acadêmico' para pesquisas, 'criativo' para marketing, 'humanizado' para redes sociais e 'como uma criança' para simplificar conceitos complexos."
  },
  {
    question: "Posso reescrever o mesmo texto em diferentes estilos?",
    answer: "Sim! Você pode experimentar diferentes estilos para o mesmo texto e comparar os resultados. Isso é útil para testar qual tom funciona melhor para seu público específico."
  },
  {
    question: "A ferramenta funciona com textos em outras variantes do português?",
    answer: "Nossa IA é otimizada para português brasileiro, mas também compreende português europeu. Para melhores resultados com português europeu, use o estilo 'formal' que mantém estruturas mais universais."
  },
  {
    question: "Há risco de plágio ao usar textos reescritos?",
    answer: "Não, desde que o texto original seja seu. A ferramenta reformula sua própria ideia em novas palavras. Se reescrever texto de terceiros, sempre cite a fonte original e use apenas como base para seu próprio conteúdo."
  }
]

// Show first 6 FAQs initially
const INITIAL_FAQ_COUNT = 6

export function FAQRewrite() {
  const [showAll, setShowAll] = useState(false)

  const visibleFaqs = showAll ? faqData : faqData.slice(0, INITIAL_FAQ_COUNT)
  const remainingCount = faqData.length - INITIAL_FAQ_COUNT

  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          Perguntas Frequentes sobre Reescrita de Texto
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Tire suas dúvidas sobre como funciona nossa ferramenta de reescrita inteligente
          e aproveite ao máximo todos os recursos disponíveis.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="space-y-4">
          {visibleFaqs.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <p className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Show more button */}
        {!showAll && remainingCount > 0 && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAll(true)}
              className="gap-2"
            >
              Ver mais {remainingCount} perguntas
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
