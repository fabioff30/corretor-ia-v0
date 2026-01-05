import { render, screen } from "@testing-library/react"
import UpgradePage from "@/app/upgrade/page"

jest.mock("@/components/providers/user-provider", () => ({
  useUser: () => ({ user: { id: "user-1", email: "user@test.com", user_metadata: {} }, profile: { plan_type: "free" } }),
}))

jest.mock("@/hooks/use-subscription", () => ({
  useSubscription: () => ({ isPremium: false, expiresAt: null }),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock("@/components/subscription-box", () => ({
  SubscriptionBox: () => <div data-testid="subscription-box">plans</div>,
}))

jest.mock("@/components/bundle/bundle-pricing-card", () => ({
  BundlePricingCard: () => <div data-testid="bundle-card">bundle</div>,
}))

jest.mock("@/components/google-analytics-wrapper", () => ({
  GoogleAnalyticsWrapper: () => null,
}))

describe("/upgrade page", () => {
  it("renders subscription options and highlight CTA", async () => {
    render(<UpgradePage searchParams={Promise.resolve({})} />)
    expect(screen.getByText(/Upgrade para CorretorIA Pro/i)).toBeInTheDocument()
    expect(screen.getByText(/Assinar CorretorIA Pro/i)).toBeInTheDocument()
  })
})
