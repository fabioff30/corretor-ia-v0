/**
 * EXEMPLOS DE APIs PROTEGIDAS - Sistema de Autenticação Unificado
 * 
 * Este arquivo demonstra como proteger endpoints de API com o novo sistema
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdminAuth } from '@/middleware/supabase-auth'
import { getServerSession, getServerUser } from '@/utils/auth-helpers'
import { supabase } from '@/lib/supabase'
import { AdminAuth } from '@/lib/supabase-admin'

/**
 * EXEMPLO 1: API protegida para usuários normais
 * Arquivo: app/api/user/profile/route.ts
 */
export const GET_UserProfile = withAuth(async (request: NextRequest, session) => {
  try {
    // session contém os dados do usuário autenticado do Supabase
    const userId = session.user.id
    
    // Buscar dados completos do usuário
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        *,
        subscription:subscriptions(*)
      `)
      .eq('id', userId)
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar dados do usuário' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      user: userData,
      session: {
        email: session.user.email,
        id: session.user.id
      }
    })
  } catch (error) {
    console.error('Erro na API de perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

/**
 * EXEMPLO 2: API protegida para administradores
 * Arquivo: app/api/admin/users/route.ts
 */
export const GET_AdminUsers = withAdminAuth(async (request: NextRequest, admin) => {
  try {
    // admin contém os dados do administrador
    console.log('Admin acessando:', admin.id)
    
    // Buscar todos os usuários (somente admins podem fazer isso)
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        created_at,
        subscription:subscriptions(plan, status)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      users,
      admin: {
        id: admin.id,
        email: admin.email
      }
    })
  } catch (error) {
    console.error('Erro na API admin de usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

/**
 * EXEMPLO 3: API que funciona sem middleware (verificação manual)
 * Arquivo: app/api/correction/history/route.ts
 */
export async function GET_CorrectionHistory(request: NextRequest) {
  try {
    // Verificar autenticação manualmente
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Buscar histórico de correções do usuário
    const { data: history, error } = await supabase
      .from('correction_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar histórico' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      history,
      user: {
        id: user.id,
        plan: user.subscription?.plan
      }
    })
  } catch (error) {
    console.error('Erro na API de histórico:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * EXEMPLO 4: API de login para administradores
 * Arquivo: app/api/admin/auth/route.ts
 */
export async function POST_AdminLogin(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Validar credenciais do admin
    const result = await AdminAuth.validateLogin(email, password)
    
    if (!result.success || !result.admin) {
      return NextResponse.json(
        { error: result.error || 'Credenciais inválidas' },
        { status: 401 }
      )
    }
    
    // Atualizar último login
    await AdminAuth.updateLastLogin(result.admin.id)
    
    // Retornar dados do admin (sem senha)
    return NextResponse.json({
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
        last_login: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Erro no login admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * EXEMPLO 5: API pública (sem autenticação)
 * Arquivo: app/api/public/stats/route.ts
 */
export async function GET_PublicStats(request: NextRequest) {
  try {
    // Esta API não requer autenticação
    
    // Buscar estatísticas públicas
    const { data: userCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
    
    const { data: correctionCount } = await supabase
      .from('correction_history')
      .select('id', { count: 'exact', head: true })
    
    return NextResponse.json({
      stats: {
        totalUsers: userCount || 0,
        totalCorrections: correctionCount || 0,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Erro na API de estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * EXEMPLO 6: API com diferentes níveis de acesso
 * Arquivo: app/api/analytics/route.ts
 */
export async function GET_Analytics(request: NextRequest) {
  try {
    const session = await getServerSession()
    const user = session ? await getServerUser() : null
    
    // Dados públicos (sempre disponíveis)
    const publicData = {
      totalCorrections: 1000, // placeholder
      avgScore: 8.5
    }
    
    // Se não está autenticado, retornar só dados públicos
    if (!session || !user) {
      return NextResponse.json({
        data: publicData,
        level: 'public'
      })
    }
    
    // Dados do usuário (requer autenticação)
    const { data: userHistory } = await supabase
      .from('correction_history')
      .select('score, created_at')
      .eq('user_id', user.id)
      .limit(10)
    
    const userData = {
      ...publicData,
      userCorrections: userHistory?.length || 0,
      userAvgScore: userHistory?.reduce((acc, curr) => acc + curr.score, 0) / (userHistory?.length || 1)
    }
    
    // Verificar se é admin para dados administrativos
    const adminAuth = request.cookies.get('admin_session')
    
    if (adminAuth?.value) {
      // Dados administrativos (requer admin)
      const { data: allUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
      
      const adminData = {
        ...userData,
        totalUsers: allUsers ?? 0,
        systemHealth: 'good'
      }
      
      return NextResponse.json({
        data: adminData,
        level: 'admin'
      })
    }
    
    return NextResponse.json({
      data: userData,
      level: 'user'
    })
  } catch (error) {
    console.error('Erro na API de analytics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * EXEMPLO 7: Rate limiting baseado em usuário
 * Arquivo: app/api/correction/rate-limited/route.ts
 */
import { createRateLimiter } from '@/middleware/supabase-auth'

const rateLimiter = createRateLimiter(10, 60000) // 10 requests per minute

export const POST_RateLimitedCorrection = withAuth(async (request: NextRequest, session) => {
  try {
    // Verificar rate limit
    if (!rateLimiter(request)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }
    
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { error: 'Texto é obrigatório' },
        { status: 400 }
      )
    }
    
    const user = await getServerUser()
    const isFreePlan = user?.subscription?.plan === 'free'
    const maxChars = isFreePlan ? 1500 : 5000
    
    if (text.length > maxChars) {
      return NextResponse.json(
        { error: `Texto muito longo. Máximo: ${maxChars} caracteres para seu plano.` },
        { status: 400 }
      )
    }
    
    // Processar correção aqui...
    const correctedText = text // placeholder
    
    // Salvar no histórico
    await supabase
      .from('correction_history')
      .insert({
        user_id: session.user.id,
        original_text: text,
        corrected_text: correctedText,
        character_count: text.length,
        score: 8.5, // placeholder
        correction_type: 'complete'
      })
    
    return NextResponse.json({
      original: text,
      corrected: correctedText,
      score: 8.5,
      charactersUsed: text.length,
      remainingCharacters: maxChars - text.length
    })
  } catch (error) {
    console.error('Erro na API de correção:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

/**
 * RESUMO DOS PADRÕES DE PROTEÇÃO:
 * 
 * 1. withAuth() - Para APIs que requerem usuário autenticado
 * 2. withAdminAuth() - Para APIs que requerem admin
 * 3. getServerSession() - Verificação manual em Server Components/APIs
 * 4. Rate limiting integrado - createRateLimiter()
 * 5. Verificação de plano - user.subscription.plan
 * 6. Diferentes níveis de acesso na mesma API
 */