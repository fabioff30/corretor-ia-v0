import { sendBrevoEmail, type EmailRecipient } from "@/lib/email/brevo"
import {
  cancellationEmailTemplate,
  passwordResetEmailTemplate,
  premiumUpgradeEmailTemplate,
  welcomeEmailTemplate,
} from "@/lib/email/templates"

type BasicContext = {
  to: EmailRecipient
}

type WelcomeContext = BasicContext & {
  name?: string | null
}

type PremiumContext = WelcomeContext

type CancellationContext = WelcomeContext

type PasswordResetContext = WelcomeContext & {
  resetLink: string
}

export async function sendWelcomeEmail({ to, name }: WelcomeContext) {
  const template = welcomeEmailTemplate({ name })
  await sendBrevoEmail({
    to: [to],
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
  })
}

export async function sendPremiumUpgradeEmail({ to, name }: PremiumContext) {
  const template = premiumUpgradeEmailTemplate({ name })
  await sendBrevoEmail({
    to: [to],
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
  })
}

export async function sendCancellationEmail({ to, name }: CancellationContext) {
  const template = cancellationEmailTemplate({ name })
  await sendBrevoEmail({
    to: [to],
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
  })
}

export async function sendPasswordResetEmail({ to, name, resetLink }: PasswordResetContext) {
  const template = passwordResetEmailTemplate({ name, resetLink })
  await sendBrevoEmail({
    to: [to],
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
  })
}
