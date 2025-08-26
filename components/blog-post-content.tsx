import Link from "next/link"
import { CalendarIcon, Clock, User } from "lucide-react"
import { BackgroundGradient } from "@/components/background-gradient"
import { SharePost } from "@/components/share-post"
import { RelatedPosts } from "@/components/related-posts"
import { TableOfContents } from "@/components/table-of-contents"
import { type WPPost, formatWpDate, calculateReadingTime, getRelatedPosts } from "@/utils/wordpress-api"
import { Suspense } from "react"
import { SupportButton } from "@/components/support-button"
import { createSafeHtml } from "@/utils/html-sanitizer"
import { AdminRefreshButton } from "@/components/admin-refresh-button"

interface BlogPostContentProps {
  post: WPPost
}

export async function BlogPostContent({ post }: BlogPostContentProps) {
  // Get featured image URL if available
  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "/placeholder.svg"

  // Get formatted date
  const formattedDate = formatWpDate(post.date)

  // Calculate reading time
  const readTime = calculateReadingTime(post.content.rendered)

  // Get author name
  const authorName = post._embedded?.author?.[0]?.name || "Autor"

  // Get author avatar
  const authorAvatar = post._embedded?.author?.[0]?.avatar_urls?.["96"] || ""

  // Fetch related posts
  const relatedPosts = await getRelatedPosts(post.slug)

  // Process content to fix any styling issues
  const processedContent = processWordPressContent(post.content.rendered)

  return (
    <>
      <BackgroundGradient />
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link href="/blog" className="text-primary hover:underline inline-block">
              ← Voltar para o blog
            </Link>
            <AdminRefreshButton slug={post.slug} />
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            dangerouslySetInnerHTML={createSafeHtml(post.title.rendered, 'STRICT')}
          />

          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70 mb-6">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{readTime} de leitura</span>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>Por {authorName}</span>
            </div>
          </div>

          {featuredImage && (
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
              <img
                src={featuredImage || "/placeholder.svg"}
                alt={post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text || post.title.rendered}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <SharePost title={post.title.rendered} slug={post.slug} />

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 mt-[15px]">
            <h3 className="font-bold text-lg text-primary mb-2">Precisa corrigir seu texto?</h3>
            <p className="mb-3">
              Use nosso corretor de texto online gratuito para corrigir erros gramaticais, ortográficos e de estilo em
              português.
            </p>
            <Link
              href="/"
              className="bg-primary text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-primary/90 transition-colors"
            >
              Corrigir meu texto agora
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_250px] gap-8">
          <div>
            <div
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={createSafeHtml(processedContent, 'BLOG')}
            />


            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-lg p-6 my-8">
              <h3 className="font-bold text-xl mb-3">Gostou deste conteúdo?</h3>
              <p className="mb-4">
                Experimente nosso corretor de texto inteligente para garantir que seus textos estejam sempre perfeitos.
                Correção gramatical, ortográfica e de estilo em português, tudo em um só lugar!
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/"
                  className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  Experimentar o corretor grátis
                </Link>
                <SupportButton />
              </div>
            </div>

            <SharePost title={post.title.rendered} slug={post.slug} className="mt-8" />

            <Suspense fallback={<div className="mt-12 pt-8 border-t">Carregando posts relacionados...</div>}>
              {relatedPosts.length > 0 && (
                <RelatedPosts
                  posts={relatedPosts.map((p) => ({
                    title: p.title.rendered,
                    slug: p.slug,
                    excerpt: "", // Removing the excerpt
                  }))}
                  currentSlug={post.slug}
                />
              )}
            </Suspense>
          </div>

          <aside className="space-y-8">
            <TableOfContents content={post.content.rendered} />
          </aside>
        </div>
      </article>
    </>
  )
}

function extractExcerpt(html: string, maxLength = 160): string {
  // Strip HTML tags
  const text = html.replace(/<\/?[^>]+(>|$)/g, "")
  // Truncate to maxLength
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}

// Function to process WordPress content and fix styling issues
function processWordPressContent(content: string): string {
  // Add IDs to headings for better anchor linking if they don't have IDs
  let processedContent = content.replace(/<(h[1-6])(?![^>]*\bid=["'])[^>]*>(.*?)<\/\1>/gi, (match, tag, text) => {
    const id = text
      .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^\w-]/g, "") // Remove special characters
    return `<${tag} id="${id}">${text}</${tag}>`
  })

  // Ensure links open in a new tab if they're external
  processedContent = processedContent.replace(
    /<a\s+(?![^>]*\btarget=["'])[^>]*href=["']([^"']+)["'][^>]*>/gi,
    (match, href) => {
      if (href.startsWith("http") && !href.includes("corretordetextoonline.com.br")) {
        return match.replace(/<a\s+/, '<a target="_blank" rel="noopener noreferrer" ')
      }
      return match
    },
  )

  // Fix image sizing issues
  processedContent = processedContent.replace(/<img\s+[^>]*>/gi, (match) => {
    if (!match.includes("class=")) {
      return match.replace(/<img\s+/, '<img class="rounded-md my-6 mx-auto" ')
    }
    return match
  })

  return processedContent
}
