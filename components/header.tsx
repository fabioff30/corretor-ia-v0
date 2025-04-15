"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname?.startsWith(path)) return true
    return false
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">CorretorIA</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/") ? "text-primary" : "text-foreground/60"}`}
          >
            Início
          </Link>
          <Link
            href="/recursos"
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/recursos") ? "text-primary" : "text-foreground/60"}`}
          >
            Recursos
          </Link>
          <Link
            href="/blog"
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/blog") ? "text-primary" : "text-foreground/60"}`}
          >
            Blog
          </Link>
          <Link
            href="/sobre"
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/sobre") ? "text-primary" : "text-foreground/60"}`}
          >
            Sobre
          </Link>
          <Link
            href="/contato"
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/contato") ? "text-primary" : "text-foreground/60"}`}
          >
            Contato
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <Button asChild className="hidden md:flex">
            <Link href="/apoiar">Apoiar</Link>
          </Button>
          <button className="md:hidden" onClick={toggleMenu} aria-label="Toggle Menu">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 flex flex-col gap-4">
            <Link
              href="/"
              className={`px-2 py-1 rounded-md ${isActive("/") ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            <Link
              href="/recursos"
              className={`px-2 py-1 rounded-md ${isActive("/recursos") ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Recursos
            </Link>
            <Link
              href="/blog"
              className={`px-2 py-1 rounded-md ${isActive("/blog") ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/sobre"
              className={`px-2 py-1 rounded-md ${isActive("/sobre") ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Sobre
            </Link>
            <Link
              href="/contato"
              className={`px-2 py-1 rounded-md ${isActive("/contato") ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Contato
            </Link>
            <Button asChild className="mt-2">
              <Link href="/apoiar" onClick={() => setIsMenuOpen(false)}>
                Apoiar
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
