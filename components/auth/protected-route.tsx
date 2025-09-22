"use client"

import React, { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/use-unified-auth'
import { UserAuthModal } from './user-auth-modal'
import { AdminLoginForm } from './admin-login-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Shield, User, Lock } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: 'user' | 'admin' | 'any'
  fallbackComponent?: ReactNode
  redirectTo?: string
  showAuthModal?: boolean
  allowUnauthenticated?: boolean
}

/**
 * Componente para proteger rotas baseado no tipo de usuário
 */
export function ProtectedRoute({
  children,
  requireAuth = 'any',
  fallbackComponent,
  redirectTo,
  showAuthModal = true,
  allowUnauthenticated = false
}: ProtectedRouteProps) {
  const { user, userType, loading, isAuthenticated } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    // Se está carregando, não fazer nada ainda
    if (loading) return

    // Se não requer autenticação, sempre permitir
    if (allowUnauthenticated) return

    // Se não está autenticado e deve redirecionar
    if (!isAuthenticated && redirectTo) {
      router.push(redirectTo)
      return
    }

    // Se requer tipo específico de usuário
    if (requireAuth === 'user' && userType !== 'user') {
      if (redirectTo) {
        router.push(redirectTo)
      }
      return
    }

    if (requireAuth === 'admin' && userType !== 'admin') {
      if (redirectTo) {
        router.push(redirectTo)
      }
      return
    }
  }, [loading, isAuthenticated, userType, requireAuth, redirectTo, router])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se permite não autenticados, sempre mostrar conteúdo
  if (allowUnauthenticated) {
    return <>{children}</>
  }

  // Verificar se o usuário tem a permissão necessária
  const hasPermission = (() => {
    if (requireAuth === 'any') return isAuthenticated
    if (requireAuth === 'user') return userType === 'user'
    if (requireAuth === 'admin') return userType === 'admin'
    return false
  })()

  // Se tem permissão, mostrar conteúdo
  if (hasPermission) {
    return <>{children}</>
  }

  // Se tem um componente de fallback customizado
  if (fallbackComponent) {
    return <>{fallbackComponent}</>
  }

  // Mostrar interfaces de autenticação padrão
  if (requireAuth === 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="w-full max-w-md">
          <AdminLoginForm />
        </div>
      </div>
    )
  }

  if (requireAuth === 'user' && showAuthModal) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <User className="h-5 w-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Você precisa estar logado para acessar esta página.
            </p>
            <UserAuthModal
              trigger={
                <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                  Fazer Login
                </button>
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback padrão
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Acesso Restrito
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * HOC para proteger componentes
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * HOC específico para rotas admin
 */
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children' | 'requireAuth'> = {}
) {
  return withAuth(Component, { ...options, requireAuth: 'admin' })
}

/**
 * HOC específico para rotas de usuário
 */
export function withUserAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children' | 'requireAuth'> = {}
) {
  return withAuth(Component, { ...options, requireAuth: 'user' })
}

/**
 * Componente para mostrar conteúdo baseado no tipo de usuário
 */
interface ConditionalContentProps {
  children: ReactNode
  showFor: 'user' | 'admin' | 'authenticated' | 'unauthenticated'
  fallback?: ReactNode
}

export function ConditionalContent({ children, showFor, fallback }: ConditionalContentProps) {
  const { userType, isAuthenticated, loading } = useCurrentUser()

  if (loading) return null

  const shouldShow = (() => {
    switch (showFor) {
      case 'user':
        return userType === 'user'
      case 'admin':
        return userType === 'admin'
      case 'authenticated':
        return isAuthenticated
      case 'unauthenticated':
        return !isAuthenticated
      default:
        return false
    }
  })()

  if (shouldShow) {
    return <>{children}</>
  }

  return fallback ? <>{fallback}</> : null
}

/**
 * Hook para verificar permissões
 */
export function usePermissions() {
  const { userType, isAuthenticated } = useCurrentUser()

  return {
    canAccessUserFeatures: userType === 'user',
    canAccessAdminFeatures: userType === 'admin',
    isAuthenticated,
    userType,
    
    // Helpers para verificações específicas
    canEditContent: userType === 'admin',
    canViewAnalytics: userType === 'admin',
    canUsePremiumFeatures: userType === 'user', // Pode ser expandido com lógica de plano
  }
}