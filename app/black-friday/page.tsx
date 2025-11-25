import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { BlackFridayContent } from "@/components/black-friday/black-friday-content"
import { BackgroundGradient } from "@/components/background-gradient"
import { isBlackFridayActive } from "@/utils/constants"

export const metadata: Metadata = {
  title: "Black Friday - CorretorIA Vitalicio por R$ 99,90 | 10x de R$ 9,90",
  description:
    "Oferta exclusiva de Black Friday: acesso vitalicio ao CorretorIA Premium por apenas R$ 99,90 ou 10x de R$ 9,90. Pague uma vez, use para sempre!",
  openGraph: {
    title: "Black Friday - CorretorIA Vitalicio por R$ 99,90",
    description: "Acesso vitalicio ao CorretorIA Premium por apenas R$ 99,90 ou 10x de R$ 9,90!",
    type: "website",
  },
}

export default function BlackFridayPage() {
  // Check if promotion has ended (server-side)
  if (!isBlackFridayActive()) {
    redirect('/premium')
  }

  return (
    <>
      <BackgroundGradient />
      <main className="container mx-auto py-8 px-4">
        <BlackFridayContent />
      </main>
    </>
  )
}
