import type { Metadata } from "next"
import AboutPageClient from "./AboutPageClient"

export const metadata: Metadata = {
  title: "Sobre o CorretorIA | Nossa História e Missão",
  description:
    "Conheça a história por trás do CorretorIA, nossa missão de melhorar a comunicação escrita em português e os planos disponíveis.",
}

export default function AboutPage() {
  return <AboutPageClient />
}
