import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPostBySlug, extractExcerpt, getPosts, getRelatedPosts } from "@/utils/wordpress-api"
import { BlogPostContent } from "@/components/blog/blog-post-content"

// ISR: revalidate every 15 minutes for fresh content while maintaining cache
export const revalidate = 900

// Pre-render top 50 posts at build time for faster indexing
export async function generateStaticParams() {
  try {
    const { posts } = await getPosts(1, 50)
    return posts.map((post) => ({
      slug: post.slug,
    }))
  } catch (error) {
    console.error("Error generating static params for blog posts:", error)
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Post não encontrado | CorretorIA",
      description: "O post que você está procurando não existe ou foi removido.",
    }
  }

  const excerpt = extractExcerpt(post.excerpt.rendered)
  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || ""
  const canonicalUrl = `https://www.corretordetextoonline.com.br/blog/${slug}`

  return {
    title: `${post.title.rendered} | CorretorIA`,
    description: excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title.rendered,
      description: excerpt,
      url: canonicalUrl,
      siteName: "CorretorIA",
      locale: "pt_BR",
      type: "article",
      images: featuredImage
        ? [
          {
            url: featuredImage,
            width: post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.width || 1200,
            height: post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.height || 630,
            alt: post.title.rendered,
          },
        ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title.rendered,
      description: excerpt,
      images: featuredImage ? [featuredImage] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Fetch post and related posts in parallel for better performance
  const [post, relatedPosts] = await Promise.all([
    getPostBySlug(slug),
    getRelatedPosts(slug, 4),
  ])

  if (!post) {
    notFound()
  }

  return <BlogPostContent post={post} relatedPosts={relatedPosts} />
}
