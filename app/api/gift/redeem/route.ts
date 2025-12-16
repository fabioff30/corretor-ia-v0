/**
 * API Route: Redeem Gift
 * POST /api/gift/redeem
 *
 * Redeems a gift code and activates the subscription for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'
import type { RedeemGiftResponse } from '@/lib/gift/types'

export const maxDuration = 30

// Validation schema
const redeemSchema = z.object({
  code: z.string().min(1, 'Codigo e obrigatorio'),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json<RedeemGiftResponse>(
        { success: false, error: 'Voce precisa estar logado para resgatar um presente' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = redeemSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<RedeemGiftResponse>(
        { success: false, error: 'Codigo invalido' },
        { status: 400 }
      )
    }

    const { code } = validationResult.data
    const normalizedCode = code.trim().toUpperCase()

    // Validate code format
    const codePattern = /^NATAL-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    if (!codePattern.test(normalizedCode)) {
      return NextResponse.json<RedeemGiftResponse>(
        { success: false, error: 'Formato de codigo invalido' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    if (!supabase) {
      return NextResponse.json<RedeemGiftResponse>(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Call the redeem_gift function in Supabase
    const { data: result, error } = await supabase.rpc('redeem_gift', {
      p_gift_code: normalizedCode,
      p_user_id: user.id,
    })

    if (error) {
      console.error('[Gift Redeem] RPC error:', error)
      return NextResponse.json<RedeemGiftResponse>(
        { success: false, error: 'Erro ao resgatar presente' },
        { status: 500 }
      )
    }

    // Parse the JSON result from the function
    const redeemResult = result as {
      success: boolean
      plan_type?: string
      duration_months?: number
      buyer_name?: string
      error?: string
    }

    if (!redeemResult.success) {
      return NextResponse.json<RedeemGiftResponse>(
        { success: false, error: redeemResult.error || 'Erro ao resgatar presente' },
        { status: 400 }
      )
    }

    console.log('[Gift Redeem] Gift redeemed successfully:', {
      userId: user.id,
      code: normalizedCode,
      planType: redeemResult.plan_type,
      durationMonths: redeemResult.duration_months,
    })

    return NextResponse.json<RedeemGiftResponse>({
      success: true,
      plan_type: redeemResult.plan_type,
      duration_months: redeemResult.duration_months,
      buyer_name: redeemResult.buyer_name,
    })
  } catch (error) {
    console.error('[Gift Redeem] Unexpected error:', error)
    return NextResponse.json<RedeemGiftResponse>(
      {
        success: false,
        error: 'Erro ao processar resgate',
      },
      { status: 500 }
    )
  }
}
