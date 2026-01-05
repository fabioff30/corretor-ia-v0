// @ts-nocheck
/**
 * API Route: List Users (Admin)
 * GET /api/admin/users
 *
 * Lists all users with filtering and pagination
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'

export const maxDuration = 60

interface UsersQueryParams {
  page?: string
  limit?: string
  search?: string
  plan?: 'free' | 'pro' | 'admin'
  status?: 'active' | 'inactive' | 'past_due' | 'cancelled'
  sortBy?: 'created_at' | 'full_name' | 'plan_type'
  sortOrder?: 'asc' | 'desc'
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { user: currentUser, profile } = await getCurrentUserWithProfile()

    if (!currentUser || !profile || profile.plan_type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const planFilter = searchParams.get('plan') as 'free' | 'pro' | 'admin' | null
    const statusFilter = searchParams.get('status') as 'active' | 'inactive' | 'past_due' | 'cancelled' | null
    const sortBy = (searchParams.get('sortBy') || 'created_at') as 'created_at' | 'full_name' | 'plan_type'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const supabase = createServiceRoleClient()

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply plan filter
    if (planFilter) {
      query = query.eq('plan_type', planFilter)
    }

    // Apply status filter
    if (statusFilter) {
      query = query.eq('subscription_status', statusFilter)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = page * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      )
    }

    // Get usage statistics for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const today = new Date().toISOString().split('T')[0]

        const { data: usage } = await supabase
          .from('usage_limits')
          .select('corrections_used, rewrites_used, ai_analyses_used')
          .eq('user_id', user.id)
          .eq('date', today)
          .single()

        const { count: totalCorrections } = await supabase
          .from('user_corrections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        return {
          ...user,
          usage_today: usage || {
            corrections_used: 0,
            rewrites_used: 0,
            ai_analyses_used: 0,
          },
          total_corrections: totalCorrections || 0,
        }
      })
    )

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
// @ts-nocheck
