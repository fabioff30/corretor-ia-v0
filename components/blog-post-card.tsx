import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { CalendarIcon, Clock } from "lucide-react"
import { type WPPost, formatWpDate, calculateReadingTime } from "@/utils/wordpress-api"

interface BlogPostCardProps {
  post: WPPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  // Get featured image URL if available
  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "/placeholder.svg"

  // Get formatted date
  const formattedDate = formatWpDate(post.date)

  // Calculate reading time
  const readTime = calculateReadingTime(post.content.rendered)

  // Get author name
  const authorName = post._embedded?.author?.[0]?.name || "Autor"

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="aspect-video w-full bg-muted/50 relative overflow-hidden">
          <img
            src={featuredImage || "/placeholder.svg"}
            alt={post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text || post.title.rendered}
            className="object-cover w-full h-full transition-transform hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="pt-6">
        <Link href={`/blog/${post.slug}`} className="block">
          <h2
            className="text-2xl font-bold mb-2 hover:text-primary transition-colors"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />
        </Link>
        <div className="text-foreground/80 mb-4" dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
      </CardContent>
      <CardFooter className="border-t pt-4 text-sm text-foreground/60 flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{readTime} de leitura</span>
        </div>
        <div className="ml-auto">
          <span>Por {authorName}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
