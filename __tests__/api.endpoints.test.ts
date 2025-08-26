/** @jest-environment node */
// Mock Redis utilities to avoid ESM issues from @upstash/redis in Jest
jest.mock("@/utils/redis-client", () => ({
  getRedisClient: () => null,
  isRedisAvailable: () => false,
  setRedisAvailable: () => {},
}))

import { POST as correctPOST } from "@/app/api/correct/route"
import { POST as rewritePOST } from "@/app/api/rewrite/route"
import { POST as customTonePOST } from "@/app/api/custom-tone-webhook/route"

describe("API endpoints smoke tests", () => {
  it("/api/correct returns correctedText (default)", async () => {
    const req = new Request("http://test.local/api/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Ola, eu quero corrigi esse texo.", isMobile: false }),
    })
    const res = await correctPOST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(typeof data.correctedText).toBe("string")
  })

  it("/api/correct returns correctedText with tone=Formal", async () => {
    const req = new Request("http://test.local/api/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Por favor ajuste o tom deste paragrafo.", isMobile: false, tone: "Formal" }),
    })
    const res = await correctPOST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(typeof data.correctedText).toBe("string")
  })

  it("/api/rewrite returns rewrittenText (style provided)", async () => {
    const req = new Request("http://test.local/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // NOTE: validateInput expects `style`, not `rewriteStyle`
      body: JSON.stringify({ text: "Transforme para estilo natural e humano.", isMobile: false, style: "humanizado" }),
    })
    const res = await rewritePOST(req as any)
    // rewrite route should succeed (fallbacks internally on webhook failure)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(typeof data.rewrittenText).toBe("string")
  })

  it("/api/custom-tone-webhook accepts customTone", async () => {
    const req = new Request("http://test.local/api/custom-tone-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customTone: "Tom motivacional, amigavel e conciso." }),
    })
    const res = await customTonePOST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("success")
  })
})
/** @jest-environment node */
