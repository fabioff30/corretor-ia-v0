/**
 * API Route: User History (Admin)
 * GET /api/admin/users/[id]/history
 *
 * Fetches correction/rewrite history for a specific user
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/utils/auth-helpers'

export const maxDuration = 60

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.plan_type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const { id: userId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const operationType = searchParams.get('type') as 'correct' | 'rewrite' | 'ai_analysis' | null

    const supabase = createServiceRoleClient()

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('user_corrections')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Filter by operation type if specified
    if (operationType) {
      query = query.eq('operation_type', operationType)
    }

    // Apply sorting and pagination
    const from = page * limit
    const to = from + limit - 1

    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data: corrections, error, count } = await query

    if (error) {
      console.error('Error fetching user history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch history', details: error.message },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: statsCorrect } = await supabase
      .from('user_corrections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('operation_type', 'correct')

    const { data: statsRewrite } = await supabase
      .from('user_corrections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('operation_type', 'rewrite')

    const { data: statsAI } = await supabase
      .from('user_corrections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('operation_type', 'ai_analysis')

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
      history: corrections || [],
      stats: {
        total_corrections: (statsCorrect as any)?.count || 0,
        total_rewrites: (statsRewrite as any)?.count || 0,
        total_ai_analyses: (statsAI as any)?.count || 0,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users/[id]/history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
