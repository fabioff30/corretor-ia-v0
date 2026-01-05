/**
 * Avatar do usuário com dropdown de perfil
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Settings, User, Crown } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { PlanBadge } from './PlanBadge'
import { useToast } from '@/hooks/use-toast'

export function UserAvatar() {
  const router = useRouter()
  const { user, profile, signOut } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    const { error } = await signOut()

    if (error) {
      toast({
        title: 'Erro ao sair',
        description: error.message,
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    toast({
      title: 'Até logo!',
      description: 'Você foi desconectado com sucesso.',
    })

    router.replace('/')
    router.refresh()
  }

  if (!user || !profile) return null

  const planForBadge: 'free' | 'pro' | 'admin' =
    profile.plan_type === 'admin'
      ? 'admin'
      : profile.plan_type === 'pro' || profile.plan_type === 'lifetime'
        ? 'pro'
        : 'free'

  // Pegar iniciais do nome ou email
  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.slice(0, 2).toUpperCase() || 'U'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'Avatar'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.full_name || 'Usuário'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <div className="pt-2">
              <PlanBadge planType={planForBadge} />
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Meu Dashboard</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/dashboard/configuracoes')} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>

        {profile.plan_type === 'free' && (
          <DropdownMenuItem onClick={() => router.push('/dashboard/upgrade')} className="cursor-pointer">
            <Crown className="mr-2 h-4 w-4 text-yellow-500" />
            <span className="text-yellow-600 dark:text-yellow-500 font-medium">Upgrade para Pro</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          className="cursor-pointer text-red-600 dark:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? 'Saindo...' : 'Sair'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
