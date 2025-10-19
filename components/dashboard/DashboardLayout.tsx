/**
 * Layout principal do dashboard
 */

'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  requireAdmin?: boolean
}

export function DashboardLayout({
  children,
  title,
  description,
  requireAdmin = false,
}: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, loading } = useUser()
  const isMobile = useIsMobile()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    // Redirecionar para login se não autenticado
    if (!loading && !user) {
      router.push('/login')
    }

    // Redirecionar se requer admin mas não é
    if (!loading && user && requireAdmin && profile?.plan_type !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, profile, loading, requireAdmin, router])

  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }, [isMobile])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não renderizar nada se não autenticado (evitar flash de conteúdo)
  if (!user || !profile) {
    return null
  }

  // Não renderizar se requer admin mas não é
  if (requireAdmin && profile.plan_type !== 'admin') {
    return null
  }

  return (
    <>
      <div className="flex min-h-screen bg-muted/20">
        {/* Sidebar - Desktop */}
        <div className="hidden md:flex">
          <DashboardSidebar />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader
            title={title}
            description={description}
            showMenuButton={isMobile}
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      {/* Sidebar - Mobile */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-full max-w-[18rem] border-r-0 p-0 sm:max-w-xs">
          <DashboardSidebar isMobile onNavigate={() => setIsMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
