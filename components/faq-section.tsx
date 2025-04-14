"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"

export function FAQSection() {
  const faqs = [
    {
      question: "Os corretores de texto online são realmente gratuitos?",
      answer:
        "Muitos corretores de texto online oferecem versões gratuitas com funcionalidades básicas, como correção ortográfica e gramatical. No entanto, alguns podem ter limitações, como número máximo de caracteres ou recursos premium bloqueados. O CorretorPT oferece uma versão completamente gratuita sem limitações de caracteres para correção de textos em português.",
    },
    {
      question: "Como funciona um corretor de texto online?",
      answer:
        "Os corretores de texto online utilizam algoritmos e, em alguns casos, inteligência artificial para analisar o texto inserido, comparando-o com regras gramaticais, dicionários e padrões linguísticos. Eles identificam erros ortográficos, gramaticais, de pontuação e estilo, sugerindo correções. Alguns corretores mais avançados também analisam o contexto para oferecer sugestões mais precisas.",
    },
    {
      question: "Os corretores de texto online são seguros para textos confidenciais?",
      answer:
        "A segurança varia de acordo com a política de privacidade de cada ferramenta. Alguns corretores armazenam os textos enviados para melhorar seus algoritmos, enquanto outros garantem que nenhum dado é armazenado. Para textos confidenciais, recomenda-se verificar a política de privacidade da ferramenta ou usar corretores que garantam que os textos não são armazenados, como o CorretorPT.",
    },
    {
      question: "Qual é a precisão dos corretores de texto online?",
      answer:
        "A precisão varia significativamente entre diferentes ferramentas. Corretores básicos podem identificar erros ortográficos simples, mas falhar em detectar problemas gramaticais complexos ou erros contextuais. Corretores avançados que utilizam IA, como o CorretorPT, oferecem maior precisão, especialmente para análises contextuais e sugestões de estilo, mas nenhuma ferramenta é 100% perfeita.",
    },
    {
      question: "Os corretores funcionam bem para o português brasileiro e europeu?",
      answer:
        "Nem todos os corretores oferecem suporte adequado para ambas as variantes do português. Alguns são otimizados apenas para o português brasileiro, enquanto outros podem não reconhecer particularidades do português europeu. O ideal é escolher uma ferramenta que especifique suporte para a variante que você utiliza. O CorretorPT é otimizado para ambas as variantes do português.",
    },
    {
      question: "Posso confiar totalmente em um corretor de texto online?",
      answer:
        "Embora os corretores de texto online sejam ferramentas valiosas, não é recomendável confiar exclusivamente neles. Eles podem não captar nuances contextuais, expressões idiomáticas ou questões estilísticas específicas. O ideal é usar o corretor como uma primeira etapa de revisão, seguida por uma leitura cuidadosa do texto para verificar se as correções sugeridas são apropriadas.",
    },
    {
      question: "Como escolher o melhor corretor de texto online para minhas necessidades?",
      answer:
        "Para escolher o melhor corretor, considere: o tipo de texto que você escreve (acadêmico, profissional, criativo), a variante do português que utiliza (brasileiro ou europeu), os recursos que são importantes para você (correção ortográfica, gramatical, de estilo), limitações da versão gratuita, e políticas de privacidade. Teste diferentes ferramentas com um mesmo texto para comparar a precisão e relevância das correções sugeridas.",
    },
    {
      question: "Os corretores de texto online substituem revisores humanos?",
      answer:
        "Não completamente. Embora os corretores de texto online tenham evoluído significativamente, eles ainda não substituem completamente a revisão humana, especialmente para textos complexos ou que exigem sensibilidade contextual. Revisores humanos podem captar nuances, adequação ao público-alvo e questões estilísticas que as ferramentas automáticas podem perder. O ideal é usar ambos os recursos quando possível.",
    },
  ]

  return (
    <div className="max-w-[1366px] mx-auto px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="glass-card rounded-xl p-6 max-w-3xl mx-auto"
      >
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index + 1}`} className="border-white/10 px-2">
              <AccordionTrigger className="text-foreground hover:text-primary py-4 text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/80 pb-4">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  )
}
