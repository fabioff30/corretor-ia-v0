/**
 * API Route: Verify Gift Code
 * GET /api/gift/verify?code={giftCode}
 *
 * Verifies if a gift code is valid and returns gift details
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { CHRISTMAS_GIFT_CONFIG } from '@/lib/gift/config'
import type { VerifyGiftResponse, GiftPlanId } from '@/lib/gift/types'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')?.trim().toUpperCase()

    if (!code) {
      return NextResponse.json<VerifyGiftResponse>(
        { valid: false, error: 'Codigo do presente e obrigatorio' },
        { status: 400 }
      )
    }

    // Validate code format (NATAL-XXXX-XXXX)
    const codePattern = /^NATAL-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    if (!codePattern.test(code)) {
      return NextResponse.json<VerifyGiftResponse>(
        { valid: false, error: 'Formato de codigo invalido' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    if (!supabase) {
      return NextResponse.json<VerifyGiftResponse>(
        { valid: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Get gift purchase by code
    const { data: gift, error } = await supabase
      .from('gift_purchases')
      .select(`
        id,
        gift_code,
        plan_type,
        plan_duration_months,
        buyer_name,
        recipient_name,
        status,
        expires_at,
        redeemed_at
      `)
      .eq('gift_code', code)
      .single()

    if (error || !gift) {
      console.log('[Gift Verify] Gift not found for code:', code)
      return NextResponse.json<VerifyGiftResponse>(
        { valid: false, error: 'Codigo de presente invalido' },
        { status: 404 }
      )
    }

    // Check if gift has been paid (email_sent status means it's ready to redeem)
    if (gift.status === 'pending_payment' || gift.status === 'paid') {
      return NextResponse.json<VerifyGiftResponse>(
        { valid: false, error: 'Este presente ainda nao foi processado' },
        { status: 400 }
      )
    }

    // Check if already redeemed
    if (gift.status === 'redeemed') {
      return NextResponse.json<VerifyGiftResponse>({
        valid: false,
        gift: {
          plan_name: getPlanName(gift.plan_type as GiftPlanId),
          plan_type: gift.plan_type as GiftPlanId,
          duration_months: gift.plan_duration_months,
          buyer_name: gift.buyer_name,
          recipient_name: gift.recipient_name,
          expires_at: gift.expires_at,
          already_redeemed: true,
        },
        error: 'Este presente ja foi resgatado',
      })
    }

    // Check if expired
    if (gift.expires_at && new Date(gift.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('gift_purchases')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', gift.id)

      return NextResponse.json<VerifyGiftResponse>(
        { valid: false, error: 'Este presente expirou' },
        { status: 400 }
      )
    }

    // Check if cancelled
    if (gift.status === 'cancelled') {
      return NextResponse.json<VerifyGiftResponse>(
        { valid: false, error: 'Este presente foi cancelado' },
        { status: 400 }
      )
    }

    // Gift is valid and ready to be redeemed
    return NextResponse.json<VerifyGiftResponse>({
      valid: true,
      gift: {
        plan_name: getPlanName(gift.plan_type as GiftPlanId),
        plan_type: gift.plan_type as GiftPlanId,
        duration_months: gift.plan_duration_months,
        buyer_name: gift.buyer_name,
        recipient_name: gift.recipient_name,
        expires_at: gift.expires_at,
        already_redeemed: false,
      },
    })
  } catch (error) {
    console.error('[Gift Verify] Error:', error)
    return NextResponse.json<VerifyGiftResponse>(
      { valid: false, error: 'Erro ao verificar codigo' },
      { status: 500 }
    )
  }
}

/**
 * Get plan display name
 */
function getPlanName(planType: GiftPlanId): string {
  const plan = CHRISTMAS_GIFT_CONFIG.PLANS[planType]
  return plan?.name || 'Premium'
}
