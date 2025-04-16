import { getPosts } from "@/utils/wordpress-api"
import { BlogPostCard } from "@/components/blog-post-card"
import { Pagination } from "@/components/pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export async function BlogPostList({ page = 1 }: { page?: number }) {
  const { posts, totalPages, totalPosts } = await getPosts(page, 10)

  if (posts.length === 0) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar posts</AlertTitle>
        <AlertDescription>
          Não foi possível carregar os posts do blog. Por favor, tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <div className="grid gap-8">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-12">
          <Pagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
