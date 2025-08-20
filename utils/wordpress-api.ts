/**
 * WordPress API utilities for fetching blog content
 */

const API_URL = "https://blog.corretordetextoonline.com.br/wp-json/wp/v2"

// Reduced revalidation time from 3600 (1 hour) to 300 (5 minutes)
const DEFAULT_REVALIDATION_TIME = 300

export interface WPPost {
  id: number
  slug: string
  title: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  content: {
    rendered: string
  }
  date: string
  modified: string
  featured_media: number
  author: number
  _embedded?: {
    author?: Array<{
      id: number
      name: string
      avatar_urls?: {
        [key: string]: string
      }
    }>
    "wp:featuredmedia"?: Array<{
      id: number
      source_url: string
      alt_text?: string
      media_details?: {
        width: number
        height: number
      }
    }>
  }
}

export interface WPAuthor {
  id: number
  name: string
  avatar_urls: {
    [key: string]: string
  }
}

export interface WPMedia {
  id: number
  source_url: string
  alt_text?: string
  media_details: {
    width: number
    height: number
  }
}

/**
 * Fetch posts from WordPress API
 * @param page Page number
 * @param perPage Posts per page
 * @param forceRefresh Whether to bypass cache and force a fresh fetch
 */
export async function getPosts(
  page = 1,
  perPage = 10,
  forceRefresh = false,
): Promise<{
  posts: WPPost[]
  totalPages: number
  totalPosts: number
}> {
  try {
    console.log(`Fetching posts: page ${page}, perPage ${perPage}, forceRefresh: ${forceRefresh}`)

    const response = await fetch(`${API_URL}/posts?_embed=author,wp:featuredmedia&page=${page}&per_page=${perPage}`, {
      next: forceRefresh ? { revalidate: 0 } : { revalidate: DEFAULT_REVALIDATION_TIME },
    })

    if (!response.ok) {
      console.error(`Failed to fetch posts: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch posts: ${response.status}`)
    }

    const posts = await response.json()
    const totalPosts = Number.parseInt(response.headers.get("X-WP-Total") || "0", 10)
    const totalPages = Number.parseInt(response.headers.get("X-WP-TotalPages") || "0", 10)

    console.log(`Fetched ${posts.length} posts. Total: ${totalPosts}, Pages: ${totalPages}`)

    return {
      posts,
      totalPages,
      totalPosts,
    }
  } catch (error) {
    console.error("Error fetching posts:", error)
    return {
      posts: [],
      totalPages: 0,
      totalPosts: 0,
    }
  }
}

/**
 * Fetch a single post by slug
 * @param slug Post slug
 * @param forceRefresh Whether to bypass cache and force a fresh fetch
 */
export async function getPostBySlug(slug: string, forceRefresh = false): Promise<WPPost | null> {
  try {
    console.log(`Fetching post by slug: ${slug}, forceRefresh: ${forceRefresh}`)

    const response = await fetch(`${API_URL}/posts?slug=${slug}&_embed=author,wp:featuredmedia`, {
      next: forceRefresh ? { revalidate: 0 } : { revalidate: DEFAULT_REVALIDATION_TIME },
    })

    if (!response.ok) {
      console.error(`Failed to fetch post: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch post: ${response.status}`)
    }

    const posts = await response.json()

    if (posts.length === 0) {
      console.log(`No post found with slug: ${slug}`)
      return null
    }

    console.log(`Successfully fetched post: ${slug}`)
    return posts[0]
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error)
    return null
  }
}

/**
 * Fetch related posts (excluding the current post)
 * @param currentSlug Current post slug to exclude
 * @param limit Maximum number of posts to fetch
 * @param forceRefresh Whether to bypass cache and force a fresh fetch
 */
export async function getRelatedPosts(currentSlug: string, limit = 4, forceRefresh = false): Promise<WPPost[]> {
  try {
    console.log(`Fetching related posts (excluding ${currentSlug}), forceRefresh: ${forceRefresh}`)

    const response = await fetch(`${API_URL}/posts?_embed=author,wp:featuredmedia&per_page=${limit}`, {
      next: forceRefresh ? { revalidate: 0 } : { revalidate: DEFAULT_REVALIDATION_TIME },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch related posts: ${response.status}`)
    }

    const posts = await response.json()
    const filteredPosts = posts.filter((post: WPPost) => post.slug !== currentSlug)

    console.log(`Fetched ${filteredPosts.length} related posts`)
    return filteredPosts
  } catch (error) {
    console.error("Error fetching related posts:", error)
    return []
  }
}

/**
 * Format WordPress date to localized date string
 */
export function formatWpDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Calculate estimated reading time for a post
 */
export function calculateReadingTime(content: string): string {
  // Strip HTML tags
  const text = content.replace(/<\/?[^>]+(>|$)/g, "")
  // Average reading speed: 200 words per minute
  const words = text.split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return `${minutes} min`
}

/**
 * Extract plain text excerpt from HTML content
 */
export function extractExcerpt(content: string, maxLength = 160): string {
  // Strip HTML tags
  const text = content.replace(/<\/?[^>]+(>|$)/g, "")
  // Truncate to maxLength
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}
