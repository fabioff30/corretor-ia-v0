import Link from "next/link"

interface RelatedPost {
  title: string
  slug: string
  excerpt: string
}

interface RelatedPostsProps {
  posts: RelatedPost[]
  currentSlug: string
}

export function RelatedPosts({ posts, currentSlug }: RelatedPostsProps) {
  // Filter out the current post
  const filteredPosts = posts.filter((post) => post.slug !== currentSlug)

  if (filteredPosts.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t">
      <h3 className="text-xl font-bold mb-6">Posts relacionados</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.map((post, index) => (
          <div key={index} className="glass-card rounded-lg p-4 hover:shadow-md transition-shadow">
            <Link href={`/blog/${post.slug}`} className="block">
              <h4
                className="font-medium mb-2 hover:text-primary transition-colors"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />
              <p className="text-sm text-foreground/70">{post.excerpt}</p>
              <p className="text-primary text-sm mt-2">Ler mais →</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
