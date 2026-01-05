// @ts-nocheck
/**
 * Debug endpoint to test email sending
 * Accessible only to admins
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendWelcomeEmail,
  sendPremiumUpgradeEmail,
  sendCancellationEmail,
  sendPasswordResetEmail,
  sendPaymentApprovedEmail,
  sendNewYearBundleEmail,
} from '@/lib/email/send'

export const maxDuration = 15

type EmailTemplate = 'welcome' | 'premium-upgrade' | 'cancellation' | 'password-reset' | 'payment-approved' | 'new-year-bundle'

interface SendTestEmailRequest {
  template: EmailTemplate
  to: string
  name?: string
  resetLink?: string
  amount?: number
  planType?: 'monthly' | 'annual'
  activationLink?: string
  // New Year Bundle specific
  isFreePlan?: boolean
  isCancelled?: boolean
}

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single()

    if (profile?.plan_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
    }

    // Parse request body
    const body: SendTestEmailRequest = await request.json()
    const { template, to, name, resetLink, amount, planType, activationLink, isFreePlan, isCancelled } = body

    if (!template || !to) {
      return NextResponse.json(
        { error: 'Template e destinatário são obrigatórios' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const recipient = {
      email: to,
      name: name || 'Usuário Teste',
    }

    let emailSent = false
    let emailDetails = ''

    // Send the appropriate email based on template
    switch (template) {
      case 'welcome':
        await sendWelcomeEmail({ to: recipient, name: recipient.name })
        emailSent = true
        emailDetails = 'Email de boas-vindas enviado'
        break

      case 'premium-upgrade':
        await sendPremiumUpgradeEmail({ to: recipient, name: recipient.name })
        emailSent = true
        emailDetails = 'Email de upgrade premium enviado'
        break

      case 'cancellation':
        await sendCancellationEmail({ to: recipient, name: recipient.name })
        emailSent = true
        emailDetails = 'Email de cancelamento enviado'
        break

      case 'password-reset':
        if (!resetLink) {
          return NextResponse.json(
            { error: 'Link de recuperação é obrigatório para este template' },
            { status: 400 }
          )
        }
        await sendPasswordResetEmail({ to: recipient, name: recipient.name, resetLink })
        emailSent = true
        emailDetails = 'Email de recuperação de senha enviado'
        break

      case 'payment-approved':
        if (!amount || !planType || !activationLink) {
          return NextResponse.json(
            { error: 'Valor, tipo de plano e link de ativação são obrigatórios para este template' },
            { status: 400 }
          )
        }
        await sendPaymentApprovedEmail({
          to: recipient,
          name: recipient.name,
          amount,
          planType,
          activationLink
        })
        emailSent = true
        emailDetails = 'Email de pagamento aprovado enviado'
        break

      case 'new-year-bundle':
        await sendNewYearBundleEmail({
          to: recipient,
          name: recipient.name,
          isFreePlan: isFreePlan ?? true,
          isCancelled: isCancelled ?? false
        })
        emailSent = true
        emailDetails = 'Email de oferta de fim de ano enviado'
        break

      default:
        return NextResponse.json({ error: 'Template inválido' }, { status: 400 })
    }

    if (emailSent) {
      console.log('[Email Debug] Email enviado com sucesso:', {
        template,
        to,
        name,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: emailDetails,
        details: {
          template,
          to,
          name,
          timestamp: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 })
  } catch (error) {
    console.error('[Email Debug] Erro ao enviar email de teste:', error)

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      {
        error: 'Erro ao enviar email de teste',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check available templates
export async function GET() {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single()

    if (profile?.plan_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
    }

    return NextResponse.json({
      templates: [
        {
          id: 'welcome',
          name: 'Boas-vindas',
          description: 'Email enviado quando um novo usuário cria sua conta',
          requiredFields: ['to', 'name'],
        },
        {
          id: 'premium-upgrade',
          name: 'Upgrade Premium',
          description: 'Email enviado quando um usuário ativa o plano Premium',
          requiredFields: ['to', 'name'],
        },
        {
          id: 'payment-approved',
          name: 'Pagamento Aprovado',
          description: 'Email enviado quando um pagamento PIX é aprovado e requer ativação',
          requiredFields: ['to', 'name', 'amount', 'planType', 'activationLink'],
        },
        {
          id: 'cancellation',
          name: 'Cancelamento',
          description: 'Email enviado quando um usuário cancela a assinatura Premium',
          requiredFields: ['to', 'name'],
        },
        {
          id: 'password-reset',
          name: 'Recuperação de Senha',
          description: 'Email enviado quando um usuário solicita recuperação de senha',
          requiredFields: ['to', 'name', 'resetLink'],
        },
        {
          id: 'new-year-bundle',
          name: 'Oferta de Fim de Ano',
          description: 'Email promocional da campanha de fim de ano - CorretorIA + Julinho por R$19,90/mês',
          requiredFields: ['to', 'name'],
          optionalFields: ['isFreePlan', 'isCancelled'],
        },
      ],
    })
  } catch (error) {
    console.error('[Email Debug] Erro ao listar templates:', error)
    return NextResponse.json({ error: 'Erro ao listar templates' }, { status: 500 })
  }
}
// @ts-nocheck
