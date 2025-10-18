/** @jest-environment node */

jest.mock("@/lib/api/webhook-client", () => ({
  callWebhook: jest.fn(),
}))

jest.mock("@/utils/auth-helpers", () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock("@/utils/limit-checker", () => ({
  saveCorrection: jest.fn(),
}))

jest.mock("@/lib/api/daily-rate-limit", () => ({
  dailyRateLimiter: jest.fn().mockResolvedValue(null),
}))

import { POST as correctPOST } from "@/app/api/correct/route"
import { POST as rewritePOST } from "@/app/api/rewrite/route"
import { POST as detectorPOST } from "@/app/api/ai-detector/route"
import { callWebhook } from "@/lib/api/webhook-client"
import { getCurrentUser } from "@/utils/auth-helpers"
import { saveCorrection } from "@/utils/limit-checker"

const withNextUrl = (request: Request) => {
  ;(request as any).nextUrl = new URL(request.url)
  return request
}

describe("Premium API history integration", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("saves premium correction and returns id", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-1" })
    ;(saveCorrection as jest.Mock).mockResolvedValue({ success: true, id: "corr-123" })
    ;(callWebhook as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          correctedText: "Texto corrigido",
          evaluation: {
            strengths: ["Força"],
            weaknesses: [],
            suggestions: [],
            score: 9,
          },
        }),
        { status: 200 },
      ),
    )

    const request = withNextUrl(new Request("http://localhost/api/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Texto original", isPremium: true, tone: "Padrão" }),
    }))

    const response = await correctPOST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.correctionId).toBe("corr-123")
    expect(saveCorrection).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        operationType: "correct",
        correctedText: "Texto corrigido",
      }),
    )
  })

  it("rejects premium correction without authenticated user", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue(null)
    ;(callWebhook as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          correctedText: "Texto corrigido",
          evaluation: {
            strengths: [],
            weaknesses: [],
            suggestions: [],
            score: 8,
          },
        }),
      ),
    )

    const request = withNextUrl(new Request("http://localhost/api/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Teste", isPremium: true }),
    }))

    const response = await correctPOST(request as any)
    expect(response.status).toBe(401)
    expect(saveCorrection).not.toHaveBeenCalled()
  })

  it("returns correctionId for premium rewrite", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-2" })
    ;(saveCorrection as jest.Mock).mockResolvedValue({ success: true, id: "rewrite-1" })
    ;(callWebhook as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          rewrittenText: "Texto reescrito",
          evaluation: {
            strengths: ["Clareza"],
            weaknesses: [],
            suggestions: [],
            score: 9,
          },
        }),
        { status: 200 },
      ),
    )

    const request = withNextUrl(new Request("http://localhost/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Texto de origem", style: "humanized", isPremium: true }),
    }))

    const response = await rewritePOST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.correctionId).toBe("rewrite-1")
    expect(saveCorrection).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: "rewrite",
        toneStyle: "humanized",
      }),
    )
  })

  it("persists AI detector analysis for premium users", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-3" })
    ;(saveCorrection as jest.Mock).mockResolvedValue({ success: true, id: "analysis-42" })
    ;(callWebhook as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          result: {
            verdict: "ai",
            probability: 0.87,
            confidence: "high",
            signals: ["pattern"],
          },
          textStats: {
            words: 100,
            characters: 500,
            sentences: 5,
          },
        }),
        { status: 200 },
      ),
    )

    const request = withNextUrl(new Request("http://localhost/api/ai-detector", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "conteúdo analisado", isPremium: true }),
    }))

    const response = await detectorPOST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.correctionId).toBe("analysis-42")
    expect(saveCorrection).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: "ai_analysis",
        userId: "user-3",
      }),
    )
  })
})
