/**
 * Header do dashboard com informações do usuário
 */

'use client'

import { UserAvatar } from './UserAvatar'
import { ModeToggle } from '@/components/mode-toggle'
import { Bell, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardHeaderProps {
  title?: string
  description?: string
  showMenuButton?: boolean
  onToggleSidebar?: () => void
}

export function DashboardHeader({ title, description, showMenuButton = false, onToggleSidebar }: DashboardHeaderProps) {
  const { profile, loading } = useUser()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 sm:px-6">
      <div className="flex w-full items-center justify-between gap-3">
        {/* Título da página */}
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onToggleSidebar}
              aria-label="Abrir menu"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <div>
              <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
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
