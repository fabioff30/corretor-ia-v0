import type { Metadata } from "next"
import AboutPageClient from "./AboutPageClient"
import { getCanonicalUrl } from "@/lib/canonical-url"

export const metadata: Metadata = {
  title: "Sobre | CorretorIA - Corretor de Texto Online Grátis",
  description: "Conheça mais sobre o CorretorIA, o corretor de texto online grátis com inteligência artificial.",
  alternates: {
    canonical: getCanonicalUrl("/sobre"),
  },
}

export default function AboutPage() {
  return <AboutPageClient />
}
