import Link from "next/link"
import { BackgroundGradient } from "@/components/background-gradient"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <>
      <BackgroundGradient />
      <div className="container flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Página não encontrada</h2>
        <p className="text-foreground/80 mb-8 max-w-md">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href="/">Voltar para a página inicial</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/blog">Explorar o blog</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
