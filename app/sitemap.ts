import type { MetadataRoute } from "next"
import { getPosts } from "@/utils/wordpress-api"
import { getCanonicalUrl } from "@/lib/canonical-url"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get blog posts for sitemap
  const { posts, totalPages } = await getPosts(1, 100) // Get up to 100 posts for sitemap

  // Create sitemap entries for blog posts
  const blogPostsUrls = posts.map((post) => ({
    url: getCanonicalUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.modified),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  // Create sitemap entries for blog pagination pages
  const blogPaginationUrls = Array.from({ length: totalPages }, (_, i) => ({
    url: getCanonicalUrl(`/blog?page=${i + 1}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  // Main sitemap entries
  const mainUrls = [
    {
      url: getCanonicalUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: getCanonicalUrl("/sobre"),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: getCanonicalUrl("/recursos"),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: getCanonicalUrl("/blog"),
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: getCanonicalUrl("/contato"),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: getCanonicalUrl("/apoiar"),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: getCanonicalUrl("/termos"),
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
    {
      url: getCanonicalUrl("/privacidade"),
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
    {
      url: getCanonicalUrl("/cookies"),
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
  ]

  // Combine all sitemap entries
  return [...mainUrls, ...blogPostsUrls, ...blogPaginationUrls]
}
