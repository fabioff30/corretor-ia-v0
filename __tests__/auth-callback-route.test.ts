import { GET } from "@/app/auth/callback/route"

const exchangeCodeForSessionMock = jest.fn(async () => ({
  data: { session: { access_token: "token" }, user: { id: "user-123" } },
  error: null,
}))

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
    },
  })),
}))

const createClient = require("@/lib/supabase/server").createClient as jest.Mock

describe("Auth callback route", () => {
  beforeEach(() => {
    createClient.mockClear()
    exchangeCodeForSessionMock.mockClear()
    createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: exchangeCodeForSessionMock,
      },
    })
  })

  it("redirects to a safe relative path", async () => {
    const request = new Request("https://example.com/auth/callback?code=abc&next=/dashboard")

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://example.com/dashboard")
  })

  it("prevents open redirects by falling back to premium", async () => {
    const request = new Request("https://example.com/auth/callback?code=abc&next=https://evil.com")

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://example.com/premium")
  })

  it("rejects protocol-relative redirects", async () => {
    const request = new Request("https://example.com/auth/callback?code=abc&next=//evil.com/path")

    const response = await GET(request)

    expect(response.headers.get("location")).toBe("https://example.com/premium")
  })
})
