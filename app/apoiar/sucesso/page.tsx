import type { Metadata } from "next"
import DonationSuccessClient from "./DonationSuccessClient"

export const metadata: Metadata = {
  title: "Doação Concluída - CorretorIA",
  description: "Obrigado pela sua doação ao CorretorIA. Sua contribuição ajuda a manter o serviço gratuito para todos.",
}

export default function DonationSuccessPage() {
  return <DonationSuccessClient />
}
