import { revalidatePath } from "next/cache"
import { getPosts } from "./wordpress-api"

/**
 * Utility function to update the sitemap
 * This can be called from various places to ensure the sitemap is up-to-date
 */
export async function updateSitemap(): Promise<boolean> {
  try {
    // Force revalidation of the sitemap
    revalidatePath("/sitemap.xml", "page")
    console.log("Sitemap revalidated successfully")
    return true
  } catch (error) {
    console.error("Error updating sitemap:", error)
    return false
  }
}

/**
 * Get all blog post URLs for the sitemap
 * This is used by the sitemap.ts file
 */
export async function getBlogPostUrlsForSitemap(baseUrl: string) {
  try {
    // Get up to 100 posts for the sitemap (use cache, don't force refresh)
    // The sitemap itself has a 1-hour revalidation period
    const { posts } = await getPosts(1, 100, false)

    return posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.modified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error)
    return []
  }
}

/**
 * Check if a post is already in the sitemap
 * This can be used to avoid unnecessary sitemap updates
 */
export async function isPostInSitemap(slug: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://www.corretordetextoonline.com.br"}/sitemap.xml`,
    )
    if (!response.ok) return false

    const sitemapXml = await response.text()
    return sitemapXml.includes(`/blog/${slug}</loc>`)
  } catch (error) {
    console.error("Error checking if post is in sitemap:", error)
    return false
  }
}
