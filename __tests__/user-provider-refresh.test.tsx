/**
 * Tests for UserProvider refreshProfile() function
 * Tests the new refresh functionality that forces profile update from database
 */

import { render, waitFor, act } from '@testing-library/react'
import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/supabase'
import { UserProvider, useUserContext } from '@/components/providers/user-provider'

type SupabaseMockStore = {
  supabase?: any
  createClient?: jest.Mock
  maybeSingle?: jest.Mock
  queryBuilder?: {
    select: jest.Mock
    eq: jest.Mock
    maybeSingle: jest.Mock
  }
  unsubscribe?: jest.Mock
}

let supabaseMockStore: SupabaseMockStore

jest.mock('@/lib/supabase/client', () => {
  const maybeSingle = jest.fn()
  const unsubscribe = jest.fn()

  const queryBuilder = {
    select: jest.fn(() => queryBuilder),
    eq: jest.fn(() => queryBuilder),
    maybeSingle,
  }

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
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: '' } })),
      })),
    },
  }

  const createClientMock = jest.fn(() => supabaseMock)

  supabaseMockStore = {
    supabase: supabaseMock,
    createClient: createClientMock,
    maybeSingle,
    queryBuilder,
    unsubscribe,
  }

  return {
    supabase: supabaseMock,
    createClient: createClientMock,
  }
})

const getSupabaseMock = () => {
  if (!supabaseMockStore.supabase) {
    throw new Error('Supabase mock not initialized')
  }
  return supabaseMockStore.supabase
}

const getMaybeSingle = () => {
  if (!supabaseMockStore.maybeSingle) {
    throw new Error('maybeSingle mock not initialized')
  }
  return supabaseMockStore.maybeSingle
}

const getQueryBuilder = () => {
  if (!supabaseMockStore.queryBuilder) {
    throw new Error('Query builder mock not initialized')
  }
  return supabaseMockStore.queryBuilder
}

const getUnsubscribe = () => {
  if (!supabaseMockStore.unsubscribe) {
    throw new Error('unsubscribe mock not initialized')
  }
  return supabaseMockStore.unsubscribe
}

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
} as unknown as User

const mockProfileFree: Profile = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  plan_type: 'free',
  subscription_status: 'inactive',
  subscription_expires_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockProfilePro: Profile = {
  ...mockProfileFree,
  plan_type: 'pro',
  subscription_status: 'active',
}

function TestComponent({
  onRefreshClick,
}: {
  onRefreshClick: (refreshFn: () => Promise<{ data: Profile | null; error: string | null }>) => void
}) {
  const { refreshProfile, profile } = useUserContext()

  useEffect(() => {
    onRefreshClick(refreshProfile)
  }, [refreshProfile, onRefreshClick])

  return <div data-testid="profile-plan">{profile?.plan_type}</div>
}

