/**
 * Tests for Dashboard Settings Page
 * /dashboard/configuracoes
 */

import { render, screen, waitFor } from '@testing-library/react'
import DashboardSettingsPage from '@/app/dashboard/configuracoes/page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard/configuracoes'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock dependencies
jest.mock('@/hooks/use-user', () => ({
  useUser: jest.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: {
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
      plan_type: 'pro',
      subscription_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    loading: false,
    error: null,
    updateProfile: jest.fn(),
    uploadAvatar: jest.fn(),
    signOut: jest.fn(),
    isAuthenticated: true,
    isPro: true,
    isAdmin: false,
    isFree: false,
  })),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          in: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          })),
        })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  })),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('Dashboard Settings Page', () => {
  it('renders settings tabs', async () => {
    render(<DashboardSettingsPage />)

    // Check for tab triggers by their role and value
    const profileTab = screen.getByRole('tab', { name: /perfil/i })
    const avatarTab = screen.getByRole('tab', { name: /avatar/i })
    const securityTab = screen.getByRole('tab', { name: /segurança/i })
    const subscriptionTab = screen.getByRole('tab', { name: /assinatura/i })

    expect(profileTab).toBeInTheDocument()
    expect(avatarTab).toBeInTheDocument()
    expect(securityTab).toBeInTheDocument()
    expect(subscriptionTab).toBeInTheDocument()
  })

  it('renders profile edit form by default', async () => {
    render(<DashboardSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
  })

  it('shows correct page title', () => {
    render(<DashboardSettingsPage />)

    // Use heading role to get the page title specifically (not sidebar nav)
    expect(screen.getByRole('heading', { name: /configurações/i })).toBeInTheDocument()
    expect(screen.getByText(/gerencie suas preferências/i)).toBeInTheDocument()
  })

  it('renders default tab content (profile)', async () => {
    render(<DashboardSettingsPage />)

    // Profile tab content should be visible by default
    expect(screen.getByText('Informações do Perfil')).toBeInTheDocument()
    expect(screen.getByText(/atualize suas informações pessoais/i)).toBeInTheDocument()
  })
})
