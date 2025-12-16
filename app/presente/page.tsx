import type { Metadata } from "next"
import { GiftPageContent } from "@/components/gift/gift-page-content"
import { BackgroundGradient } from "@/components/background-gradient"

export const metadata: Metadata = {
  title: "Presente de Natal - CorretorIA Premium",
  description:
    "Presenteie alguem especial com uma assinatura do CorretorIA Premium. Correcoes ilimitadas, analise de IA e muito mais.",
  openGraph: {
    title: "Presente de Natal - CorretorIA Premium",
    description: "Presenteie alguem especial com uma assinatura do CorretorIA Premium",
    images: ["/og-gift.png"],
  },
}

export default function PresentePage() {
  return (
    <>
      <BackgroundGradient />
      <main className="container mx-auto py-8 px-4">
        <GiftPageContent />
      </main>
    </>
  )
}