describe('UserProvider - refreshProfile()', () => {
  let setItemSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    const supabaseMock = getSupabaseMock()
    const queryBuilder = getQueryBuilder()
    const maybeSingle = getMaybeSingle()
    const unsubscribe = getUnsubscribe()

    maybeSingle.mockReset()
    queryBuilder.select.mockReset()
    queryBuilder.eq.mockReset()
    queryBuilder.select.mockImplementation(() => queryBuilder)
    queryBuilder.eq.mockImplementation(() => queryBuilder)
    supabaseMock.from.mockClear()
    supabaseMock.auth.getUser.mockReset()
    supabaseMock.auth.onAuthStateChange.mockReset()
    unsubscribe.mockReset()

    supabaseMock.auth.onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe } },
    }))

    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    window.localStorage.clear()
    setItemSpy = jest.spyOn(window.localStorage.__proto__, 'setItem')
    setItemSpy.mockImplementation(() => void 0)
  })

  afterEach(() => {
    setItemSpy.mockRestore()
    window.localStorage.clear()
  })

  it('should refresh profile from database and update state', async () => {
    // Start with FREE profile
    const maybeSingle = getMaybeSingle()
    maybeSingle.mockResolvedValue({ data: mockProfileFree, error: null })

    let refreshFn: (() => Promise<{ data: Profile | null; error: string | null }>) | null = null

    const { getByTestId, rerender } = render(
      <UserProvider initialUser={mockUser} initialProfile={mockProfileFree}>
        <TestComponent
          onRefreshClick={(fn) => {
            refreshFn = fn
          }}
        />
      </UserProvider>
    )

    // Initial state should be FREE
    expect(getByTestId('profile-plan').textContent).toBe('free')

    // Simulate profile upgrade to PRO in database
    maybeSingle.mockResolvedValue({ data: mockProfilePro, error: null })

    // Call refreshProfile
    let result: { data: Profile | null; error: string | null } | null = null

    await act(async () => {
      if (refreshFn) {
        result = await refreshFn()
      }
    })

    // Should return updated profile
    expect(result?.data).toEqual(mockProfilePro)
    expect(result?.error).toBeNull()

    // Should update localStorage
    expect(setItemSpy).toHaveBeenCalledWith('user-plan-type', 'pro')

    // Re-render to see updated state
    rerender(
      <UserProvider initialUser={mockUser} initialProfile={mockProfilePro}>
        <TestComponent
          onRefreshClick={(fn) => {
            refreshFn = fn
          }}
        />
      </UserProvider>
    )

    await waitFor(() => {
      expect(getByTestId('profile-plan').textContent).toBe('pro')
    })
  })

  it('should return error if user is not authenticated', async () => {
    // No user
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    let refreshFn: (() => Promise<{ data: Profile | null; error: string | null }>) | null = null

    render(
      <UserProvider initialUser={null}>
        <TestComponent
          onRefreshClick={(fn) => {
            refreshFn = fn
          }}
        />
      </UserProvider>
    )

    let result: { data: Profile | null; error: string | null } | null = null

    await act(async () => {
      if (refreshFn) {
        result = await refreshFn()
      }
    })

    expect(result?.data).toBeNull()
    expect(result?.error).toBe('Usuário não autenticado')
  })

  it('should handle errors from fetchProfile', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'DB_ERROR' },
    })

    let refreshFn: (() => Promise<{ data: Profile | null; error: string | null }>) | null = null

    render(
      <UserProvider initialUser={mockUser} initialProfile={mockProfileFree}>
        <TestComponent
          onRefreshClick={(fn) => {
            refreshFn = fn
          }}
        />
      </UserProvider>
    )

    let result: { data: Profile | null; error: string | null } | null = null

    await act(async () => {
      if (refreshFn) {
        result = await refreshFn()
      }
    })

    expect(result?.data).toBeNull()
    expect(result?.error).toBe('Erro ao atualizar perfil')
  })

  it('should create profile via /api/profiles/sync if PGRST116 error', async () => {
    // First call returns PGRST116 (profile not found)
    maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'Results contain 0 rows' },
    })

    // Mock fetch for /api/profiles/sync
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ profile: mockProfileFree }),
    } as unknown as Response)

    global.fetch = fetchMock as unknown as typeof fetch

    // Second call after creation returns the profile
    maybeSingle.mockResolvedValueOnce({ data: mockProfileFree, error: null })

    let refreshFn: (() => Promise<{ data: Profile | null; error: string | null }>) | null = null

    render(
      <UserProvider initialUser={mockUser}>
        <TestComponent
          onRefreshClick={(fn) => {
            refreshFn = fn
          }}
        />
      </UserProvider>
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/profiles/sync',
        expect.objectContaining({ method: 'POST' })
      )
    })

    let result: { data: Profile | null; error: string | null } | null = null

    await act(async () => {
      if (refreshFn) {
        result = await refreshFn()
      }
    })

    // Should successfully create and return profile
    expect(result?.data).toEqual(mockProfileFree)
    expect(result?.error).toBeNull()
  })

  it('should log refresh operations for debugging', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    maybeSingle.mockResolvedValue({ data: mockProfilePro, error: null })

    let refreshFn: (() => Promise<{ data: Profile | null; error: string | null }>) | null = null

    render(
      <UserProvider initialUser={mockUser} initialProfile={mockProfileFree}>
        <TestComponent
          onRefreshClick={(fn) => {
            refreshFn = fn
          }}
        />
      </UserProvider>
    )

    await act(async () => {
      if (refreshFn) {
        await refreshFn()
      }
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      '[UserProvider] Refreshing profile from database...'
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      '[UserProvider] Profile refreshed successfully:',
      expect.objectContaining({
        planType: 'pro',
        subscriptionStatus: 'active',
      })
    )

    consoleSpy.mockRestore()
  })
})
