/**
 * Utility function to generate canonical URLs for the website
 */

// Define the canonical domain
export const CANONICAL_DOMAIN = "https://www.corretordetextoonline.com.br"

/**
 * Generates a canonical URL for a given path
 * @param path - The path to generate a canonical URL for
 * @returns The canonical URL
 */
export function getCanonicalUrl(path: string): string {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  // Combine the canonical domain with the path
  return `${CANONICAL_DOMAIN}${normalizedPath}`
}

/**
 * Checks if the current URL is canonical
 * @param currentUrl - The current URL
 * @returns Whether the current URL is canonical
 */
export function isCanonicalUrl(currentUrl: string): boolean {
  // Remove protocol and www if present
  const normalizeUrl = (url: string) => {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "") // Remove trailing slash
  }

  const normalizedCurrentUrl = normalizeUrl(currentUrl)
  const normalizedCanonicalDomain = normalizeUrl(CANONICAL_DOMAIN)

  return normalizedCurrentUrl.startsWith(normalizedCanonicalDomain)
}
