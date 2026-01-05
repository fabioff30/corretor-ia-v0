// @ts-nocheck
import { NextRequest } from "next/server"

jest.mock("@/utils/env-config", () => ({
  __esModule: true,
  getPublicConfig: jest.fn(() => ({ APP_URL: "https://app.test" })),
  getServerConfig: jest.fn(() => ({})),
  isServer: jest.fn(() => true),
  isProduction: jest.fn(() => false),
  isDevelopment: jest.fn(() => false),
  getEnv: jest.fn(),
  getNodeEnv: jest.fn(() => "test"),
}))

const originalEnv = process.env.NODE_ENV

function buildSupabaseMock({ existingSubs = [], insertError = null } = {}) {
  const inserted = { data: null }

  const profiles = {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(async () => ({
          data: { id: "user-1", email: "user@test.com", plan_type: "free" },
          error: null,
        })),
      })),
    })),
  }

  const subscriptions = {
    data: existingSubs,
    select: jest.fn(function () {
      return this
    }),
    eq: jest.fn(function () {
      return this
    }),
    in: jest.fn(function () {
      return this
    }),
    order: jest.fn(function () {
      return this
    }),
    insert: jest.fn((payload) => ({
      select: () => ({
        single: async () => {
          inserted.data = {
            id: "sub-1",
            status: "pending",
            ...payload,
          }
          return { data: inserted.data, error: insertError }
        },
      }),
    })),
  }

  const supabase = {
    from: jest.fn((table) => {
      if (table === "profiles") return profiles
      if (table === "subscriptions") return subscriptions
      return {}
    }),
  }

  return { supabase, inserted, profiles, subscriptions }
}

describe("Mercado Pago create subscription API", () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()
    process.env.NODE_ENV = "test"
  })

  afterAll(() => {
    process.env.NODE_ENV = originalEnv
  })

  it("returns 400 when required fields are missing", async () => {
    const { supabase } = buildSupabaseMock()
    jest.doMock("@/lib/supabase/server", () => ({
      createServiceRoleClient: () => supabase,
    }))
    const createProSubscription = jest.fn()
    jest.doMock("@/lib/mercadopago/client", () => ({ createProSubscription }))
    const { POST } = require("@/app/api/mercadopago/create-subscription/route")
    const request = new NextRequest("https://example.com/api/mercadopago/create-subscription", {
      method: "POST",
      body: JSON.stringify({ userEmail: "user@test.com" }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 409 when there is a recent pending subscription", async () => {
    const { supabase } = buildSupabaseMock({
      existingSubs: [
        {
          id: "sub-old",
          status: "pending",
          mp_subscription_id: "mp-123",
          created_at: new Date().toISOString(),
        },
      ],
    })
    jest.doMock("@/lib/supabase/server", () => ({
      createServiceRoleClient: () => supabase,
    }))
    const createProSubscription = jest.fn()
    jest.doMock("@/lib/mercadopago/client", () => ({ createProSubscription }))
    const { POST } = require("@/app/api/mercadopago/create-subscription/route")
    createProSubscription.mockResolvedValue({
      id: "mp-sub-1",
      payer_id: "payer-1",
      status: "pending",
      init_point: "https://pay",
      sandbox_init_point: "https://sandbox-pay",
      auto_recurring: { start_date: new Date().toISOString(), transaction_amount: 19.9, currency_id: "BRL" },
    })

    const request = new NextRequest("https://example.com/api/mercadopago/create-subscription", {
      method: "POST",
      body: JSON.stringify({ userId: "user-1", userEmail: "user@test.com", planType: "monthly" }),
    })

    const response = await POST(request)
    expect(response.status).toBe(409)
    expect(createProSubscription).not.toHaveBeenCalled()
  })

  it("creates subscription and returns checkout URLs", async () => {
    const { supabase, inserted, subscriptions } = buildSupabaseMock()
    jest.doMock("@/lib/supabase/server", () => ({
      createServiceRoleClient: () => supabase,
    }))
    const createProSubscription = jest.fn(async () => ({
      id: "mp-sub-1",
      payer_id: "payer-1",
      status: "pending",
      init_point: "https://pay",
      sandbox_init_point: "https://sandbox-pay",
      auto_recurring: { start_date: new Date().toISOString(), transaction_amount: 29.9, currency_id: "BRL" },
    }))
    jest.doMock("@/lib/mercadopago/client", () => ({ createProSubscription }))
    const { POST } = require("@/app/api/mercadopago/create-subscription/route")

    const request = new NextRequest("https://example.com/api/mercadopago/create-subscription", {
      method: "POST",
      body: JSON.stringify({ userId: "user-1", userEmail: "user@test.com", planType: "annual" }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.subscriptionId).toBe("sub-1")
    expect(payload.checkoutUrl).toBe("https://pay")
    expect(subscriptions.insert).toHaveBeenCalled()
    expect(inserted.data?.mp_subscription_id).toBe("mp-sub-1")
  })
})
