/** @jest-environment @happy-dom/jest-environment */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import CorrectionsHistoryPage from "@/app/dashboard/textos/page"
import { useCorrections } from "@/hooks/use-corrections"
import { useUser } from "@/hooks/use-user"

jest.mock("@/components/dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ children }: any) => <div data-testid="layout">{children}</div>,
}))

jest.mock("@/components/dashboard/UpgradeBanner", () => ({
  UpgradeBanner: () => <div data-testid="upgrade-banner">Upgrade</div>,
}))

jest.mock("@/components/ui/tabs", () => {
  const React = require("react")
  const TabsContext = React.createContext({
    value: "all",
    onValueChange: (value: string) => {},
  })

  const Tabs = ({ value, onValueChange, children }: any) => (
    <TabsContext.Provider value={{ value, onValueChange }}>{children}</TabsContext.Provider>
  )

  const TabsList = ({ children, ...props }: any) => (
    <div role="tablist" {...props}>
      {children}
    </div>
  )

  const TabsTrigger = ({ value, children, ...props }: any) => {
    const context = React.useContext(TabsContext)
    const isActive = context.value === value

    return (
      <button
        type="button"
        role="tab"
        data-state={isActive ? "active" : "inactive"}
        aria-selected={isActive}
        onClick={() => context.onValueChange?.(value)}
        {...props}
      >
        {children}
      </button>
    )
  }

  const TabsContent = ({ value, children, ...props }: any) => {
    const context = React.useContext(TabsContext)
    if (context.value !== value) return null
    return (
      <div role="tabpanel" {...props}>
        {children}
      </div>
    )
  }

  return { Tabs, TabsList, TabsTrigger, TabsContent }
})

jest.mock("@/components/text-diff", () => ({
  TextDiff: ({ original, corrected }: { original: string; corrected: string }) => (
    <div data-testid="diff">{`${original} -> ${corrected}`}</div>
  ),
}))

jest.mock("@/components/text-evaluation", () => ({
  TextEvaluation: ({ evaluation }: { evaluation: any }) => (
    <div data-testid="evaluation">{JSON.stringify(evaluation)}</div>
  ),
}))

jest.mock("@/components/ai-detection-result", () => ({
  AIDetectionResult: ({ result }: { result: any }) => (
    <div data-testid="ai-result">{result.verdict}</div>
  ),
}))

jest.mock("@/hooks/use-corrections")
jest.mock("@/hooks/use-user")
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: jest.fn() }) }))

const useCorrectionsMock = useCorrections as jest.MockedFunction<typeof useCorrections>
const useUserMock = useUser as jest.MockedFunction<typeof useUser>

const baseCorrectionsResult = {
  corrections: [],
  loading: false,
  error: null,
  hasMore: false,
  loadMore: jest.fn(),
  deleteCorrection: jest.fn().mockResolvedValue({ error: null }),
  refresh: jest.fn(),
}

describe("CorrectionsHistoryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useUserMock.mockReturnValue({ profile: { plan_type: "pro" } } as any)
    useCorrectionsMock.mockReturnValue(baseCorrectionsResult)
  })

  it("shows upgrade prompt for free users", () => {
    useUserMock.mockReturnValue({ profile: { plan_type: "free" } } as any)

    render(<CorrectionsHistoryPage />)

    expect(screen.getByText(/Histórico exclusivo para Premium/i)).toBeInTheDocument()
    expect(screen.getByTestId("upgrade-banner")).toBeInTheDocument()
  })

  it("renders loading skeleton rows", () => {
    useCorrectionsMock.mockReturnValue({
      ...baseCorrectionsResult,
      loading: true,
      corrections: [],
    })

    render(<CorrectionsHistoryPage />)

    expect(screen.getAllByTestId("history-row-skeleton")).toHaveLength(5)
  })

  it("renders corrections data and opens details dialog", async () => {
    const now = new Date().toISOString()
    useCorrectionsMock.mockReturnValue({
      ...baseCorrectionsResult,
      corrections: [
        {
          id: "1",
          created_at: now,
          original_text: "Original",
          corrected_text: "Corrigido",
          operation_type: "correct",
          tone_style: "Formal",
          evaluation: { strengths: ["Boa"], weaknesses: [], suggestions: [], score: 10 },
          character_count: 10,
        } as any,
      ],
    })

    render(<CorrectionsHistoryPage />)

    expect(screen.getByText(/Corrigido/i)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/Ver detalhes/i))

    await waitFor(() => expect(screen.getByText(/Detalhes do texto/i)).toBeInTheDocument())
    expect(screen.getByText(/Texto original/i)).toBeInTheDocument()
    expect(screen.getByTestId("diff")).toBeInTheDocument()
  })

  it("marks the selected tab as active when clicked", () => {
    render(<CorrectionsHistoryPage />)

    const rewriteTab = screen.getByRole("tab", { name: /Reescritas/i })

    expect(rewriteTab).toHaveAttribute("data-state", "inactive")

    fireEvent.pointerDown(rewriteTab)
    fireEvent.click(rewriteTab)

    expect(rewriteTab).toHaveAttribute("data-state", "active")
  })

  it("deletes a correction after confirmation", async () => {
    const deleteSpy = jest.fn().mockResolvedValue({ error: null })
    const now = new Date().toISOString()
    useCorrectionsMock.mockReturnValue({
      ...baseCorrectionsResult,
      corrections: [
        {
          id: "delete-1",
          created_at: now,
          original_text: "Texto",
          corrected_text: "Texto corrigido",
          operation_type: "rewrite",
          tone_style: "humanized",
          evaluation: { styleApplied: "humanized", changes: [] },
          character_count: 25,
        } as any,
      ],
      deleteCorrection: deleteSpy,
    })

    render(<CorrectionsHistoryPage />)

    fireEvent.click(screen.getByLabelText(/Excluir/i))
    await waitFor(() => screen.getByText(/Remover este registro/i))
    fireEvent.click(screen.getByText(/^Remover$/))

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith("delete-1"))
  })
})
