/**
 * usePageviewTracking Hook
 *
 * Sends PageView events to both Meta Pixel (client-side) and Meta CAPI (server-side)
 * with deduplication support via eventID
 */

'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  canTrack,
  generateEventId,
  getMetaTrackingParams,
  captureFbclid,
  trackPixelEventWithDedup,
} from '@/utils/meta-pixel'

interface UsePageviewTrackingOptions {
  /**
   * Whether to enable tracking. Default: true
   */
  enabled?: boolean
  /**
   * Paths to exclude from tracking. Default: ['/api/', '/_next/']
   */
  excludePaths?: string[]
}

export function usePageviewTracking(options: UsePageviewTrackingOptions = {}) {
  const { enabled = true, excludePaths = ['/api/', '/_next/'] } = options
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedUrl = useRef<string>('')

  // Capturar fbclid da URL o mais cedo possível (antes do Pixel carregar)
  useEffect(() => {
    captureFbclid()
  }, [])

  useEffect(() => {
    // Skip if tracking is disabled or user hasn't consented
    if (!enabled || !canTrack()) {
      return
    }

    // Build full URL
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Skip if same URL was already tracked (prevents double tracking on re-renders)
    if (lastTrackedUrl.current === url) {
      return
    }

    // Skip excluded paths
    if (excludePaths.some(path => pathname.startsWith(path))) {
      return
    }

    // Track this URL
    lastTrackedUrl.current = url

    // Generate event ID for deduplication
    const eventId = generateEventId('PageView')

    // Track on client-side Pixel with deduplication
    trackPixelEventWithDedup('PageView', {}, eventId)

    // Get Meta tracking params (fbc from cookie OR constructed from fbclid)
    const { fbc, fbp } = getMetaTrackingParams()

    // Send to server-side CAPI (non-blocking)
    const fullUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${url}`
      : url

    fetch('/api/tracking/pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: fullUrl,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        fbc,
        fbp,
        eventId,
      }),
    }).catch(err => {
      console.error('[PageView Tracking] CAPI error:', err)
    })

    console.log('[PageView Tracking] Sent for:', url, fbc ? '(fbc: present)' : '(fbc: missing)')
  }, [pathname, searchParams, enabled, excludePaths])
}
