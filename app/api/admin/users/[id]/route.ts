/**
 * API Route: Edit User (Admin)
 * PATCH /api/admin/users/[id]
 *
 * Allows admin to edit user plan type
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'

export const maxDuration = 60

interface UpdateUserRequest {
  plan_type?: 'free' | 'pro' | 'admin'
  subscription_status?: 'active' | 'inactive' | 'past_due' | 'cancelled'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const { user: currentUser, profile } = await getCurrentUserWithProfile()

    if (!currentUser || !profile || profile.plan_type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const { id: userId } = await params
    const body: UpdateUserRequest = await request.json()

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      )
    }

    if (!body.plan_type && !body.subscription_status) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: Partial<UpdateUserRequest> = {}

    if (body.plan_type) {
      updateData.plan_type = body.plan_type
    }

    if (body.subscription_status) {
      updateData.subscription_status = body.subscription_status
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user', details: updateError.message },
        { status: 500 }
      )
    }

    // Log the change for audit trail
    if (body.plan_type && body.plan_type !== existingUser.plan_type) {
      await supabase.from('admin_audit_log').insert({
        admin_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'update_user_plan',
        target_user_id: userId,
        target_user_email: existingUser.email,
        old_value: existingUser.plan_type,
        new_value: body.plan_type,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const { user: currentUser, profile } = await getCurrentUserWithProfile()

    if (!currentUser || !profile || profile.plan_type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const { id: userId } = await params

    const supabase = createServiceRoleClient()

    // Get user details
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get usage statistics
    const today = new Date().toISOString().split('T')[0]

    const { data: usage } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    const { count: totalCorrections } = await supabase
      .from('user_corrections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get subscription info if pro user
    let subscription = null
    if (user.plan_type === 'pro') {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'authorized', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      subscription = subData
    }

    return NextResponse.json({
      user: {
        ...user,
        usage_today: usage || {
          corrections_used: 0,
          rewrites_used: 0,
          ai_analyses_used: 0,
        },
        total_corrections: totalCorrections || 0,
        subscription,
      },
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
