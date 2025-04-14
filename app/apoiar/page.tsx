import type { Metadata } from "next"
import DonationPage from "./landing-doacao"
import { BackgroundGradient } from "@/components/background-gradient"

export const metadata: Metadata = {
  title: "Apoie o CorretorIA - Ajude a manter o corretor de texto gratuito",
  description:
    "Sua contribuição ajuda a manter e melhorar o CorretorIA, permitindo que continuemos oferecendo correção de texto gratuita para todos.",
}

export default function DonationPageWrapper() {
  return (
    <>
      <BackgroundGradient />
      <DonationPage />
    </>
  )
}
