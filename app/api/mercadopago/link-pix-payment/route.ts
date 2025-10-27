/**
 * API Route: Link PIX Payment
 * POST /api/mercadopago/link-pix-payment
 *
 * Links an approved PIX payment to the authenticated user's account.
 * This is used when a guest pays first and creates account later.
 *
 * Request body:
 * - email (optional): Email to search for payments. Defaults to authenticated user's email.
 *
 * Response:
 * - success: boolean
 * - subscriptionId: string (if successful)
 * - planType: 'monthly' | 'annual' (if successful)
 * - expiresAt: ISO date string (if successful)
 * - alreadyActive: boolean (if user already has active subscription)
 * - error: string (if failed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithProfile } from '@/utils/auth-helpers'
import { linkPendingPayment } from '@/lib/mercadopago/link-pending-payment'

export const maxDuration = 60

interface LinkPixPaymentRequest {
  email?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: LinkPixPaymentRequest = await request.json().catch(() => ({}))

    // Use provided email or fall back to user's email
    const emailToSearch = body.email?.trim() || user.email

    if (!emailToSearch) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('[Link PIX API] Attempting to link payment for user:', user.id, 'email:', emailToSearch)

    // Call link function
    const result = await linkPendingPayment(user.id, emailToSearch)

    if (!result.success) {
      console.error('[Link PIX API] Failed to link payment:', result.error)

      // Return 404 if no payments found (not an error, just no payments to link)
      if (result.error === 'No approved payments found for this email') {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            message: 'Nenhum pagamento aprovado encontrado para este email',
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'Não foi possível vincular o pagamento',
        },
        { status: 500 }
      )
    }

    // Already active subscription
    if (result.alreadyActive) {
      console.log('[Link PIX API] User already has active subscription')
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        message: 'Você já possui uma assinatura ativa',
      })
    }

    // Success
    console.log('[Link PIX API] ✅ Payment linked successfully:', {
      subscriptionId: result.subscriptionId,
      planType: result.planType,
      paymentId: result.paymentId,
    })

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
      planType: result.planType,
      expiresAt: result.expiresAt,
      paymentId: result.paymentId,
      message: 'Pagamento vinculado com sucesso! Plano Premium ativado.',
    })
  } catch (error) {
    console.error('[Link PIX API] Unexpected error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Erro ao processar vinculação do pagamento',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check if user has pending payments to link
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { user } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const email = url.searchParams.get('email') || user.email

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Import supabase client
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const supabase = createServiceRoleClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      )
    }

    // Check for approved payments
    const { data: approvedPayments, error: fetchError } = await supabase
      .from('pix_payments')
      .select('payment_intent_id, plan_type, amount, created_at')
      .eq('email', email)
      .eq('status', 'approved')
      .is('user_id', null)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[Link PIX API GET] Error fetching payments:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasPendingPayments: approvedPayments && approvedPayments.length > 0,
      count: approvedPayments?.length || 0,
      payments: approvedPayments || [],
    })
  } catch (error) {
    console.error('[Link PIX API GET] Unexpected error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
