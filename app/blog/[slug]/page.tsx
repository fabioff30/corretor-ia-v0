import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPostBySlug, extractExcerpt } from "@/utils/wordpress-api"
import { BlogPostContent } from "@/components/blog-post-content"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return {
      title: "Post não encontrado | CorretorIA",
      description: "O post que você está procurando não existe ou foi removido.",
    }
  }

  const excerpt = extractExcerpt(post.excerpt.rendered)
  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || ""

  return {
    title: `${post.title.rendered} | CorretorIA`,
    description: excerpt,
    openGraph: {
      title: post.title.rendered,
      description: excerpt,
      url: `https://corretordetextoonline.com.br/blog/${params.slug}`,
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

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return <BlogPostContent post={post} />
}
