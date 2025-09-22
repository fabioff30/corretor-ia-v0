/**
 * EXEMPLO DE INTEGRAÇÃO - Sistema de Autenticação Unificado CorretorIA
 * 
 * Este arquivo demonstra como integrar o novo sistema de autenticação
 * no layout principal da aplicação e como migrar componentes existentes.
 */

"use client"

import React from 'react'
import { UnifiedAuthProvider } from '@/contexts/unified-auth-context'
import { ProtectedRoute, ConditionalContent } from '@/components/auth/protected-route'
import { UserAuthModal } from '@/components/auth/user-auth-modal'
import { AdminLoginForm } from '@/components/auth/admin-login-form'
import { useAuth, useCurrentUser, useAdminAuth } from '@/hooks/use-unified-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Shield, LogOut } from 'lucide-react'

/**
 * PASSO 1: Envolver a aplicação com o UnifiedAuthProvider
 * 
 * No seu app/layout.tsx ou _app.tsx, envolva a aplicação:
 * 
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="pt-BR">
 *       <body>
 *         <UnifiedAuthProvider>
 *           {children}
 *         </UnifiedAuthProvider>
 *       </body>
 *     </html>
 *   )
 * }
 */

/**
 * PASSO 2: Componente de Header atualizado
 */
function HeaderExample() {
  const { user, loading, signOut } = useAuth()
  const { userType } = useCurrentUser()

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow">
      <h1 className="text-2xl font-bold">CorretorIA</h1>
      
      <div className="flex items-center gap-4">
        <ConditionalContent showFor="unauthenticated">
          <UserAuthModal
            trigger={
              <Button variant="outline">
                <User className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            }
          />
        </ConditionalContent>

        <ConditionalContent showFor="user">
          <div className="flex items-center gap-2">
            <span>Olá, {user?.name}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </ConditionalContent>

        <ConditionalContent showFor="admin">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Admin: {user?.name || user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </ConditionalContent>
      </div>
    </header>
  )
}

/**
 * PASSO 3: Páginas protegidas
 */
function UserDashboardExample() {
  const { user } = useAuth()

  return (
    <ProtectedRoute requireAuth="user">
      <div className="p-6">
        <h1>Dashboard do Usuário</h1>
        <p>Bem-vindo, {user?.name}!</p>
        <p>Plano: {user?.userType === 'user' ? user.subscription?.plan : 'N/A'}</p>
      </div>
    </ProtectedRoute>
  )
}

function AdminDashboardExample() {
  const { admin } = useAdminAuth()

  return (
    <ProtectedRoute requireAuth="admin">
      <div className="p-6">
        <h1>Dashboard Administrativo</h1>
        <p>Bem-vindo, {admin?.name}!</p>
        <p>Último login: {admin?.last_login}</p>
      </div>
    </ProtectedRoute>
  )
}

/**
 * PASSO 4: Componente de correção de texto atualizado
 */
function TextCorrectionExample() {
  const { user } = useAuth()
  
  // Helper functions (você pode implementar estas no contexto se necessário)
  const getCorrectionLimit = (user: any) => user?.subscription?.plan === 'premium' ? 5000 : 1500
  const canUsePremiumFeature = (user: any) => user?.subscription?.plan === 'premium' && user?.subscription?.status === 'active'

  const characterLimit = getCorrectionLimit(user)
  const isPremium = canUsePremiumFeature(user)

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Correção de Texto</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionalContent showFor="unauthenticated">
            <div className="text-center py-8">
              <p className="mb-4">Faça login para usar o corretor</p>
              <UserAuthModal
                trigger={<Button>Fazer Login</Button>}
              />
            </div>
          </ConditionalContent>

          <ConditionalContent showFor="authenticated">
            <div>
              <p>Limite de caracteres: {characterLimit}</p>
              <p>Plano: {isPremium ? 'Premium' : 'Gratuito'}</p>
              {/* Formulário de correção aqui */}
            </div>
          </ConditionalContent>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * PASSO 5: Migração de componentes legados
 * 
 * Para migrar componentes que usam o antigo AuthContext:
 * 
 * ANTES:
 * import { useAuth } from '@/contexts/auth-context'
 * 
 * DEPOIS:
 * import { useAuth } from '@/hooks/use-unified-auth'
 * 
 * O hook useAuth mantém a mesma interface para compatibilidade!
 */

/**
 * PASSO 6: APIs protegidas
 * 
 * Para proteger rotas de API, use os helpers:
 * 
 * // app/api/user/profile/route.ts
 * import { withAuth } from '@/middleware/supabase-auth'
 * 
 * export const GET = withAuth(async (request, session) => {
 *   // session contém os dados do usuário autenticado
 *   return NextResponse.json({ user: session.user })
 * })
 * 
 * // app/api/admin/users/route.ts
 * import { withAdminAuth } from '@/middleware/supabase-auth'
 * 
 * export const GET = withAdminAuth(async (request, admin) => {
 *   // admin contém os dados do administrador
 *   return NextResponse.json({ message: 'Admin only' })
 * })
 */

/**
 * PASSO 7: Server Components
 * 
 * Para usar autenticação em Server Components:
 * 
 * import { getServerSession, getServerUser } from '@/utils/auth-helpers'
 * 
 * export default async function ServerPage() {
 *   const session = await getServerSession()
 *   const user = await getServerUser()
 *   
 *   if (!session) {
 *     return <div>Não autenticado</div>
 *   }
 *   
 *   return <div>Olá, {user?.name}</div>
 * }
 */

/**
 * PASSO 8: Exemplo completo da página principal
 */
export default function AuthIntegrationExample() {
  return (
    <UnifiedAuthProvider>
      <div className="min-h-screen bg-gray-50">
        <HeaderExample />
        
        <main className="container mx-auto py-8">
          <div className="grid gap-8">
            <TextCorrectionExample />
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Área do Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserDashboardExample />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Área Administrativa</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminDashboardExample />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </UnifiedAuthProvider>
  )
}

/**
 * CHECKLIST DE MIGRAÇÃO:
 * 
 * □ 1. Instalar dependências: @supabase/ssr, react-icons
 * □ 2. Envolver app com UnifiedAuthProvider
 * □ 3. Atualizar imports dos hooks de auth
 * □ 4. Migrar componentes para usar novos hooks
 * □ 5. Atualizar middleware para usar supabaseAuthMiddleware
 * □ 6. Configurar rotas OAuth (/auth/callback)
 * □ 7. Atualizar APIs para usar novos helpers de auth
 * □ 8. Testar login/logout de usuários e admins
 * □ 9. Testar proteção de rotas
 * □ 10. Testar OAuth (Google, GitHub)
 * 
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (para operações admin)
 */