import type { Metadata } from "next"
import { BlogPostPageClient } from "./BlogPostPageClient"

// Add the correct type import from next
import type { PageProps } from "next/types"

// Adicionar o novo post sobre mensagens de aniversário
const blogPosts = {
  "mensagens-de-aniversario": {
    title: "+100 ideias de mensagem de aniversário para emocionar quem você ama",
    description:
      "Descubra mais de 100 mensagens de aniversário para amigos, família, amor e colegas. Frases prontas para copiar e enviar no WhatsApp, cartões e redes sociais.",
    keywords:
      "mensagem de aniversário, feliz aniversário, parabéns, mensagens para amigos, mensagens românticas, mensagens para família, mensagens engraçadas, mensagens para WhatsApp",
    date: "2025-04-15",
    readTime: "10 min",
    coverImage:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250415_1826_Birthday%20Celebration%20Fun_simple_compose_01jrxngq4af9p8smw185v9kdvj-CleuSJnFtCXXifMf469miSPSFzAIiT.webp",
  },
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = blogPosts[params.slug]

  if (!post) {
    return {
      title: "Post não encontrado",
      description: "O post que você está procurando não existe ou foi removido.",
    }
  }

  return {
    title: `${post.title} | CorretorIA`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://corretordetextoonline.com.br/blog/${params.slug}`,
      siteName: "CorretorIA",
      locale: "pt_BR",
      type: "article",
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.coverImage],
    },
  }
}

// Fix the type definition for the page component
export default function BlogPostPage({ params }: PageProps<{ slug: string }>) {
  return <BlogPostPageClient slug={params.slug} />
}
