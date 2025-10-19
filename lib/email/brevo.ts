import { getServerConfig } from "@/utils/env-config"

export interface EmailRecipient {
  email: string
  name?: string | null
}

export interface SendEmailParams {
  to: EmailRecipient[]
  subject: string
  htmlContent: string
  textContent: string
}

const brevoEndpoint = "https://api.brevo.com/v3/smtp/email"

export async function sendBrevoEmail({ to, subject, htmlContent, textContent }: SendEmailParams): Promise<void> {
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } = getServerConfig()

  if (!BREVO_API_KEY) {
    console.warn("Brevo API key não configurada. Email não será enviado.")
    return
  }

  if (!BREVO_SENDER_EMAIL) {
    console.warn("Brevo sender email não configurado. Email não será enviado.")
    return
  }

  const payload = {
    sender: {
      email: BREVO_SENDER_EMAIL,
      name: BREVO_SENDER_NAME || "CorretorIA",
    },
    to: to.map((recipient) => ({
      email: recipient.email,
      name: recipient.name || undefined,
    })),
    subject,
    htmlContent,
    textContent,
  }

  const response = await fetch(brevoEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    console.error("Erro ao enviar email via Brevo:", response.status, errorText)
    throw new Error("Falha ao enviar email via Brevo")
  }
}

