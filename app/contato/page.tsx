import type { Metadata } from "next"
import { BackgroundGradient } from "@/components/background-gradient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactForm } from "@/components/contact-form"

export const metadata: Metadata = {
  title: "Contato | CorretorIA",
  description: "Entre em contato com a equipe do CorretorIA. Estamos aqui para ajudar com suas dúvidas e sugestões.",
}

export default function ContactPage() {
  return (
    <>
      <BackgroundGradient />
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Entre em Contato</CardTitle>
            <CardDescription className="text-center">
              Preencha o formulário abaixo para enviar uma mensagem. Responderemos o mais breve possível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
