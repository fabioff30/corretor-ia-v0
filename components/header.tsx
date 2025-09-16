"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, Sparkles, X, Shield, LogOut } from "lucide-react"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserMenu } from "@/components/auth/user-menu"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const pathname = usePathname()
  const { isAuthenticated, login, logout, isLoading } = useAdminAuth()
  const { toast } = useToast()

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname?.startsWith(path)) return true
    return false
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (login(adminPassword)) {
      toast({
        title: "Login bem-sucedido",
        description: "Você está autenticado como administrador.",
      })
      setAdminPassword("")
    } else {
      toast({
        title: "Falha no login",
        description: "Senha incorreta. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleAdminLogout = () => {
    logout()
    toast({
      title: "Logout realizado",
      description: "Você saiu da área administrativa.",
    })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <Sparkles className="h-5 w-5 text-primary mr-1.5" />
            <span className="text-xl font-bold gradient-text">CorretorIA</span>
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
          {/* User Menu */}
          <UserMenu />
          
          {/* Admin Access Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
                <Shield className="h-4 w-4" />
                <span className="sr-only">Acesso Administrativo</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <>
                      <div className="px-2 py-1.5 text-sm font-medium">Área Administrativa</div>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/content-monitoring" className="cursor-pointer">
                          Monitoramento de Conteúdo
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/ratings" className="cursor-pointer">
                          Estatísticas de Avaliações
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAdminLogout} className="text-red-500 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <form onSubmit={handleAdminLogin} className="p-2">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Acesso Administrativo</div>
                        <Input
                          type="password"
                          placeholder="Senha"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Button type="submit" size="sm" className="w-full">
                          Entrar
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />
          
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
