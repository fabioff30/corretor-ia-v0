import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase-client-admin'
import { z } from 'zod'

// Input validation schema
const UpdateSubscriptionSchema = z.object({
  action: z.enum(['give_premium', 'give_pro', 'give_plus', 'remove_premium']),
  duration_months: z.number().min(1).max(120).optional().default(12)
})

interface UpdateSubscriptionRequest {
  action: 'give_premium' | 'give_pro' | 'give_plus' | 'remove_premium'
  duration_months?: number
}

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticação admin usando JWT
    await requireAdmin()

    const userId = params.id
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'ID do usuário inválido' },
        { status: 400 }
      )
    }

    // Extrair e validar dados da requisição
    const rawBody = await request.json()
    const { action, duration_months } = UpdateSubscriptionSchema.parse(rawBody)


    const supabaseAdmin = createSupabaseAdmin()
    
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

    // Buscar subscription existente
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    let subscriptionData: any
    let operation: 'insert' | 'update' = existingSubscription ? 'update' : 'insert'

    if (action === 'give_premium' || action === 'give_pro' || action === 'give_plus') {
      const now = new Date()
      const periodEnd = new Date()
      periodEnd.setMonth(now.getMonth() + duration_months)

      // Mapear ação para o plano correspondente
      let planName = 'premium'
      let planId = null

      if (action === 'give_pro') {
        planName = 'pro'
        // Buscar ID do plano Pro
        const { data: proPlan } = await supabaseAdmin
          .from('subscription_plans')
          .select('id')
          .eq('name', 'pro')
          .single()
        planId = proPlan?.id || null
      } else if (action === 'give_plus') {
        planName = 'plus'
        // Buscar ID do plano Plus
        const { data: plusPlan } = await supabaseAdmin
          .from('subscription_plans')
          .select('id')
          .eq('name', 'plus')
          .single()
        planId = plusPlan?.id || null
      }

      subscriptionData = {
        user_id: userId,
        status: 'active',
        plan: planName,
        plan_id: planId,
        billing_period: duration_months >= 12 ? 'annual' : 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString()
      }

      if (!existingSubscription) {
        subscriptionData.created_at = now.toISOString()
      }

    } else if (action === 'remove_premium') {
      const now = new Date()
      
      subscriptionData = {
        user_id: userId,
        status: 'canceled',
        plan: 'free',
        current_period_start: null,
        current_period_end: null,
        updated_at: now.toISOString()
      }

      if (!existingSubscription) {
        subscriptionData.created_at = now.toISOString()
      }
    }

    // Executar operação no banco de dados
    let result
    if (operation === 'update') {
      result = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', userId)
        .select()
        .single()
    } else {
      result = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Erro ao atualizar subscription:', result.error)
      return NextResponse.json(
        { error: 'Erro ao atualizar plano do usuário' },
        { status: 500 }
      )
    }

    // Log da operação para auditoria
    console.log(`Admin alterou plano do usuário ${user.email} (${userId}): ${action}`, {
      previousSubscription: existingSubscription,
      newSubscription: result.data,
      timestamp: new Date().toISOString(),
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Retornar dados atualizados do usuário
    const { data: updatedUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        created_at,
        updated_at,
        subscriptions(
          id,
          status,
          plan,
          current_period_start,
          current_period_end,
          created_at,
          updated_at
        )
      `)
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar usuário atualizado:', fetchError)
      return NextResponse.json(
        { error: 'Plano atualizado, mas erro ao buscar dados atualizados' },
        { status: 500 }
      )
    }

    // Criar mensagem baseada na ação
    let message = ''
    if (action === 'remove_premium') {
      message = `Plano removido de ${user.email}`
    } else {
      const planDisplayName = action === 'give_plus' ? 'Plus' : action === 'give_pro' ? 'Pro' : 'Premium'
      message = `Plano ${planDisplayName} ativado para ${user.email} por ${duration_months} ${duration_months === 1 ? 'mês' : 'meses'}`
    }

    return NextResponse.json({
      success: true,
      message,
      user: {
        ...updatedUser,
        subscription: updatedUser.subscriptions?.[0] || null
      },
      // Sinalizar que o cache do usuário deve ser invalidado
      cacheInvalidation: {
        userEmail: user.email,
        userId: userId,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    // Se for erro de autenticação, retornar 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      )
    }
    
    // Se for erro de validação Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro na API de alteração de plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET para verificar status atual da subscription
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticação admin usando JWT
    await requireAdmin()

    const userId = params.id

    const supabaseAdmin = createSupabaseAdmin()
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        created_at,
        updated_at,
        subscriptions(
          id,
          status,
          plan,
          current_period_start,
          current_period_end,
          created_at,
          updated_at
        )
      `)
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        ...user,
        subscription: user.subscriptions?.[0] || null
      }
    })

  } catch (error) {
    // Se for erro de autenticação, retornar 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      )
    }
    
    console.error('Erro ao buscar subscription:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}