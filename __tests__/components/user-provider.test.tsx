import { render, waitFor } from "@testing-library/react"
import { useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/supabase"
import { UserProvider, useUserContext } from "@/components/providers/user-provider"

const maybeSingle = jest.fn()

const queryBuilder = {
  select: jest.fn(() => queryBuilder),
  eq: jest.fn(() => queryBuilder),
  maybeSingle,
  single: jest.fn(),
}

const unsubscribe = jest.fn()

const supabaseMock = {
  from: jest.fn(() => queryBuilder),
  auth: {
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe } },
    })),
    signOut: jest.fn(),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: "" } })),
    })),
  },
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => supabaseMock),
}))

const mockUser = {
  id: "user-123",
  email: "user@example.com",
} as unknown as User

function Observer({
  onUpdate,
}: {
  onUpdate: (state: { profile: Profile | null; error: string | null; loading: boolean }) => void
}) {
  const value = useUserContext()

  useEffect(() => {
    onUpdate({
      profile: value.profile,
      error: value.error,
      loading: value.loading,
    })
  }, [onUpdate, value.error, value.loading, value.profile])

  return null
}

const originalFetch = global.fetch

describe("UserProvider", () => {
  let setItemSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    maybeSingle.mockReset()
    queryBuilder.select.mockReset()
    queryBuilder.eq.mockReset()
    queryBuilder.select.mockImplementation(() => queryBuilder)
    queryBuilder.eq.mockImplementation(() => queryBuilder)
    supabaseMock.from.mockClear()
    supabaseMock.auth.getUser.mockReset()
    supabaseMock.auth.onAuthStateChange.mockReset()
    supabaseMock.auth.signOut.mockReset()
    ;(supabaseMock.storage.from as jest.Mock).mockClear()
    unsubscribe.mockReset()

    supabaseMock.auth.onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe } },
    }))

    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    window.localStorage.clear()
    setItemSpy = jest.spyOn(window.localStorage.__proto__, "setItem")
    setItemSpy.mockImplementation(() => void 0)
  })

  afterEach(() => {
    setItemSpy.mockRestore()
    window.localStorage.clear()
    global.fetch = originalFetch
  })

  it("cria o perfil via rota protegida quando Supabase retorna PGRST116", async () => {
    const createdProfile: Profile = {
      id: mockUser.id,
      email: mockUser.email ?? "user@example.com",
      full_name: "Usuário Teste",
      avatar_url: null,
      plan_type: "free",
      subscription_status: "inactive",
      subscription_expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    maybeSingle.mockResolvedValue({ data: createdProfile, error: null })
    maybeSingle.mockResolvedValueOnce({
      data: null,
      error: {
        code: "PGRST116",
        message: "Results contain 0 rows",
        details: null,
        hint: null,
      },
    })

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ profile: createdProfile }),
    } as unknown as Response)

    global.fetch = fetchMock as unknown as typeof fetch

    const handleUpdate = jest.fn()

    render(
      <UserProvider initialUser={mockUser}>
        <Observer onUpdate={handleUpdate} />
      </UserProvider>
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/profiles/sync",
        expect.objectContaining({ method: "POST" })
      )
    })

    await waitFor(() => {
      const lastCall = handleUpdate.mock.calls.at(-1)?.[0]
      expect(lastCall?.profile).toEqual(createdProfile)
      expect(lastCall?.error).toBeNull()
      expect(lastCall?.loading).toBe(false)
    })

    expect(setItemSpy).toHaveBeenCalledWith("user-plan-type", "free")
  })
})
