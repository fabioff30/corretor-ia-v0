/**
 * API Route: Manual PIX Activation
 * POST /api/mercadopago/activate-pix-payment
 *
 * Allows an authenticated user to finalize PIX activation when webhook processing is delayed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'

export const maxDuration = 60

interface ActivatePixPaymentRequest {
  paymentId: string | number
}

export async function POST(request: NextRequest) {
  try {
    const body: ActivatePixPaymentRequest = await request.json()

    // Convert paymentId to string (may be sent as number or string)
    const paymentId = typeof body.paymentId === 'string'
      ? body.paymentId.trim()
      : body.paymentId?.toString() || ''

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    if (!supabase) {
      console.error('[Manual PIX Activation] Service role client unavailable')
      return NextResponse.json(
        { error: 'Erro interno ao ativar pagamento' },
        { status: 500 }
      )
    }

    let mpPayment

    try {
      mpPayment = await getMercadoPagoClient().getPayment(paymentId)
    } catch (error) {
      console.error('[Manual PIX Activation] Error fetching Mercado Pago payment:', error)
      return NextResponse.json(
        { error: 'Erro ao consultar status do pagamento' },
        { status: 502 }
      )
    }

    if (mpPayment.status !== 'approved') {
      return NextResponse.json(
        {
          error: 'Pagamento ainda não aprovado',
          status: mpPayment.status,
        },
        { status: 409 }
      )
    }

    // Fetch PIX payment record
    const { data: pixPayment, error: pixError } = await supabase
      .from('pix_payments')
      .select('*')
      .eq('payment_intent_id', paymentId)
      .maybeSingle()

    if (pixError) {
      console.error('[Manual PIX Activation] Error fetching pix_payment:', pixError)
      return NextResponse.json(
        { error: 'Erro ao buscar pagamento' },
        { status: 500 }
      )
    }

    if (!pixPayment) {
      return NextResponse.json(
        { error: 'PIX não encontrado' },
        { status: 404 }
      )
    }

    if (pixPayment.user_id && pixPayment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const planType = pixPayment.plan_type

    if (planType !== 'monthly' && planType !== 'annual') {
      return NextResponse.json(
        { error: 'Tipo de plano inválido para ativação manual' },
        { status: 400 }
      )
    }

    const paidAtIso = mpPayment.date_approved || pixPayment.paid_at || new Date().toISOString()
    const { startDateIso, expiresAtIso } = calculateSubscriptionWindow(planType, paidAtIso)

    // Ensure pix_payment belongs to the current user and mark as consumed
    const { error: updatePixError } = await supabase
      .from('pix_payments')
      .update({
        status: 'consumed',  // Mark as consumed since we're activating it
        paid_at: paidAtIso,
        user_id: user.id,
        email: pixPayment.email || user.email,
        linked_to_user_at: new Date().toISOString(),
      })
      .eq('id', pixPayment.id)

    if (updatePixError) {
      console.error('[Manual PIX Activation] Error updating pix_payment:', updatePixError)
      return NextResponse.json(
        { error: 'Erro ao atualizar pagamento PIX' },
        { status: 500 }
      )
    }

    // Check existing subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['authorized', 'active'])
      .maybeSingle()

    if (existingSubscription) {
      return NextResponse.json({
        activated: false,
        message: 'A assinatura já está ativa.',
      })
    }

    // Create subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        mp_subscription_id: `pix_${paymentId}`,
        mp_payer_id: mpPayment.payer?.id || null,
        status: 'authorized',
        start_date: startDateIso,
        next_payment_date: expiresAtIso,
        amount: mpPayment.transaction_amount,
        currency: mpPayment.currency_id,
        payment_method_id: 'pix',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Manual PIX Activation] Error creating subscription:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar assinatura' },
        { status: 500 }
      )
    }

    const { error: activateError } = await supabase.rpc('activate_subscription', {
      p_user_id: user.id,
      p_subscription_id: newSubscription.id,
    })

    if (activateError) {
      console.error('[Manual PIX Activation] Error running activate_subscription RPC:', activateError)
    }

    // Update profile
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        plan_type: 'pro',
        subscription_status: 'active',
        subscription_expires_at: expiresAtIso,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      console.error('[Manual PIX Activation] Error updating profile:', profileUpdateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      activated: true,
      subscriptionId: newSubscription.id,
      planType,
      expiresAt: expiresAtIso,
    })
  } catch (error) {
    console.error('[Manual PIX Activation] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Erro ao ativar assinatura',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

function calculateSubscriptionWindow(planType: 'monthly' | 'annual', paidAtIso: string) {
  const paidAt = new Date(paidAtIso)
  const baseTime = Number.isNaN(paidAt.getTime()) ? Date.now() : paidAt.getTime()
  const startDate = new Date(baseTime)
  const expiresAt = new Date(baseTime)

  if (planType === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  }

  return {
    startDateIso: startDate.toISOString(),
    expiresAtIso: expiresAt.toISOString(),
  }
}
