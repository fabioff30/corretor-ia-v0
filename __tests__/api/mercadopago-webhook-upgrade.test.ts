// @ts-nocheck
import { NextRequest } from "next/server"

jest.mock("@/lib/mercadopago/webhook-validator", () => ({
  validateWebhookSignature: jest.fn().mockReturnValue({ isValid: true }),
  parseWebhookPayload: jest.fn((body) => ({
    type: "payment",
    action: "payment.updated",
    id: body.data?.id || "payment-1",
  })),
  sanitizeWebhookData: jest.fn((data) => data),
}))

jest.mock("@/lib/mercadopago/client", () => ({
  getMercadoPagoClient: jest.fn(),
}))

jest.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: jest.fn(),
}))

jest.mock("@/utils/env-config", () => ({
  getPublicConfig: jest.fn(() => ({ APP_URL: "https://app.test" })),
}))

jest.mock("@/lib/email/send", () => ({
  sendPaymentApprovedEmail: jest.fn().mockResolvedValue(undefined),
}))

const { getMercadoPagoClient } = require("@/lib/mercadopago/client")
const { createServiceRoleClient } = require("@/lib/supabase/server")
const { sendPaymentApprovedEmail } = require("@/lib/email/send")

const originalEnv = process.env.NODE_ENV

function createSupabaseMock() {
  const profileUpdates: any[] = []
  const subscriptionInserts: any[] = []
  const pixUpdates: any[] = []
  const consumeUpdates: any[] = []

  const pixPaymentRecord = {
    user_id: "user-123",
    email: "buyer@test.com",
    plan_type: "monthly",
    paid_at: new Date().toISOString(),
  }

  const pixPaymentsTable = {
    update: jest.fn((data) => {
      pixUpdates.push(data)
      return pixPaymentsTable
    }),
    eq: jest.fn(() => pixPaymentsTable),
    select: jest.fn(() => pixPaymentsTable),
    maybeSingle: jest.fn(async () => ({ data: pixPaymentRecord, error: null })),
  }

  const subscriptionsTable = {
    select: jest.fn(() => subscriptionsTable),
    eq: jest.fn(() => subscriptionsTable),
    in: jest.fn(() => subscriptionsTable),
    maybeSingle: jest.fn(async () => ({ data: null, error: null })),
    order: jest.fn(() => subscriptionsTable),
    insert: jest.fn((data) => {
      subscriptionInserts.push(data)
      return {
        select: () => ({
          single: async () => ({ data: { id: "sub-123", ...data }, error: null }),
        }),
      }
    }),
  }

  const profilesTable = {
    update: jest.fn((data) => {
      profileUpdates.push(data)
      return profilesTable
    }),
    eq: jest.fn(() => profilesTable),
    select: jest.fn(() => profilesTable),
    maybeSingle: jest.fn(async () => ({ data: { email: "buyer@test.com", full_name: "Buyer" }, error: null })),
  }

  const supabase = {
    from: jest.fn((table) => {
      if (table === "pix_payments") return pixPaymentsTable
      if (table === "subscriptions") return subscriptionsTable
      if (table === "profiles") return profilesTable
      return {}
    }),
    rpc: jest.fn(async () => ({ error: null })),
  }

  return { supabase, profileUpdates, subscriptionInserts, pixUpdates, consumeUpdates }
}

describe("Mercado Pago webhook - upgrade flow", () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.NODE_ENV = "test"
  })

  afterAll(() => {
    process.env.NODE_ENV = originalEnv
  })

  it("upgrades user to pro and creates subscription on approved PIX payment", async () => {
    const { POST } = require("@/app/api/mercadopago/webhook/route")
    const { supabase, profileUpdates, subscriptionInserts } = createSupabaseMock()
    createServiceRoleClient.mockReturnValue(supabase)

    const mpClient = {
      getPayment: jest.fn(async () => ({
        id: "pay-1",
        status: "approved",
        payment_method_id: "pix",
        transaction_amount: 29.9,
        currency_id: "BRL",
        date_approved: new Date().toISOString(),
        payer: { id: "payer-1", email: "buyer@test.com" },
        external_reference: "user-123",
      })),
    }
    getMercadoPagoClient.mockReturnValue(mpClient)

    const request = new NextRequest("http://localhost:3000/api/mercadopago/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-signature": "sig",
        "x-request-id": "req-1",
      },
      body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    // profile was upgraded
    expect(profileUpdates.some((u) => u.plan_type === "pro")).toBe(true)
    // subscription created
    expect(subscriptionInserts.length).toBe(1)
    expect(subscriptionInserts[0].payment_method_id).toBe("pix")
    // confirmation email attempted
    expect(sendPaymentApprovedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: expect.objectContaining({ email: "buyer@test.com" }) })
    )
  })
})
