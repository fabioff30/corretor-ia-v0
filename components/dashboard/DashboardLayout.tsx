/**
 * Layout principal do dashboard
 */

'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'

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
  const { user, profile, loading } = useUser()

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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader title={title} description={description} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
