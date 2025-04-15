import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { CalendarIcon, Clock } from "lucide-react"

interface BlogPost {
  id: string
  title: string
  excerpt: string
  date: string
  readTime: string
  slug: string
  coverImage: string
}

interface BlogPostCardProps {
  post: BlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  // Format date to display in a more readable format
  const formattedDate = new Date(post.date).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="aspect-video w-full bg-muted/50 relative overflow-hidden">
          <img
            src={post.coverImage || "/placeholder.svg"}
            alt="+100 ideias de mensagem de aniversário para emocionar quem você ama"
            className="object-cover w-full h-full transition-transform hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="pt-6">
        <Link href={`/blog/${post.slug}`} className="block">
          <h2 className="text-2xl font-bold mb-2 hover:text-primary transition-colors">{post.title}</h2>
        </Link>
        <p className="text-foreground/80 mb-4">{post.excerpt}</p>
      </CardContent>
      <CardFooter className="border-t pt-4 text-sm text-foreground/60 flex items-center gap-4">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{post.readTime} de leitura</span>
        </div>
      </CardFooter>
    </Card>
  )
}
