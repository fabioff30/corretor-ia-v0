import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PREMIUM_PLAN_PRICE } from '@/utils/constants'

// Cliente Supabase com service role para operações admin
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
    const { userId, planType = 'premium', paymentId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Calcular datas do período
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 dias

    // Criar assinatura usando a função RPC
    const { data: subscriptionId, error: subscriptionError } = await supabaseAdmin
      .rpc('create_subscription', {
        user_uuid: userId,
        plan_type: planType,
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
        mp_subscription_id: paymentId || null
      })

    if (subscriptionError) {
      console.error('Erro ao criar assinatura:', subscriptionError)
      return NextResponse.json(
        { error: 'Erro ao criar assinatura' },
        { status: 500 }
      )
    }

    // Se houver paymentId, criar transação
    if (paymentId) {
      const { error: transactionError } = await supabaseAdmin
        .rpc('create_transaction', {
          user_uuid: userId,
          sub_id: subscriptionId,
          mp_payment_id: paymentId,
          transaction_amount: PREMIUM_PLAN_PRICE,
          transaction_status: 'approved'
        })

      if (transactionError) {
        console.error('Erro ao criar transação:', transactionError)
        // Não falhamos aqui pois a assinatura já foi criada
      }
    }

    // Buscar dados completos da assinatura criada
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar assinatura:', fetchError)
      return NextResponse.json(
        { error: 'Assinatura criada mas erro ao buscar dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        createdAt: subscription.created_at
      }
    })

  } catch (error) {
    console.error('Erro na API de criação de assinatura:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}