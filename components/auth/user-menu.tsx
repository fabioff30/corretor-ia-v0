"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Settings, 
  LogOut, 
  Crown,
  Loader2,
  CreditCard,
  BarChart3
} from "lucide-react"

export function UserMenu() {
  const { user, signOut, loading } = useAuth()
  const subscription = useSubscription()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }


  // Se não estiver logado, mostrar botões de login/registro
  if (!user && !loading) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Entrar</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">Cadastrar</Link>
        </Button>
      </div>
    )
  }

  // Mostrar loading enquanto carrega
  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />
  }

  // Se estiver logado, mostrar menu do usuário
  if (user) {
    const getInitials = (name?: string) => {
      if (!name) return "U"
      return name
        .split(" ")
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback className="text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">
                  {user.name || "Usuário"}
                </p>
                {subscription.isPremium && (
                  <Badge variant="outline" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              {subscription.isPremium && subscription.daysUntilExpiry && (
                <p className="text-xs text-muted-foreground">
                  Expira em {subscription.daysUntilExpiry} dias
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/account" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Minha Conta
            </Link>
          </DropdownMenuItem>
          
          {!subscription.isPremium && (
            <DropdownMenuItem asChild>
              <Link href="/upgrade" className="cursor-pointer text-amber-600">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade para Pro
              </Link>
            </DropdownMenuItem>
          )}
          
          {subscription.isPremium && (
            <DropdownMenuItem asChild>
              <Link href="/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Cobrança
              </Link>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer text-red-500"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return null
}