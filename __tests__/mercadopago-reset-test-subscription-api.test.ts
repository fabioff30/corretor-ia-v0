import { NextRequest } from "next/server"
import { GET, DELETE } from "@/app/api/mercadopago/reset-test-subscription/route"

jest.mock("@/utils/auth-helpers", () => ({
  getCurrentUserWithProfile: jest.fn(),
}))

jest.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: jest.fn(),
}))

const { getCurrentUserWithProfile } = require("@/utils/auth-helpers") as {
  getCurrentUserWithProfile: jest.Mock
}

const { createServiceRoleClient } = require("@/lib/supabase/server") as {
  createServiceRoleClient: jest.Mock
}

const originalNodeEnv = process.env.NODE_ENV

function setAdminUser() {
  getCurrentUserWithProfile.mockResolvedValue({
    user: { id: "admin-user" },
    profile: { id: "admin-user", plan_type: "admin" },
  })
}

function setUnauthorizedUser() {
  getCurrentUserWithProfile.mockResolvedValue({ user: null, profile: null })
}

function mockSupabaseForGet() {
  const mockSubscriptionsSelect = jest.fn(() => ({
    eq: jest.fn(async () => ({ data: [{ id: "sub-1" }], error: null })),
  }))

  const mockProfilesSelect = jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn(async () => ({
        data: {
          id: "user-1",
          email: "user@example.com",
          plan_type: "free",
          subscription_status: "inactive",
        },
        error: null,
      })),
    })),
  }))

  createServiceRoleClient.mockReturnValue({
    from: jest.fn((table: string) => {
      if (table === "subscriptions") {
        return { select: mockSubscriptionsSelect }
      }
      if (table === "profiles") {
        return { select: mockProfilesSelect }
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(async () => ({ data: [], error: null })),
        })),
      }
    }),
  })
}

function mockSupabaseForDelete() {
  const subscriptionsDelete = jest.fn(() => ({
    eq: jest.fn(() => ({
      select: jest.fn(async () => ({ data: [{ id: "sub-1" }], error: null })),
    })),
  }))

  const transactionsDelete = jest.fn(() => ({
    eq: jest.fn(() => ({
      select: jest.fn(async () => ({ data: [], error: null })),
    })),
  }))

  const profileUpdate = jest.fn(() => ({
    eq: jest.fn(async () => ({ error: null })),
  }))

  createServiceRoleClient.mockReturnValue({
    from: jest.fn((table: string) => {
      if (table === "subscriptions") {
        return {
          delete: subscriptionsDelete,
          select: jest.fn(() => ({
            eq: jest.fn(async () => ({ data: [], error: null })),
          })),
        }
      }
      if (table === "payment_transactions") {
        return { delete: transactionsDelete }
      }
      if (table === "profiles") {
        return { update: profileUpdate }
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(async () => ({ data: [], error: null })),
        })),
      }
    }),
  })

  return { subscriptionsDelete, transactionsDelete, profileUpdate }
}

describe("Mercado Pago reset test subscription API", () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.NODE_ENV = "test"
  })

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it("returns 403 in production", async () => {
    process.env.NODE_ENV = "production"
    setAdminUser()
    mockSupabaseForGet()

    const request = new NextRequest("https://example.com/api/mercadopago/reset-test-subscription?userId=123")
    const response = await GET(request)

    expect(response.status).toBe(403)
  })

  it("rejects unauthorized users", async () => {
    setUnauthorizedUser()
    mockSupabaseForGet()

    const request = new NextRequest("https://example.com/api/mercadopago/reset-test-subscription?userId=123")
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it("returns subscription data for admins", async () => {
    setAdminUser()
    mockSupabaseForGet()

    const request = new NextRequest("https://example.com/api/mercadopago/reset-test-subscription?userId=123")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.profile).toBeDefined()
    expect(data.subscriptions).toHaveLength(1)
  })

  it("deletes subscriptions for admins", async () => {
    setAdminUser()
    const { subscriptionsDelete, transactionsDelete, profileUpdate } = mockSupabaseForDelete()

    const request = new NextRequest("https://example.com/api/mercadopago/reset-test-subscription?userId=123", {
      method: "DELETE",
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(subscriptionsDelete).toHaveBeenCalled()
    expect(transactionsDelete).toHaveBeenCalled()
    expect(profileUpdate).toHaveBeenCalled()
  })
})
