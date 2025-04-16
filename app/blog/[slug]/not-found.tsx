import Link from "next/link"
import { BackgroundGradient } from "@/components/background-gradient"

export default function BlogPostNotFound() {
  return (
    <>
      <BackgroundGradient />
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Post não encontrado</h1>
        <p className="text-xl mb-8">O post que você está procurando não existe ou foi removido.</p>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Voltar para o blog
        </Link>
      </div>
    </>
  )
}
