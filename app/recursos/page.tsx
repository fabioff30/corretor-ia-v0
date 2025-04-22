import type { Metadata } from "next"
import ResourcePageClient from "./ResourcePageClient"
import { getCanonicalUrl } from "@/lib/canonical-url"

// Atualizar os metadados da página de recursos
export const metadata: Metadata = {
  title: "Corretor de Texto Online e Grátis | Guia Completo de Ferramentas de Correção",
  description:
    "Guia completo sobre corretores de texto online e grátis. Compare ferramentas, aprenda a corrigir erros gramaticais, ortográficos e de estilo em português de forma eficiente e gratuita.",
  keywords:
    "corretor de texto online, corretor de texto grátis, corretor ortográfico, corretor gramatical, português, revisor de texto, correção de texto online, verificador ortográfico, corretor português, ferramenta de correção",
  alternates: {
    canonical: getCanonicalUrl("/recursos"),
  },
  openGraph: {
    title: "Corretor de Texto Online e Grátis | Guia Completo",
    description:
      "Guia completo sobre corretores de texto online e grátis. Compare ferramentas, aprenda a corrigir erros gramaticais, ortográficos e de estilo em português.",
    url: getCanonicalUrl("/recursos"),
    siteName: "Corretor de Texto Online",
    locale: "pt_BR",
    type: "article",
  },
}

export default function ResourcePage() {
  return <ResourcePageClient />
}
