"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Menu, X, Sparkles } from "lucide-react"
import { WebhookStatus } from "@/components/webhook-status"
import { motion } from "framer-motion"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Detectar cliques fora do menu mobile para fechá-lo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Verificar se o menu está aberto e se o clique foi fora do menu e do botão de toggle
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button[aria-label="Toggle menu"]')
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    // Adicionar o event listener apenas quando o menu estiver aberto
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    // Remover o event listener quando o componente for desmontado ou o menu for fechado
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobileMenuOpen])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md border-b" : "bg-transparent"
      }`}
    >
      <div className="w-full max-w-[1366px] mx-auto flex min-h-16 items-center justify-between px-3 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/" className="flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-1" />
              <span className="text-lg sm:text-xl font-bold gradient-text">CorretorIA</span>
            </motion.div>
          </Link>
          <div className="ml-2 sm:ml-4 hidden md:block">
            <WebhookStatus />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Início
          </Link>
          <Link
            href="/recursos"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Recursos
          </Link>
          <Link
            href="/sobre"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Sobre
          </Link>
          <Link
            href="#como-usar"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Como usar
          </Link>
          <Link href="#faq" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            FAQ
          </Link>
          <ModeToggle />
          <Button size="sm" className="ml-2" asChild>
            <Link href="/apoiar?utm_source=header&utm_medium=button&utm_campaign=main_nav">Apoiar</Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <div className="mr-1 sm:mr-2 scale-90 sm:scale-100">
            <WebhookStatus />
          </div>
          <ModeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="ml-1 sm:ml-2 p-1 sm:p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden bg-background/95 backdrop-blur-md border-b">
          <nav className="container flex flex-col space-y-4 py-4">
            <Link
              href="/"
              className="text-sm font-medium px-4 py-2 rounded-md hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Início
            </Link>
            <Link
              href="/recursos"
              className="text-sm font-medium px-4 py-2 rounded-md hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Recursos
            </Link>
            <Link
              href="/sobre"
              className="text-sm font-medium px-4 py-2 rounded-md hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sobre
            </Link>
            <Link
              href="#como-usar"
              className="text-sm font-medium px-4 py-2 rounded-md hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Como usar
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium px-4 py-2 rounded-md hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Button className="mx-4" onClick={() => setIsMobileMenuOpen(false)} asChild>
              <Link href="/apoiar?utm_source=mobile_menu&utm_medium=button&utm_campaign=main_nav">Apoiar</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
