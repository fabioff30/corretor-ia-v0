/** @jest-environment node */
// Mock Redis utilities to avoid ESM issues from @upstash/redis in Jest
jest.mock("@/utils/redis-client", () => ({
  getRedisClient: () => null,
  isRedisAvailable: () => false,
  setRedisAvailable: () => {},
}))

jest.mock("@/lib/api/webhook-client", () => ({
  callWebhook: jest.fn(),
}))

jest.mock("@/lib/api/daily-rate-limit", () => ({
  dailyRateLimiter: jest.fn().mockResolvedValue(null),
}))

import { POST as correctPOST } from "@/app/api/correct/route"
import { POST as rewritePOST } from "@/app/api/rewrite/route"
import { POST as customTonePOST } from "@/app/api/custom-tone-webhook/route"
import { callWebhook } from "@/lib/api/webhook-client"

const withNextUrl = (request: Request) => {
  ;(request as any).nextUrl = new URL(request.url)
  return request
}

describe("API endpoints smoke tests", () => {
  const mockFetch = jest.fn()

  beforeAll(() => {
    ;(global as any).fetch = mockFetch
  })

  beforeEach(() => {
    jest.resetAllMocks()
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
  })

  it("/api/correct returns correctedText (default)", async () => {
    ;(callWebhook as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          correctedText: "Texto corrigido",
          evaluation: { strengths: [], weaknesses: [], suggestions: [], score: 8 },
        }),
        { status: 200 },
      ),
    )

    const req = withNextUrl(
      new Request("http://test.local/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Ola, eu quero corrigi esse texo.", isMobile: false }),
      }),
    )
    const res = await correctPOST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.correctedText).toBe("Texto corrigido")
  })

  it("/api/correct returns correctedText with tone=Formal", async () => {
    ;(callWebhook as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          correctedText: "Texto corrigido formal",
          evaluation: { strengths: [], weaknesses: [], suggestions: [], score: 9 },
        }),
        { status: 200 },
      ),
    )

    const req = withNextUrl(
      new Request("http://test.local/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Por favor ajuste o tom deste paragrafo.", isMobile: false, tone: "Formal" }),
      }),
    )
    const res = await correctPOST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.correctedText).toBe("Texto corrigido formal")
  })

  it("/api/rewrite returns rewrittenText (style provided)", async () => {
    ;(callWebhook as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          rewrittenText: "Texto reescrito",
          evaluation: { strengths: [], weaknesses: [], suggestions: [], score: 9 },
        }),
        { status: 200 },
      ),
    )

    const req = withNextUrl(
      new Request("http://test.local/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // NOTE: validateInput expects `style`, not `rewriteStyle`
        body: JSON.stringify({ text: "Transforme para estilo natural e humano.", isMobile: false, style: "humanizado" }),
      }),
    )
    const res = await rewritePOST(req as any)
    // rewrite route should succeed (fallbacks internally on webhook failure)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.rewrittenText).toBe("Texto reescrito")
  })

  it("/api/custom-tone-webhook accepts customTone", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )

    const req = withNextUrl(
      new Request("http://test.local/api/custom-tone-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customTone: "Tom motivacional, amigavel e conciso." }),
      }),
    )
    const res = await customTonePOST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("success", true)
  })
})
/** @jest-environment node */
