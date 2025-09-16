import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { userId, subscriptionId, reason } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a assinatura pertence ao usuário e está ativa
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Assinatura ativa não encontrada' },
        { status: 404 }
      )
    }

    // Se foi fornecido um subscriptionId específico, verificar se bate
    if (subscriptionId && subscription.id !== subscriptionId) {
      return NextResponse.json(
        { error: 'ID da assinatura não confere' },
        { status: 400 }
      )
    }

    // Atualizar status da assinatura para cancelada
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Erro ao cancelar assinatura:', updateError)
      return NextResponse.json(
        { error: 'Erro ao cancelar assinatura' },
        { status: 500 }
      )
    }

    // Opcional: Registrar motivo do cancelamento em uma tabela de logs
    // (implementar se necessário)

    // Buscar dados atualizados
    const { data: updatedSubscription, error: fetchUpdatedError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscription.id)
      .single()

    if (fetchUpdatedError) {
      console.error('Erro ao buscar assinatura atualizada:', fetchUpdatedError)
    }

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      subscription: updatedSubscription ? {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        plan: updatedSubscription.plan,
        currentPeriodStart: updatedSubscription.current_period_start,
        currentPeriodEnd: updatedSubscription.current_period_end,
        updatedAt: updatedSubscription.updated_at
      } : null
    })

  } catch (error) {
    console.error('Erro na API de cancelamento de assinatura:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}