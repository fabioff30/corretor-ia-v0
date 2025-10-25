/**
 * API Route: Mercado Pago PIX Payment Creation
 * POST /api/mercadopago/create-pix-payment
 *
 * Creates a PIX payment for premium subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const maxDuration = 60

interface CreatePixPaymentRequest {
  planType: 'monthly' | 'annual' | 'test'
  userId?: string
  userEmail?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreatePixPaymentRequest = await request.json()
    const { planType, userId, userEmail } = body

    if (!planType || !['monthly', 'annual', 'test'].includes(planType)) {
      return NextResponse.json(
        { error: 'Tipo de plano inválido' },
        { status: 400 }
      )
    }

    // Define pricing
    const pricing = {
      monthly: {
        amount: 29.90,
        description: 'Plano Premium Mensal - CorretorIA'
      },
      annual: {
        amount: 299.00,
        description: 'Plano Premium Anual - CorretorIA'
      },
      test: {
        amount: 5.00,
        description: '🧪 TESTE - Pagamento PIX R$ 5,00 - CorretorIA'
      }
    }

    const plan = pricing[planType as 'monthly' | 'annual' | 'test']

    // Initialize clients
    const mpClient = getMercadoPagoClient()
    const supabase = createServiceRoleClient()

    // If userId not provided, get from auth header or cookie
    let finalUserId = userId
    let finalUserEmail = userEmail

    if (!finalUserId) {
      // You might want to add authentication check here
      // For now, userId must be provided
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Get user profile if email not provided
    if (!finalUserEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', finalUserId)
        .single()

      if (!profile?.email) {
        return NextResponse.json(
          { error: 'Email do usuário não encontrado' },
          { status: 404 }
        )
      }
      finalUserEmail = profile.email
    }

    // Create PIX payment with Mercado Pago
    const payment = await mpClient.createPixPayment(
      plan.amount,
      finalUserEmail,
      finalUserId,
      plan.description,
      30 // 30 minutes expiration
    )

    console.log('[MP PIX] Payment created:', payment.id)

    // Save PIX payment to database
    const { error: insertError } = await supabase
      .from('pix_payments')
      .insert({
        user_id: finalUserId,
        payment_intent_id: payment.id.toString(),
        amount: plan.amount,
        plan_type: planType,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_code: payment.point_of_interaction?.transaction_data?.qr_code,
        status: 'pending',
        expires_at: payment.date_of_expiration,
      })

    if (insertError) {
      console.error('[MP PIX] Error saving payment:', insertError)
      // Continue anyway - payment was created successfully
    }

    // Return payment details
    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      qrCodeText: payment.point_of_interaction?.transaction_data?.qr_code,
      expiresAt: payment.date_of_expiration,
      amount: plan.amount,
    })
  } catch (error) {
    console.error('[MP PIX] Error creating payment:', error)
    return NextResponse.json(
      {
        error: 'Erro ao criar pagamento PIX',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check PIX payment status
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const paymentId = url.searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    const mpClient = getMercadoPagoClient()
    const status = await mpClient.getPixPaymentStatus(paymentId)

    return NextResponse.json({
      paymentId: status.id,
      status: status.status,
      statusDetail: status.status_detail,
      amount: status.amount,
      dateApproved: status.date_approved,
    })
  } catch (error) {
    console.error('[MP PIX] Error checking payment status:', error)
    return NextResponse.json(
      {
        error: 'Erro ao verificar status do pagamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}