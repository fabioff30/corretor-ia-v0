/**
 * Helper function to generate canonical URLs for the site
 * @param path - The path segment after the domain
 * @returns The full canonical URL
 */
export function getCanonicalUrl(path = ""): string {
  // Ensure path starts with a slash if not empty
  const formattedPath = path ? (path.startsWith("/") ? path : `/${path}`) : ""

  // Return the full canonical URL
  return `https://corretordetextoonline.com.br${formattedPath}`
}

/**
 * List of alternative domains that might be used to access the site
 */
export const alternativeDomains = [
  "www.corretordetextoonline.com.br",
  "corretoria.com.br",
  "www.corretoria.com.br",
  "corretor-de-texto-online.vercel.app",
]
