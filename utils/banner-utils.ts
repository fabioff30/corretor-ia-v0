/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param array The array to shuffle
 * @returns A new shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Formats a UTM URL with the given parameters
 * @param baseUrl The base URL
 * @param params The UTM parameters
 * @returns The formatted URL with UTM parameters
 */
export function formatUtmUrl(
  baseUrl: string,
  params: {
    source: string
    medium: string
    campaign: string
    content?: string
    term?: string
  },
): string {
  const url = new URL(baseUrl, window.location.origin)

  url.searchParams.set("utm_source", params.source)
  url.searchParams.set("utm_medium", params.medium)
  url.searchParams.set("utm_campaign", params.campaign)

  if (params.content) {
    url.searchParams.set("utm_content", params.content)
  }

  if (params.term) {
    url.searchParams.set("utm_term", params.term)
  }

  return url.pathname + url.search
}

/**
 * Tracks banner impressions in Google Tag Manager
 * @param bannerInfo Information about the banner being shown
 */
export function trackBannerImpression(bannerInfo: {
  id: string
  position: string
  content: string
  campaign: string
}): void {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "banner_impression",
      banner_id: bannerInfo.id,
      banner_position: bannerInfo.position,
      banner_content: bannerInfo.content,
      banner_campaign: bannerInfo.campaign,
    })
  }
}
