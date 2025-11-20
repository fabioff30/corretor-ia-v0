"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ScanSearch, FileText, Crown, Menu, MessageCircle, LogIn, LogOut, PenTool } from "lucide-react"
import Image from "next/image"
import { cn } from "@/utils/classnames"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"

export function MobileNav() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true
        if (path !== "/" && pathname?.startsWith(path)) return true
        return false
    }

    const { user, signOut } = useUser()
    const { toast } = useToast()

    const handleLogout = async () => {
        setIsLoggingOut(true)
        const { error } = await signOut()

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

        window.location.href = '/'
    }

    const navItems = [
        {
            href: "/",
            label: "Início",
            icon: Home,
        },
        {
            href: "/detector-ia",
            label: "Detector",
            icon: ScanSearch,
        },
        {
            href: "/reescrever-texto",
            label: "Reescrever",
            icon: PenTool,
        },
        {
            href: "/chat/julinho",
            label: "Julinho",
            icon: MessageCircle,
            isJulinho: true,
        },
        {
            href: "/login",
            label: user ? "Logout" : "Entrar",
            icon: user ? LogOut : LogIn,
            highlight: !user,
            isLogout: !!user,
        },
    ]

    return (
        <>
            {/* Spacer to prevent content from being hidden behind the fixed nav */}
            <div className="h-16 md:hidden" />

            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 md:hidden pb-safe">
                <div className="flex h-16 items-center justify-around px-2">
                    {navItems.map((item) => {
                        const active = isActive(item.href)

                        if (item.isJulinho) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full px-1 transition-colors",
                                        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-border">
                                        <Image
                                            src="/images/julinho-avatar.webp"
                                            alt="Julinho"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </Link>
                            )
                        }

                        const Icon = item.icon

                        // Handle logout as button
                        if (item.isLogout) {
                            return (
                                <button
                                    key="logout"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full px-1 transition-colors",
                                        "text-muted-foreground hover:text-foreground",
                                        isLoggingOut && "opacity-50"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-[10px] font-medium">
                                        {isLoggingOut ? "Saindo..." : item.label}
                                    </span>
                                </button>
                            )
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full px-1 transition-colors",
                                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <Icon className={cn("h-5 w-5", item.highlight && "text-amber-500", active && item.highlight && "fill-amber-500/20")} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        )
                    })}

                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <button
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full px-1 transition-colors text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <Menu className="h-5 w-5" />
                                <span className="text-[10px] font-medium">Menu</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh] rounded-t-[20px] px-0">
                            <SheetHeader className="px-6 mb-4">
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <div className="px-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                                <div className="grid gap-4 py-4">
                                    <Link
                                        href="/blog"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent"
                                    >
                                        <FileText className="h-5 w-5 text-primary" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">Blog</span>
                                            <span className="text-xs text-muted-foreground">Dicas e tutoriais</span>
                                        </div>
                                    </Link>
                                    <Link
                                        href="/sobre"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">Sobre</span>
                                            <span className="text-xs text-muted-foreground">Conheça nossa história</span>
                                        </div>
                                    </Link>
                                    <Link
                                        href="/contato"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">Contato</span>
                                            <span className="text-xs text-muted-foreground">Fale conosco</span>
                                        </div>
                                    </Link>

                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-xs text-muted-foreground text-center mb-4">
                                            © {new Date().getFullYear()} CorretorIA
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </>
    )
}
