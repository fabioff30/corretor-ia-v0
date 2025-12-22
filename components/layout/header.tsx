"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, LogOut, LogIn, LayoutDashboard, Crown } from "lucide-react"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useUser } from "@/hooks/use-user"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

export function Header() {
  const [adminPassword, setAdminPassword] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, login, logout, isLoading } = useAdminAuth()
  const { user, signOut: userSignOut, loading: userLoading } = useUser()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname?.startsWith(path)) return true
    return false
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

  const handleUserLogout = async () => {
    setIsLoggingOut(true)
    const { error } = await userSignOut()

    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      })
      setIsLoggingOut(false)
      return
    }

    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta.",
    })

    // Redirect to home page (full page reload to ensure clean state)
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-corretoria.png"
              alt="CorretorIA - Corretor de Texto Online"
              width={210}
              height={48}
              priority
              className="h-12 w-auto"
            />
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
            href="/detector-ia"
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/detector-ia") ? "text-primary" : "text-foreground/60"}`}
          >
            Detector de IA
          </Link>
          <Link
            href="/conversor"
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/conversor") ? "text-primary" : "text-foreground/60"}`}
          >
            Conversor
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
          <Button
            asChild
            className="bg-gradient-to-r from-primary to-secondary text-white shadow-sm hover:opacity-90 animate-pulse hover:animate-none relative"
          >
            <Link href="/premium">
              <Crown className="mr-2 h-4 w-4" />
              Assine já
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
            </Link>
          </Button>

          {/* Admin Access Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
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
                      <DropdownMenuItem asChild>
                        <Link href="/admin/coupons" className="cursor-pointer">
                          Cupons de Desconto
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



          {/* User Auth Button - Desktop */}
          <div className="hidden md:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Ir para Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleUserLogout}
                    className="text-red-500 cursor-pointer"
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>


        </div>
      </div>


    </header>
  )
}
