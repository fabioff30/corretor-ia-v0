import { sendBrevoEmail, type EmailRecipient } from "@/lib/email/brevo"
import {
  cancellationEmailTemplate,
  passwordResetEmailTemplate,
  paymentApprovedEmailTemplate,
  premiumUpgradeEmailTemplate,
  welcomeEmailTemplate,
} from "@/lib/email/templates"
import { giftInvitationEmailTemplate } from "@/lib/email/templates/gift-invitation"
import { giftBuyerRewardEmailTemplate } from "@/lib/email/templates/gift-buyer-reward"

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

type PaymentApprovedContext = WelcomeContext & {
  amount: number
  planType: 'monthly' | 'annual'
  activationLink: string
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

export async function sendPaymentApprovedEmail({ to, name, amount, planType, activationLink }: PaymentApprovedContext) {
  const template = paymentApprovedEmailTemplate({ name, amount, planType, activationLink })
  await sendBrevoEmail({
    to: [to],
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
  })
}

type GiftInvitationContext = {
  to: EmailRecipient
  recipientName: string
  buyerName: string
  planName: string
  giftCode: string
  giftMessage?: string | null
  expiresAt: Date
}

export async function sendGiftInvitationEmail({
  to,
  recipientName,
  buyerName,
  planName,
  giftCode,
  giftMessage,
  expiresAt,
}: GiftInvitationContext) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.corretordetextoonline.com.br'
  const redeemUrl = `${appUrl}/presente/${giftCode}`

  const template = giftInvitationEmailTemplate({
    recipientName,
    buyerName,
    planName,
    giftCode,
    giftMessage,
    redeemUrl,
    expiresAt: expiresAt.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  })

  await sendBrevoEmail({
    to: [to],
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
  })
}

type GiftBuyerRewardContext = {
  to: EmailRecipient
  buyerName: string
  recipientName: string
  planName: string
  discountedPrice: number
  originalPrice: number
  pixQrCodeBase64: string
  pixCopyPaste: string
  expiresAt: Date
}

export async function sendGiftBuyerRewardEmail({
  to,
  buyerName,
  recipientName,
  planName,
  discountedPrice,
  originalPrice,
  pixQrCodeBase64,
  pixCopyPaste,
  expiresAt,
}: GiftBuyerRewardContext) {
  const template = giftBuyerRewardEmailTemplate({
    buyerName,
    recipientName,
    planName,
    discountedPrice,
    originalPrice,
    pixQrCodeBase64,
    pixCopyPaste,
    expiresAt: expiresAt.toISOString(),
  })

  await sendBrevoEmail({
    to: [to],
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
  })
}
