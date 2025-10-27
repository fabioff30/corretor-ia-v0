/**
 * API Route: Mercado Pago PIX Payment Creation
 * POST /api/mercadopago/create-pix-payment
 *
 * Creates a PIX payment for premium subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'

export const maxDuration = 60

interface CreatePixPaymentRequest {
  planType: 'monthly' | 'annual'
  userId?: string
  userEmail?: string
  guestEmail?: string // Email for guest (non-logged) users
  couponCode?: string // Optional coupon code for discounts
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body first
    const body: CreatePixPaymentRequest = await request.json()
    const { planType, userId, couponCode } = body
    const userEmail = typeof body.userEmail === 'string' ? body.userEmail.trim() : undefined
    const guestEmail = typeof body.guestEmail === 'string' ? body.guestEmail.trim() : undefined

    if (!planType || !['monthly', 'annual'].includes(planType)) {
      return NextResponse.json(
        { error: 'Tipo de plano inválido' },
        { status: 400 }
      )
    }

    // Try to get authenticated user (optional)
    const { user } = await getCurrentUserWithProfile()

    // Determine if this is a guest payment
    const isGuestPayment = !user

    // Validate: must have either logged user OR guestEmail
    if (isGuestPayment && !guestEmail) {
      return NextResponse.json(
        { error: 'Email é obrigatório para pagamento sem login' },
        { status: 400 }
      )
    }

    // Validate email format for guest payments
    if (isGuestPayment && guestEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(guestEmail)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        )
      }
    }

    // Define pricing
    const pricing = {
      monthly: {
        amount: 29.90,
        description: 'Plano Premium Mensal - CorretorIA'
      },
      annual: {
        amount: 299.00,
        description: 'Plano Premium Anual - CorretorIA'
      }
    }

    const plan = pricing[planType]

    // Apply discount if coupon code is provided (ZhX6Oy78 = 50% off)
    const discountPercent = couponCode === 'ZhX6Oy78' ? 50 : 0
    const finalAmount = plan.amount * (1 - discountPercent / 100)

    // Initialize clients
    const mpClient = getMercadoPagoClient()
    const supabase = createServiceRoleClient()

    if (!supabase) {
      const { user } = await getCurrentUserWithProfile()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      console.error('[MP PIX] Service role client not available')
      return NextResponse.json(
        { error: 'Erro ao verificar status do pagamento' },
        { status: 500 }
      )
    }

    // Determine user ID and email
    let finalUserId: string | null = null
    let finalUserEmail: string

    if (isGuestPayment) {
      // Guest payment - no user ID
      finalUserId = null
      finalUserEmail = guestEmail!
      console.log('[MP PIX] Creating guest payment for email:', finalUserEmail)
    } else {
      // Authenticated user payment
      finalUserId = userId || user!.id

      // Security check: user can only create payment for themselves
      if (finalUserId !== user!.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      // Get user email
      if (userEmail) {
        finalUserEmail = userEmail
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', finalUserId)
          .single()

        const profileEmail = profile?.email?.trim() || user?.email?.trim() || null

        if (!profileEmail) {
          return NextResponse.json(
            { error: 'Email do usuário não encontrado' },
            { status: 404 }
          )
        }
        finalUserEmail = profileEmail
      }
    }

    // Create PIX payment with Mercado Pago
    // Use email as external_reference for guest payments
    const externalReference = finalUserId || `guest_${finalUserEmail}`

    const payment = await mpClient.createPixPayment(
      finalAmount,
      finalUserEmail,
      externalReference,
      plan.description,
      30 // 30 minutes expiration
    )

    console.log('[MP PIX] Payment created:', payment.id, 'for', isGuestPayment ? 'guest' : 'user')

    // Save PIX payment to database
    const { error: insertError } = await supabase
      .from('pix_payments')
      .insert({
        user_id: finalUserId, // NULL for guest payments
        email: isGuestPayment ? finalUserEmail : null, // Store email for guest payments
        payment_intent_id: payment.id.toString(),
        amount: finalAmount,
        plan_type: planType,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_code: payment.point_of_interaction?.transaction_data?.qr_code,
        status: 'pending',
        expires_at: payment.date_of_expiration,
      })

    if (insertError) {
      console.error('[MP PIX] Error saving payment:', insertError)
      return NextResponse.json(
        {
          error: 'Erro ao registrar pagamento PIX',
          message: 'PIX criado, mas não foi possível salvar no banco. Tente novamente em instantes.',
        },
        { status: 500 }
      )
    }

    // Return payment details
    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      qrCodeText: payment.point_of_interaction?.transaction_data?.qr_code,
      expiresAt: payment.date_of_expiration,
      amount: finalAmount,
      payerEmail: finalUserEmail,
      isGuest: isGuestPayment,
    })
  } catch (error) {
    console.error('[MP PIX] Error creating payment:', error)
    return NextResponse.json(
      {
        error: 'Erro ao criar pagamento PIX',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check PIX payment status
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const paymentId = url.searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get payment record first to check if it's a guest payment
    const supabase = createServiceRoleClient()

    if (!supabase) {
      const { user } = await getCurrentUserWithProfile()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      console.error('[MP PIX] Service role client not available for status check')
      return NextResponse.json(
        { error: 'Erro ao verificar status do pagamento' },
        { status: 500 }
      )
    }

    const { data: paymentRecord, error: paymentLookupError } = await supabase
      .from('pix_payments')
      .select('user_id, email')
      .eq('payment_intent_id', paymentId)
      .maybeSingle()

    if (paymentLookupError) {
      console.error('[MP PIX] Error fetching payment record:', paymentLookupError)
      return NextResponse.json(
        { error: 'Erro ao verificar status do pagamento' },
        { status: 500 }
      )
    }

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Security validation
    // If payment has a user_id (authenticated payment), verify the user
    if (paymentRecord.user_id !== null) {
      const { user } = await getCurrentUserWithProfile()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      if (paymentRecord.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }
    // If user_id is null, it's a guest payment - allow access to anyone with the payment ID
    console.log('[MP PIX] Checking status for', paymentRecord.user_id ? 'authenticated' : 'guest', 'payment:', paymentId)

    const mpClient = getMercadoPagoClient()
    const status = await mpClient.getPixPaymentStatus(paymentId)

    return NextResponse.json({
      paymentId: status.id,
      status: status.status,
      statusDetail: status.status_detail,
      amount: status.amount,
      dateApproved: status.date_approved,
    })
  } catch (error) {
    console.error('[MP PIX] Error checking payment status:', error)
    return NextResponse.json(
      {
        error: 'Erro ao verificar status do pagamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
