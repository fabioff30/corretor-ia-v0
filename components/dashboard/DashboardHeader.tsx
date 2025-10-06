/**
 * Header do dashboard com informações do usuário
 */

'use client'

import { UserAvatar } from './UserAvatar'
import { ModeToggle } from '@/components/mode-toggle'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardHeaderProps {
  title?: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { profile, loading } = useUser()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex flex-1 items-center justify-between">
        {/* Título da página */}
        <div className="flex-1">
          {title && (
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notificações (futuro) */}
          <Button variant="ghost" size="icon" className="relative" disabled>
            <Bell className="h-5 w-5" />
            {/* <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span> */}
          </Button>

          {/* Toggle de tema */}
          <ModeToggle />

          {/* Avatar do usuário */}
          {loading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : (
            <UserAvatar />
          )}
        </div>
      </div>
    </header>
  )
}
