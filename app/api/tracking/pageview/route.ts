/**
 * API Route: PageView Tracking via Meta CAPI
 * POST /api/tracking/pageview
 *
 * Server-side PageView event for Meta Conversions API
 * Called from client-side after consent is verified
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface PageViewRequest {
  url: string
  referrer?: string
  fbc?: string | null
  fbp?: string | null
  eventId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PageViewRequest = await request.json()
    const { url, referrer, fbc, fbp, eventId } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Get client info from request
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip
    const clientUserAgent = request.headers.get('user-agent')

    // Import and send PageView event
    const { sendPageViewEvent } = await import('@/lib/meta-capi')

    const result = await sendPageViewEvent({
      eventId: eventId || `pageview_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      eventSourceUrl: url,
      referrer: referrer || undefined,
      userData: {
        clientIp: clientIp || undefined,
        clientUserAgent: clientUserAgent || undefined,
        fbc: fbc || undefined,
        fbp: fbp || undefined,
      },
    })

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      console.error('[CAPI PageView] Error:', result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[CAPI PageView] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'OK' })
}
