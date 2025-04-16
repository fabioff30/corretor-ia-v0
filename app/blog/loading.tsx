import { BackgroundGradient } from "@/components/background-gradient"
import { BlogPageSkeleton } from "@/components/blog-page-skeleton"

export default function BlogLoading() {
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
          </div>

          <BlogPageSkeleton />
        </div>
      </div>
    </>
  )
}
