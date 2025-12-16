/**
 * API Route: Create Gift Purchase
 * POST /api/gift/create
 *
 * Creates a gift purchase and initiates payment (PIX or Stripe)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { CHRISTMAS_GIFT_CONFIG, calculateGiftExpirationDate, getGiftPlan } from '@/lib/gift/config'
import type { CreateGiftRequest, CreateGiftResponse, GiftPlanId } from '@/lib/gift/types'

export const maxDuration = 60

// Validation schema
const createGiftSchema = z.object({
  buyer_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  buyer_email: z.string().email('Email invalido'),
  recipient_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  recipient_email: z.string().email('Email invalido'),
  plan_id: z.enum(['monthly', 'annual', 'lifetime']),
  gift_message: z.string().max(CHRISTMAS_GIFT_CONFIG.MAX_MESSAGE_LENGTH).optional(),
  payment_method: z.enum(['pix', 'stripe']),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = createGiftSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados invalidos',
          details: validationResult.error.errors.map(e => e.message),
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Get plan details
    const plan = getGiftPlan(data.plan_id as GiftPlanId)
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plano invalido' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createServiceRoleClient()
    if (!supabase) {
      console.error('[Gift Create] Failed to create Supabase client')
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Generate unique gift code
    const { data: giftCodeResult, error: codeError } = await supabase.rpc('generate_gift_code')

    if (codeError || !giftCodeResult) {
      console.error('[Gift Create] Error generating gift code:', codeError)
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar codigo do presente' },
        { status: 500 }
      )
    }

    const giftCode = giftCodeResult as string
    const expiresAt = calculateGiftExpirationDate()

    // Create gift purchase record
    const { data: giftPurchase, error: insertError } = await supabase
      .from('gift_purchases')
      .insert({
        buyer_name: data.buyer_name.trim(),
        buyer_email: data.buyer_email.trim().toLowerCase(),
        buyer_user_id: null, // Guest purchase
        recipient_name: data.recipient_name.trim(),
        recipient_email: data.recipient_email.trim().toLowerCase(),
        gift_code: giftCode,
        plan_type: data.plan_id,
        plan_duration_months: plan.duration_months,
        gift_message: data.gift_message?.trim() || null,
        payment_method: data.payment_method,
        amount_paid: plan.price,
        status: 'pending_payment',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !giftPurchase) {
      console.error('[Gift Create] Error creating gift purchase:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar registro do presente' },
        { status: 500 }
      )
    }

    console.log('[Gift Create] Gift purchase created:', {
      id: giftPurchase.id,
      code: giftCode,
      plan: data.plan_id,
      payment_method: data.payment_method,
    })

    // Process payment based on method
    if (data.payment_method === 'pix') {
      return await createPixPayment(giftPurchase.id, giftCode, plan.price, data.buyer_email)
    } else {
      // TODO: Implement Stripe payment
      return NextResponse.json(
        { success: false, error: 'Pagamento por cartao em desenvolvimento' },
        { status: 501 }
      )
    }
  } catch (error) {
    console.error('[Gift Create] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar solicitacao',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * Create PIX payment for gift purchase
 */
async function createPixPayment(
  giftId: string,
  giftCode: string,
  amount: number,
  buyerEmail: string
): Promise<NextResponse<CreateGiftResponse>> {
  try {
    const mpClient = getMercadoPagoClient()
    const supabase = createServiceRoleClient()

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Create PIX payment with external_reference = gift_{giftId}
    const externalReference = `gift_${giftId}`
    const description = `Presente CorretorIA - Codigo: ${giftCode}`

    const payment = await mpClient.createPixPayment(
      amount,
      buyerEmail,
      externalReference,
      description,
      30 // 30 minutes expiration
    )

    console.log('[Gift Create] PIX payment created:', {
      paymentId: payment.id,
      giftId,
      amount,
    })

    // Update gift purchase with payment ID
    const { error: updateError } = await supabase
      .from('gift_purchases')
      .update({
        payment_id: payment.id.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', giftId)

    if (updateError) {
      console.error('[Gift Create] Error updating gift with payment ID:', updateError)
      // Continue anyway - payment is already created
    }

    return NextResponse.json({
      success: true,
      gift_id: giftId,
      gift_code: giftCode,
      pix_qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
      pix_qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      pix_copy_paste: payment.point_of_interaction?.transaction_data?.qr_code,
      pix_expires_at: payment.date_of_expiration,
    })
  } catch (error) {
    console.error('[Gift Create] Error creating PIX payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar pagamento PIX',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check gift payment status
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const giftId = url.searchParams.get('id')

    if (!giftId) {
      return NextResponse.json(
        { error: 'ID do presente e obrigatorio' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const { data: gift, error } = await supabase
      .from('gift_purchases')
      .select('status, payment_id, email_sent_at')
      .eq('id', giftId)
      .single()

    if (error || !gift) {
      return NextResponse.json(
        { error: 'Presente nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: gift.status,
      payment_confirmed: ['paid', 'email_sent', 'redeemed'].includes(gift.status),
      email_sent: !!gift.email_sent_at,
    })
  } catch (error) {
    console.error('[Gift Status] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}
