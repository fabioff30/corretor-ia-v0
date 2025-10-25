/**
 * API Route: Limits Change History (Admin)
 * GET /api/admin/limites/history
 *
 * Returns audit trail of all limits changes
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'

export const maxDuration = 60

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
    const planFilter = searchParams.get('plan') as 'free' | 'pro' | null
    const fieldFilter = searchParams.get('field') || null

    const supabase = createServiceRoleClient()

    // Build query
    let query = supabase
      .from('limits_change_history')
      .select('*', { count: 'exact' })

    // Apply filters
    if (planFilter) {
      query = query.eq('plan_type', planFilter)
    }

    if (fieldFilter) {
      query = query.eq('field_changed', fieldFilter)
    }

    // Apply sorting and pagination
    const from = page * limit
    const to = from + limit - 1

    query = query
      .order('changed_at', { ascending: false })
      .range(from, to)

    const { data: history, error, count } = await query

    if (error) {
      console.error('Error fetching limits history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch history', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      history: history || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/limites/history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
