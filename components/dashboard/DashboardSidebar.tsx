/**
 * Sidebar de navegação do dashboard
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Settings,
  Crown,
  Shield,
  Users,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlanBadge } from './PlanBadge'
import { useUser } from '@/hooks/use-user'

interface NavItem {
  title: string
  href: string
  icon: any
  badge?: string
  adminOnly?: boolean
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { profile } = useUser()
  const [collapsed, setCollapsed] = useState(false)

  const isAdmin = profile?.plan_type === 'admin'

  const navItems: NavItem[] = [
    {
      title: 'Visão Geral',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Meus Textos',
      href: '/dashboard/textos',
      icon: FileText,
    },
    {
      title: 'Configurações',
      href: '/dashboard/configuracoes',
      icon: Settings,
    },
    {
      title: 'Upgrade para Pro',
      href: '/dashboard/upgrade',
      icon: Crown,
    },
  ]

  const adminNavItems: NavItem[] = [
    {
      title: 'Admin Dashboard',
      href: '/admin/dashboard',
      icon: Shield,
      adminOnly: true,
    },
    {
      title: 'Gerenciar Usuários',
      href: '/admin/usuarios',
      icon: Users,
      adminOnly: true,
    },
    {
      title: 'Configurar Limites',
      href: '/admin/limites',
      icon: Sliders,
      adminOnly: true,
    },
  ]

  const allItems = isAdmin ? [...navItems, ...adminNavItems] : navItems

  // Filtrar "Upgrade para Pro" se for usuário Pro ou Admin
  const filteredItems = allItems.filter((item) => {
    if (item.href === '/dashboard/upgrade' && (profile?.plan_type === 'pro' || profile?.plan_type === 'admin')) {
      return false
    }
    return true
  })

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div
      className={cn(
        'relative flex flex-col h-full border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg gradient-text">CorretorIA</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('h-8 w-8', collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Plano Badge */}
      {!collapsed && profile && (
        <div className="px-4 py-3 border-b">
          <PlanBadge planType={profile.plan_type} className="w-full justify-center" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                active ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground',
                collapsed && 'justify-center',
                item.adminOnly && 'border-l-2 border-purple-500'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t">
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link href="/">
              Voltar ao Site
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
