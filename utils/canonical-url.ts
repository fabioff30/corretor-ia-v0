/**
 * Utility function to generate canonical URLs for the website
 */

// Define the canonical domain
export const CANONICAL_DOMAIN = "https://www.corretordetextoonline.com.br"

/**
 * Generates a canonical URL for a given path and search params
 * @param path - The path to generate a canonical URL for
 * @param searchParams - Optional search parameters to include
 * @returns The canonical URL
 */
export function getCanonicalUrl(path: string, searchParams?: URLSearchParams | Record<string, string>): string {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  // Handle search params
  let queryString = ""

  if (searchParams) {
    if (searchParams instanceof URLSearchParams) {
      queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
    } else {
      const params = new URLSearchParams()
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      queryString = params.toString() ? `?${params.toString()}` : ""
    }
  }

  // Combine the canonical domain with the path and query string
  return `${CANONICAL_DOMAIN}${normalizedPath}${queryString}`
}
