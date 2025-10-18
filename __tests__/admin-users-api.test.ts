/**
 * Tests for Admin Users API
 * /api/admin/users
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/users/route'

// Mock auth helper
jest.mock('@/utils/auth-helpers', () => ({
  getCurrentUser: jest.fn(() =>
    Promise.resolve({
      id: 'admin-user-id',
      email: 'admin@example.com',
      plan_type: 'admin',
    })
  ),
}))

// Mock Supabase
const createMockQuery = () => {
  const mockQuery = {
    or: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    order: jest.fn(() => mockQuery),
    range: jest.fn(() =>
      Promise.resolve({
        data: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            full_name: 'User One',
            plan_type: 'free',
            subscription_status: 'inactive',
            created_at: new Date().toISOString(),
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            full_name: 'User Two',
            plan_type: 'pro',
            subscription_status: 'active',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
        count: 2,
      })
    ),
  }
  return mockQuery
}

const createUsageLimitsQuery = () => {
  const usageQuery = {
    eq: jest.fn(() => usageQuery),
    single: jest.fn(() =>
      Promise.resolve({
        data: {
          corrections_used: 5,
          rewrites_used: 3,
          ai_analyses_used: 1,
        },
        error: null,
      })
    ),
  }
  return usageQuery
}

const createUserCorrectionsQuery = () => {
  return {
    eq: jest.fn(() =>
      Promise.resolve({
        data: [],
        error: null,
        count: 10,
      })
    ),
  }
}

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => createMockQuery()),
        }
      }
      if (table === 'usage_limits') {
        return {
          select: jest.fn(() => createUsageLimitsQuery()),
        }
      }
      if (table === 'user_corrections') {
        return {
          select: jest.fn(() => createUserCorrectionsQuery()),
        }
      }
      return {
        select: jest.fn(() => createMockQuery()),
      }
    }),
    rpc: jest.fn(),
  })),
}))

describe('Admin Users API', () => {
  it('returns users list with pagination', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/users?page=0&limit=20')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.users).toBeDefined()
    expect(data.pagination).toBeDefined()
    expect(data.pagination.page).toBe(0)
    expect(data.pagination.limit).toBe(20)
  })

  it('handles search query parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/users?search=user1')

    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('handles plan filter parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/users?plan=pro')

    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('handles status filter parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/users?status=active')

    const response = await GET(request)

    expect(response.status).toBe(200)
  })
})
