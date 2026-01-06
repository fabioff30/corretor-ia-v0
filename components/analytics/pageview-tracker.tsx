/**
 * PageviewTracker Component
 *
 * Tracks page views via Meta Pixel (client-side) and Meta CAPI (server-side)
 * with deduplication support.
 *
 * Add this component to your app layout to enable automatic pageview tracking.
 */

'use client'

import { usePageviewTracking } from '@/hooks/use-pageview-tracking'

interface PageviewTrackerProps {
  /**
   * Whether to enable tracking. Default: true
   */
  enabled?: boolean
}

export function PageviewTracker({ enabled = true }: PageviewTrackerProps) {
  usePageviewTracking({ enabled })

  // This component doesn't render anything
  return null
}
