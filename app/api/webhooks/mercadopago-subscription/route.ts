import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PREMIUM_PLAN_PRICE } from '@/utils/constants'

// Cliente Supabase com service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log do webhook recebido
    console.log('Webhook MercadoPago recebido:', JSON.stringify(body, null, 2))

    // Verificar tipo de notificação
    const { type, data } = body
    
    if (type === 'payment') {
      return await handlePaymentNotification(data.id)
    }
    
    if (type === 'subscription_preapproval') {
      return await handleSubscriptionNotification(data.id)
    }

    // Tipos não tratados
    console.log('Tipo de notificação não tratado:', type)
    return NextResponse.json({ status: 'ignored' }, { status: 200 })

  } catch (error) {
    console.error('Erro no webhook MercadoPago:', error)
    return NextResponse.json(
      { error: 'Erro interno do webhook' },
      { status: 500 }
    )
  }
}

async function handlePaymentNotification(paymentId: string) {
  try {
    // Buscar detalhes do pagamento na API do MercadoPago
    const paymentDetails = await fetchPaymentDetails(paymentId)
    
    if (!paymentDetails) {
      return NextResponse.json({ status: 'payment_not_found' }, { status: 404 })
    }

    const { status, external_reference, payer, transaction_amount } = paymentDetails
    
    console.log('Detalhes do pagamento:', {
      id: paymentId,
      status,
      external_reference,
      amount: transaction_amount,
      payer_email: payer?.email
    })

    // Buscar usuário pelo email do pagador
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', payer?.email)
      .single()

    if (userError || !user) {
      console.error('Usuário não encontrado para email:', payer?.email)
      return NextResponse.json({ status: 'user_not_found' }, { status: 404 })
    }

    // Registrar transação
    const { error: transactionError } = await supabaseAdmin
      .rpc('create_transaction', {
        user_uuid: user.id,
        sub_id: null, // Será atualizado depois
        mp_payment_id: paymentId,
        transaction_amount: transaction_amount,
        transaction_status: status
      })

    if (transactionError) {
      console.error('Erro ao criar transação:', transactionError)
    }

    // Se o pagamento foi aprovado, criar/ativar assinatura
    if (status === 'approved') {
      const { data: subscriptionId, error: subscriptionError } = await supabaseAdmin
        .rpc('create_subscription', {
          user_uuid: user.id,
          plan_type: 'premium',
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          mp_subscription_id: external_reference || paymentId
        })

      if (subscriptionError) {
        console.error('Erro ao criar assinatura:', subscriptionError)
        return NextResponse.json({ status: 'subscription_creation_failed' }, { status: 500 })
      }

      console.log('Assinatura premium ativada para usuário:', user.email)
      return NextResponse.json({ status: 'subscription_activated' })
    }

    return NextResponse.json({ status: 'payment_processed' })

  } catch (error) {
    console.error('Erro ao processar notificação de pagamento:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

async function handleSubscriptionNotification(subscriptionId: string) {
  try {
    // Implementar lógica para assinaturas recorrentes quando necessário
    console.log('Notificação de assinatura recebida:', subscriptionId)
    return NextResponse.json({ status: 'subscription_processed' })
  } catch (error) {
    console.error('Erro ao processar notificação de assinatura:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

async function fetchPaymentDetails(paymentId: string) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      throw new Error('Token do MercadoPago não configurado')
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro na API MercadoPago: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar detalhes do pagamento:', error)
    return null
  }
}