import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/mercadopago/create-pix-payment/route'

jest.mock('@/utils/auth-helpers', () => ({
  getCurrentUserWithProfile: jest.fn(),
}))

jest.mock('@/lib/mercadopago/client', () => ({
  getMercadoPagoClient: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}))

const { getCurrentUserWithProfile } = require('@/utils/auth-helpers') as {
  getCurrentUserWithProfile: jest.Mock
}

const { getMercadoPagoClient } = require('@/lib/mercadopago/client') as {
  getMercadoPagoClient: jest.Mock
}

const { createServiceRoleClient } = require('@/lib/supabase/server') as {
  createServiceRoleClient: jest.Mock
}

const originalNodeEnv = process.env.NODE_ENV

function buildSupabaseMock(options: {
  profileEmail?: string
  insertError?: any
  paymentRecord?: { user_id: string } | null
} = {}) {
  const {
    profileEmail = 'user@example.com',
    insertError = null,
    paymentRecord = { user_id: 'user-1' },
  } = options

  const single = jest.fn(async () => ({
    data: { email: profileEmail },
    error: null,
  }))

  const maybeSingle = jest.fn(async () => ({
    data: paymentRecord,
    error: null,
  }))

  const insert = jest.fn(async () => ({ error: insertError }))

  const supabase = {
    from: jest.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single,
            })),
          })),
        }
      }

      if (table === 'pix_payments') {
        return {
          insert,
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle,
            })),
          })),
        }
      }

      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(async () => ({ data: null, error: null })),
          })),
        })),
      }
    }),
  }

  return { supabase, insert, maybeSingle, single }
}

describe('Mercado Pago create PIX payment API', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.NODE_ENV = 'test'
  })

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('requires guest email when user is not authenticated', async () => {
    getCurrentUserWithProfile.mockResolvedValue({ user: null, profile: null })
    const request = new NextRequest('https://example.com/api/mercadopago/create-pix-payment', {
      method: 'POST',
      body: JSON.stringify({
        planType: 'monthly',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toBe('Email é obrigatório para pagamento sem login')
  })

  it('rejects POST when userId does not match authenticated user', async () => {
    getCurrentUserWithProfile.mockResolvedValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1' },
    })

    const { supabase } = buildSupabaseMock()
    createServiceRoleClient.mockReturnValue(supabase)
    getMercadoPagoClient.mockReturnValue({
      createPixPayment: jest.fn(),
      getPixPaymentStatus: jest.fn(),
    })

    const request = new NextRequest('https://example.com/api/mercadopago/create-pix-payment', {
      method: 'POST',
      body: JSON.stringify({
        planType: 'monthly',
        userId: 'another-user',
        userEmail: 'user@example.com',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('creates a PIX payment for the authenticated user', async () => {
    getCurrentUserWithProfile.mockResolvedValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1' },
    })

    const { supabase, insert } = buildSupabaseMock()
    createServiceRoleClient.mockReturnValue(supabase)

    const mpClient = {
      createPixPayment: jest.fn(async () => ({
        id: 'payment-123',
        status: 'pending',
        date_of_expiration: new Date().toISOString(),
        point_of_interaction: {
          transaction_data: {
            qr_code: 'qr_text',
            qr_code_base64: 'qr_base64',
          },
        },
      })),
      getPixPaymentStatus: jest.fn(),
    }

    getMercadoPagoClient.mockReturnValue(mpClient)

    const request = new NextRequest('https://example.com/api/mercadopago/create-pix-payment', {
      method: 'POST',
      body: JSON.stringify({
        planType: 'monthly',
        userEmail: 'user@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mpClient.createPixPayment).toHaveBeenCalled()
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        payment_intent_id: 'payment-123',
        plan_type: 'monthly',
      })
    )
    expect(data.paymentId).toBe('payment-123')
  })

  it('blocks test plan in production', async () => {
    process.env.NODE_ENV = 'production'

    getCurrentUserWithProfile.mockResolvedValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1' },
    })

    const request = new NextRequest('https://example.com/api/mercadopago/create-pix-payment', {
      method: 'POST',
      body: JSON.stringify({
        planType: 'test',
        userEmail: 'user@example.com',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('rejects unauthenticated GET requests', async () => {
    getCurrentUserWithProfile.mockResolvedValue({ user: null, profile: null })
    const request = new NextRequest('https://example.com/api/mercadopago/create-pix-payment?paymentId=123')

    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('returns 404 when payment record is not found for the user', async () => {
    getCurrentUserWithProfile.mockResolvedValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1' },
    })

    const { supabase } = buildSupabaseMock({ paymentRecord: null })
    createServiceRoleClient.mockReturnValue(supabase)

    getMercadoPagoClient.mockReturnValue({
      createPixPayment: jest.fn(),
      getPixPaymentStatus: jest.fn(),
    })

    const request = new NextRequest('https://example.com/api/mercadopago/create-pix-payment?paymentId=missing')
    const response = await GET(request)

    expect(response.status).toBe(404)
  })

  it('rejects access to payments from other users', async () => {
    getCurrentUserWithProfile.mockResolvedValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1' },
    })

    const { supabase } = buildSupabaseMock({
      paymentRecord: { user_id: 'another-user' },
    })
    createServiceRoleClient.mockReturnValue(supabase)

    getMercadoPagoClient.mockReturnValue({
      createPixPayment: jest.fn(),
      getPixPaymentStatus: jest.fn(),
    })

    const request = new NextRequest('https://example.com/api/mercadopago/create-pix-payment?paymentId=foreign')
    const response = await GET(request)

    expect(response.status).toBe(403)
  })

  it('returns PIX payment status for the owner', async () => {
    getCurrentUserWithProfile.mockResolvedValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1' },
    })

    const { supabase } = buildSupabaseMock({
      paymentRecord: { user_id: 'user-1' },
    })
    createServiceRoleClient.mockReturnValue(supabase)

    const mpClient = {
      createPixPayment: jest.fn(),
      getPixPaymentStatus: jest.fn(async () => ({
        id: 'payment-123',
        status: 'approved',
        status_detail: 'accredited',
        amount: 29.9,
        date_approved: new Date().toISOString(),
      })),
    }

    getMercadoPagoClient.mockReturnValue(mpClient)

    const request = new NextRequest('https://example.com/api/mercadopago/create-pix-payment?paymentId=payment-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mpClient.getPixPaymentStatus).toHaveBeenCalledWith('payment-123')
    expect(data.status).toBe('approved')
  })
})
