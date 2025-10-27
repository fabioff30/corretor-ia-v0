import type { Metadata } from "next"
import { PixPostPayment } from "@/components/premium/pix-post-payment"

export const metadata: Metadata = {
  title: "Pagamento PIX Confirmado - CorretorIA Premium",
  description: "Crie sua senha e ative imediatamente o plano Premium após o pagamento via PIX.",
}

type PixSuccessPageProps = {
  searchParams: Promise<{
    paymentId?: string
    email?: string
    plan?: string
    amount?: string
    guest?: string
  }>
}

export default async function PixSuccessPage({ searchParams }: PixSuccessPageProps) {
  const params = await searchParams
  const { paymentId, email, plan, amount, guest } = params

  const normalizedPlan = plan === "annual" || plan === "test" ? plan : "monthly"
  const parsedAmount = amount ? Number.parseFloat(amount) : undefined
  const normalizedAmount = parsedAmount !== undefined && !Number.isNaN(parsedAmount) ? parsedAmount : undefined
  const isGuest = guest === "1"

  return (
    <PixPostPayment
      paymentId={paymentId}
      email={email}
      plan={normalizedPlan}
      amount={normalizedAmount}
      isGuest={isGuest}
    />
  )
}
