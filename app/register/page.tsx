import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Criar Conta - CorretorIA",
  description: "Cadastre-se gratuitamente no CorretorIA e acesse recursos premium",
}

export default function RegisterPage() {
  return <RegisterForm />
}