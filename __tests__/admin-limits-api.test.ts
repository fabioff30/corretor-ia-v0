/**
 * Tests for Admin Limits API
 * /api/admin/limites
 */

import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/admin/limites/route'

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
const mockUpdate = jest.fn(() => ({
  eq: jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn(() =>
        Promise.resolve({
          data: {
            id: 'limit-1',
            plan_type: 'free',
            max_characters: 2000,
            corrections_per_day: 10,
            rewrites_per_day: 5,
            ai_analyses_per_day: 2,
            show_ads: true,
            updated_by: 'admin-user-id',
            updated_at: new Date().toISOString(),
          },
          error: null,
        })
      ),
    })),
  })),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'plan_limits_config') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: 'limit-1',
                    plan_type: 'free',
                    max_characters: 1500,
                    corrections_per_day: 5,
                    rewrites_per_day: 3,
                    ai_analyses_per_day: 1,
                    show_ads: true,
                  },
                  {
                    id: 'limit-2',
                    plan_type: 'pro',
                    max_characters: 5000,
                    corrections_per_day: -1,
                    rewrites_per_day: -1,
                    ai_analyses_per_day: -1,
                    show_ads: false,
                  },
                ],
                error: null,
              })
            ),
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: {
                    id: 'limit-1',
                    plan_type: 'free',
                    max_characters: 1500,
                    corrections_per_day: 5,
                    rewrites_per_day: 3,
                    ai_analyses_per_day: 1,
                    show_ads: true,
                  },
                  error: null,
                })
              ),
            })),
          })),
          update: mockUpdate,
          insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
        }
      }
      return {
        insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      }
    }),
  })),
}))

describe('Admin Limits API - GET', () => {
  it('returns all plan limits', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/limites')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.limits).toBeDefined()
    expect(Array.isArray(data.limits)).toBe(true)
    expect(data.limits.length).toBe(2)
  })

  it('includes both free and pro plans', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/limites')

    const response = await GET(request)
    const data = await response.json()

    const planTypes = data.limits.map((l: any) => l.plan_type)
    expect(planTypes).toContain('free')
    expect(planTypes).toContain('pro')
  })
})

describe('Admin Limits API - PATCH', () => {
  it('updates plan limits successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/limites', {
      method: 'PATCH',
      body: JSON.stringify({
        plan_type: 'free',
        max_characters: 2000,
        corrections_per_day: 10,
      }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.limits).toBeDefined()
  })

  it('validates required plan_type field', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/limites', {
      method: 'PATCH',
      body: JSON.stringify({
        max_characters: 2000,
      }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('plan_type')
  })

  it('validates that at least one field is provided for update', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/limites', {
      method: 'PATCH',
      body: JSON.stringify({
        plan_type: 'free',
      }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('No fields to update')
  })
})
