import type { MetadataRoute } from "next"
import { getPosts } from "@/utils/wordpress-api"

export default async function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.corretordetextoonline.com.br"

  // Get blog posts for sitemap
  const { posts } = await getPosts(1, 100) // Get up to 100 posts for sitemap

  const blogPostsUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.modified),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/como-usar`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/recursos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/termos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...blogPostsUrls,
  ]
}
