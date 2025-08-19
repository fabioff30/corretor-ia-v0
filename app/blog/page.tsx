import { Suspense } from "react"
import { BackgroundGradient } from "@/components/background-gradient"
import { BlogPostList } from "@/components/blog-post-list"
import { BlogPageSkeleton } from "@/components/blog-page-skeleton"
import { AdminRefreshButton } from "@/components/admin-refresh-button"
import { getRevalidationTime } from "@/utils/cache-config"

export const dynamic = "force-dynamic" // Corrigido: hífen em vez de underscore
export const revalidate = getRevalidationTime('blog-post') // Optimized: 15 minutes (was 5)

export function generateMetadata({ searchParams }: { searchParams: { page?: string } }) {
  const pageParam = searchParams.page ? `?page=${searchParams.page}` : ""
  const canonicalUrl = `https://www.corretordetextoonline.com.br/blog${pageParam}`

  return {
    title: "Blog | CorretorIA",
    description: "Artigos e dicas sobre comunicação escrita, português e muito mais",
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1

  return (
    <>
      <BackgroundGradient />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Blog CorretorIA</h1>
            <p className="text-lg text-foreground/80">
              Dicas, mensagens e conteúdo para melhorar sua comunicação escrita
            </p>
            <div className="mt-4">
              <AdminRefreshButton />
            </div>
          </div>

          <Suspense fallback={<BlogPageSkeleton />}>
            <BlogPostList page={page} />
          </Suspense>
        </div>
      </div>
    </>
  )
}
