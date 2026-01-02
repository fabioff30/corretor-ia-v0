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
import { faqData } from "./faq-data"

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
