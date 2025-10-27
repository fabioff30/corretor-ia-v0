/**
 * Tests for Mercado Pago webhook URL generation
 * Ensures no double slashes that cause HTTP 308 redirects
 */

import { MercadoPagoClient } from '@/lib/mercadopago/client'

// Mock getServerConfig
jest.mock('@/utils/env-config', () => ({
  getServerConfig: () => ({
    MERCADO_PAGO_ACCESS_TOKEN: 'test_token_123',
    MERCADO_PAGO_PUBLIC_KEY: 'test_public_key',
    MERCADO_PAGO_WEBHOOK_SECRET: 'test_webhook_secret',
  }),
  isServer: () => true,
}))

describe('MercadoPagoClient - Webhook URL Generation', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.NEXT_PUBLIC_APP_URL = originalEnv
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL
    }
  })

  it('should generate correct webhook URL without trailing slash in base URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://corretordetextoonline.com.br'

    const client = new MercadoPagoClient()
    const url = (client as any).getWebhookUrl()

    expect(url).toBe('https://corretordetextoonline.com.br/api/mercadopago/webhook')
    expect(url).not.toMatch(/\/\/api/)  // No double slash
  })

  it('should handle base URL with trailing slash', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://corretordetextoonline.com.br/'

    const client = new MercadoPagoClient()
    const url = (client as any).getWebhookUrl()

    expect(url).toBe('https://corretordetextoonline.com.br/api/mercadopago/webhook')
    expect(url).not.toMatch(/\/\/api/)  // No double slash
  })

  it('should handle base URL with multiple trailing slashes', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://corretordetextoonline.com.br///'

    const client = new MercadoPagoClient()
    const url = (client as any).getWebhookUrl()

    expect(url).toBe('https://corretordetextoonline.com.br/api/mercadopago/webhook')
    expect(url).not.toMatch(/\.com\.br\/\//)  // No double slash in path
  })

  it('should use default URL if NEXT_PUBLIC_APP_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL

    const client = new MercadoPagoClient()
    const url = (client as any).getWebhookUrl()

    expect(url).toBe('https://corretordetextoonline.com.br/api/mercadopago/webhook')
    expect(url).not.toMatch(/\/\/api/)  // No double slash
  })

  it('should generate URL in correct format for Mercado Pago', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://corretordetextoonline.com.br'

    const client = new MercadoPagoClient()
    const url = (client as any).getWebhookUrl()

    // Validate URL format
    expect(url).toMatch(/^https:\/\//)  // Starts with https://
    expect(url).toMatch(/\/api\/mercadopago\/webhook$/)  // Ends with correct path
    expect(url.split('//').length).toBe(2)  // Only one // (in https://)
  })
})
