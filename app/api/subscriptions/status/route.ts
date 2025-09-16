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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      console.error('Erro ao buscar assinatura:', subscriptionError)
      return NextResponse.json(
        { error: 'Erro ao buscar assinatura' },
        { status: 500 }
      )
    }

    // Buscar todas as transações do usuário (últimas 10)
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (transactionsError) {
      console.error('Erro ao buscar transações:', transactionsError)
    }

    // Determinar status e features
    let effectiveSubscription = null
    if (subscription) {
      // Verificar se a assinatura não expirou
      const isActive = !subscription.current_period_end || 
                      new Date(subscription.current_period_end) > new Date()
      
      if (isActive) {
        effectiveSubscription = {
          id: subscription.id,
          status: subscription.status,
          plan: subscription.plan,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          features: {
            characterLimit: subscription.plan === 'premium' ? 10000 : 1500,
            noAds: subscription.plan === 'premium',
            priorityProcessing: subscription.plan === 'premium',
            advancedAnalysis: subscription.plan === 'premium'
          },
          createdAt: subscription.created_at,
          updatedAt: subscription.updated_at
        }
      }
    }

    // Se não há assinatura ativa, retornar plano gratuito
    if (!effectiveSubscription) {
      effectiveSubscription = {
        id: 'free',
        status: 'active',
        plan: 'free',
        features: {
          characterLimit: 1500,
          noAds: false,
          priorityProcessing: false,
          advancedAnalysis: false
        }
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      subscription: effectiveSubscription,
      transactions: transactions || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API de status de assinatura:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}