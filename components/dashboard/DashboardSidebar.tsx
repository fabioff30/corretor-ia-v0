/**
 * Sidebar de navegação do dashboard
 */

'use client'

import { useEffect, useState } from 'react'
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
  Zap,
  Wand2,
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

interface DashboardSidebarProps {
  isMobile?: boolean
  onNavigate?: () => void
  className?: string
}

export function DashboardSidebar({ isMobile = false, onNavigate, className }: DashboardSidebarProps) {
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

  // Premium navigation items (only for Pro/Admin users)
  const premiumNavItems: NavItem[] = [
    {
      title: 'Corretor Premium',
      href: '/dashboard/corretor-premium',
      icon: Zap,
      badge: 'PRO',
    },
    {
      title: 'Reescrever Premium',
      href: '/dashboard/reescrever-premium',
      icon: Wand2,
      badge: 'PRO',
    },
    {
      title: 'Detector IA Premium',
      href: '/dashboard/detector-ia-premium',
      icon: Sparkles,
      badge: 'PRO',
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

  const isPremium = profile?.plan_type === 'pro' || profile?.plan_type === 'admin'

  // Combinar todos os items baseado no tipo de usuário
  let allItems = [...navItems]

  // Adicionar items premium se for Pro/Admin
  if (isPremium) {
    allItems = [...navItems, ...premiumNavItems]
  }

  // Adicionar items admin se for Admin
  if (isAdmin) {
    allItems = [...allItems, ...adminNavItems]
  }

  // Filtrar "Upgrade para Pro" se for usuário Pro ou Admin
  const filteredItems = allItems.filter((item) => {
    if (item.href === '/dashboard/upgrade' && isPremium) {
      return false
    }
    return true
  })

  useEffect(() => {
    if (isMobile && collapsed) {
      setCollapsed(false)
    }
  }, [isMobile, collapsed])

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div
      className={cn(
        'relative flex h-full flex-col bg-card transition-all duration-300',
        isMobile ? 'w-full max-w-[18rem]' : collapsed ? 'w-16 border-r' : 'w-64 border-r',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg gradient-text">CorretorIA</span>
          </Link>
        )}
        {!isMobile && (
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
        )}
      </div>

      {/* Plano Badge */}
      {!collapsed && profile && (
        <div className="border-b px-4 py-3">
          <PlanBadge planType={profile.plan_type} className="w-full justify-center" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
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
                item.adminOnly && 'border-l-2 border-purple-500',
                item.badge === 'PRO' && 'border-l-2 border-pink-500'
              )}
              title={collapsed ? item.title : undefined}
              onClick={() => {
                if (isMobile) {
                  onNavigate?.()
                }
              }}
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
        <div className="border-t p-4">
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
