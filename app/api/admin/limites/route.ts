/**
 * API Route: Plan Limits Configuration (Admin)
 * GET /api/admin/limites - Get all plan limits
 * PATCH /api/admin/limites - Update plan limits
 *
 * Manages editable limits for free and pro plans
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'

export const maxDuration = 60

interface UpdateLimitsRequest {
  plan_type: 'free' | 'pro'
  max_characters?: number
  corrections_per_day?: number
  rewrites_per_day?: number
  ai_analyses_per_day?: number
  show_ads?: boolean
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

    const supabase = createServiceRoleClient()

    // Get all plan limits
    const { data: limits, error } = await supabase
      .from('plan_limits_config')
      .select('*')
      .order('plan_type', { ascending: true })

    if (error) {
      console.error('Error fetching limits:', error)
      return NextResponse.json(
        { error: 'Failed to fetch limits', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ limits })
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/limites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    const { user: currentUser, profile } = await getCurrentUserWithProfile()

    if (!currentUser || !profile || profile.plan_type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const body: UpdateLimitsRequest = await request.json()
    const { plan_type, ...updates } = body

    // Validate required fields
    if (!plan_type) {
      return NextResponse.json(
        { error: 'Missing required field: plan_type' },
        { status: 400 }
      )
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get current limits for comparison
    const { data: currentLimits, error: fetchError } = await supabase
      .from('plan_limits_config')
      .select('*')
      .eq('plan_type', plan_type)
      .single()

    if (fetchError || !currentLimits) {
      return NextResponse.json(
        { error: 'Plan limits not found' },
        { status: 404 }
      )
    }

    // Update limits
    const { data: updatedLimits, error: updateError } = await supabase
      .from('plan_limits_config')
      .update({
        ...updates,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('plan_type', plan_type)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating limits:', updateError)
      return NextResponse.json(
        { error: 'Failed to update limits', details: updateError.message },
        { status: 500 }
      )
    }

    // Log changes to history
    const changes: Array<{
      plan_type: string
      field_changed: string
      old_value: string
      new_value: string
      changed_by: string
      changed_by_email: string
    }> = []

    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = currentLimits[key as keyof typeof currentLimits]

      if (oldValue !== newValue) {
        changes.push({
          plan_type,
          field_changed: key,
          old_value: String(oldValue),
          new_value: String(newValue),
          changed_by: currentUser.id,
          changed_by_email: currentUser.email ?? 'unknown',
        })
      }
    }

    if (changes.length > 0) {
      await supabase.from('limits_change_history').insert(changes)
    }

    return NextResponse.json({
      success: true,
      limits: updatedLimits,
      changes_count: changes.length,
      message: 'Limits updated successfully',
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/limites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
