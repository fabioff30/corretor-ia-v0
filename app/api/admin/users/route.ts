import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase-client-admin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

interface UserWithSubscription {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
  subscription?: {
    id: string
    status: 'active' | 'canceled' | 'expired' | 'trial'
    plan: 'free' | 'premium'
    current_period_start?: string
    current_period_end?: string
    created_at: string
    updated_at: string
  }
}

interface PaginationParams {
  limit: number
  offset: number
  search?: string
}

// Input validation schema
const QueryParamsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  search: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação admin usando JWT
    await requireAdmin()

    // Extrair e validar parâmetros de paginação e busca
    const url = new URL(request.url)
    const rawParams = {
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
      search: url.searchParams.get('search')?.trim()
    }
    
    const { limit, offset, search } = QueryParamsSchema.parse(rawParams)
    
    // Sanitizar busca para evitar SQL injection
    const sanitizedSearch = search?.replace(/[%_\\]/g, '\\$&')

    const supabaseAdmin = createSupabaseAdmin()
    
    let query = supabaseAdmin
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
      .order('created_at', { ascending: false })

    // Aplicar filtro de busca se fornecido (sanitizado)
    if (sanitizedSearch) {
      query = query.or(`email.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%`)
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Transformar dados para incluir subscription como objeto único
    const usersWithSubscription: UserWithSubscription[] = users?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at,
      subscription: user.subscriptions?.[0] || {
        id: 'free',
        status: 'active' as const,
        plan: 'free' as const,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    })) || []

    // Buscar total de usuários para paginação
    let countQuery = supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (sanitizedSearch) {
      countQuery = countQuery.or(`email.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%`)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      users: usersWithSubscription,
      pagination: {
        limit,
        offset,
        count: usersWithSubscription.length,
        total: totalCount || 0,
        hasNext: usersWithSubscription.length === limit,
        hasPrev: offset > 0
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
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro na API de usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}