/**
 * API Route: Mercado Pago Config
 * GET /api/mercadopago/config
 *
 * Returns public Mercado Pago configuration for debugging
 */

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/utils/env-config'

export async function GET() {
  try {
    const config = getServerConfig()

    // Return safe, public configuration info
    return NextResponse.json({
      publicKey: config.MERCADO_PAGO_PUBLIC_KEY || null,
      isTest: config.MERCADO_PAGO_PUBLIC_KEY?.startsWith('TEST-') || false,
      hasAccessToken: !!config.MERCADO_PAGO_ACCESS_TOKEN,
      configured: !!(config.MERCADO_PAGO_PUBLIC_KEY && config.MERCADO_PAGO_ACCESS_TOKEN),
    })
  } catch (error) {
    console.error('Error getting MP config:', error)
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    )
  }
}
