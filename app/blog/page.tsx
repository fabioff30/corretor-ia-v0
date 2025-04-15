import { BackgroundGradient } from "@/components/background-gradient"
import { BlogPostCard } from "@/components/blog-post-card"

export const metadata = {
  title: "Blog | CorretorIA",
  description: "Artigos e dicas sobre comunicação escrita, português e muito mais",
}

// Adicionar o novo post sobre mensagens de aniversário
const blogPosts = [
  {
    id: "mensagens-de-aniversario",
    title: "+100 ideias de mensagem de aniversário para emocionar quem você ama",
    excerpt:
      "Descubra mais de 100 mensagens de aniversário para amigos, família, amor e colegas. Frases prontas para copiar e enviar no WhatsApp, cartões e redes sociais.",
    date: "2025-04-15",
    readTime: "10 min",
    slug: "mensagens-de-aniversario",
    coverImage:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250415_1826_Birthday%20Celebration%20Fun_simple_compose_01jrxngq4af9p8smw185v9kdvj-CleuSJnFtCXXifMf469miSPSFzAIiT.webp",
  },
]

export default function BlogPage() {
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

          <div className="grid gap-8">
            {blogPosts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
