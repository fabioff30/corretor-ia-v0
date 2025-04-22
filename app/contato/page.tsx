import type { Metadata } from "next"
import { ContactForm } from "@/components/contact-form"
import { getCanonicalUrl } from "@/lib/canonical-url"

export const metadata: Metadata = {
  title: "Contato | CorretorIA - Corretor de Texto Online Grátis",
  description: "Entre em contato com a equipe do CorretorIA para dúvidas, sugestões ou parcerias.",
  alternates: {
    canonical: getCanonicalUrl("/contato"),
  },
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Entre em Contato</h1>
        <p className="text-muted-foreground mb-8 text-center">
          Tem alguma dúvida, sugestão ou feedback? Preencha o formulário abaixo e entraremos em contato o mais breve
          possível.
        </p>
        <ContactForm />
      </div>
    </div>
  )
}
