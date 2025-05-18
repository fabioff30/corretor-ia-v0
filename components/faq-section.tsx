"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"

export function FAQSection() {
  const faqs = [
    {
      question: "O que é um corretor de texto online?",
      answer:
        "Um corretor de texto online é uma ferramenta digital que analisa textos para identificar e corrigir erros ortográficos, gramaticais, de pontuação e estilo. O CorretorIA utiliza inteligência artificial avançada para oferecer correções precisas e contextuais para textos em português, tanto na variante brasileira quanto na europeia, sem necessidade de instalação ou cadastro.",
    },
    {
      question: "Como usar o corretor de texto CorretorIA?",
      answer:
        "Usar o corretor de texto CorretorIA é muito simples: basta colar ou digitar seu texto na caixa de entrada, selecionar o tom desejado (se necessário) e clicar no botão 'Corrigir'. Em segundos, você receberá o texto corrigido, uma comparação mostrando as alterações feitas e uma avaliação detalhada da qualidade do seu texto original. Você pode então copiar o texto corrigido ou continuar editando conforme necessário.",
    },
    {
      question: "O corretor de texto CorretorIA é realmente gratuito?",
      answer:
        "Sim, o corretor de texto CorretorIA é completamente gratuito para uso. Não há custos ocultos, limites de caracteres restritivos ou funcionalidades básicas bloqueadas. Mantemos o serviço através de doações voluntárias de usuários que valorizam a ferramenta e desejam contribuir para sua manutenção e desenvolvimento contínuo.",
    },
    {
      question: "Qual a diferença entre o corretor de texto CorretorIA e outros corretores?",
      answer:
        "O corretor de texto CorretorIA se destaca por utilizar inteligência artificial avançada especificamente treinada para o português, oferecendo correções mais precisas e contextuais. Diferente de outros corretores, o CorretorIA analisa não apenas erros ortográficos, mas também problemas gramaticais complexos, estilo de escrita e coerência textual. Além disso, oferecemos recursos como ajuste de tom, visualização de diferenças e avaliação detalhada do texto, tudo isso gratuitamente e sem necessidade de cadastro.",
    },
    {
      question: "O corretor de texto funciona bem para textos acadêmicos?",
      answer:
        "Sim, o corretor de texto CorretorIA é excelente para textos acadêmicos. Ele foi treinado com uma ampla variedade de textos, incluindo artigos científicos e trabalhos acadêmicos. A ferramenta identifica erros comuns em textos formais, sugere melhorias de estilo e ajuda a manter a consistência terminológica. Para textos acadêmicos, recomendamos selecionar o tom 'Acadêmico' para obter correções mais adequadas ao contexto científico.",
    },
    {
      question: "Os corretores de texto online são seguros para textos confidenciais?",
      answer:
        "A segurança varia de acordo com a política de privacidade de cada ferramenta. No caso do corretor de texto CorretorIA, priorizamos a privacidade dos usuários. Seus textos não são armazenados permanentemente em nossos servidores após a correção, garantindo a confidencialidade do seu conteúdo. Utilizamos apenas dados anônimos para melhorar nossos algoritmos, sem qualquer vinculação ao autor original do texto.",
    },
    {
      question: "Como o corretor de texto lida com termos técnicos ou específicos?",
      answer:
        "O corretor de texto CorretorIA foi treinado com um vasto vocabulário que inclui terminologias específicas de diversas áreas. No entanto, termos muito técnicos, neologismos ou palavras extremamente específicas podem ocasionalmente ser sinalizados como erros. Nestes casos, você pode ignorar a sugestão se tiver certeza de que o termo está correto. Estamos constantemente ampliando nossa base de conhecimento para melhorar o reconhecimento de terminologias especializadas.",
    },
    {
      question: "O corretor de texto pode substituir a revisão humana?",
      answer:
        "Embora o corretor de texto CorretorIA ofereça correções de alta qualidade, ele não substitui completamente a revisão humana, especialmente para textos complexos ou que exigem sensibilidade contextual específica. Recomendamos usar o CorretorIA como uma primeira etapa de revisão, seguida por uma leitura cuidadosa do texto para verificar se as correções sugeridas são apropriadas para o contexto específico do seu documento.",
    },
  ]

  return (
    <section id="faq" className="py-16 bg-muted/20">
      <div className="max-w-[1366px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Perguntas frequentes
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Dúvidas sobre o Corretor de Texto</h2>
          <p className="text-muted-foreground max-w-[700px] mx-auto">
            Encontre respostas para as perguntas mais comuns sobre nosso corretor de texto online
          </p>
        </div>

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
    </section>
  )
}
