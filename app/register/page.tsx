import { Suspense } from "react"
import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Criar Conta - CorretorIA",
  description: "Cadastre-se gratuitamente no CorretorIA e acesse recursos premium",
}

function RegisterFormFallback() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFormFallback />}>
      <RegisterForm />
    </Suspense>
  )
}
