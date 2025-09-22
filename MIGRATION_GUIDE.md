# Guia de Migração - Sistema de Autenticação Unificado CorretorIA

Este guia detalha como migrar do sistema de autenticação atual (JWT customizado + Supabase parcial) para o novo sistema unificado baseado completamente no Supabase.

## 📋 Resumo das Mudanças

### ✅ O que foi implementado:

1. **Context Unificado**: `UnifiedAuthProvider` que gerencia tanto usuários quanto administradores
2. **Hooks Modernos**: Sistema de hooks que substitui os existentes mantendo compatibilidade
3. **Middleware Supabase**: Novo middleware baseado em `@supabase/ssr`
4. **Componentes de UI**: Formulários de login, modais e rotas protegidas
5. **Utilitários**: Helpers para servidor e cliente com validações robustas
6. **OAuth Support**: Suporte completo a Google, GitHub e outros providers

### 🔄 Sistema Atual vs Novo Sistema:

| Funcionalidade | Sistema Atual | Novo Sistema |
|----------------|---------------|--------------|
| **Users** | `contexts/auth-context.tsx` | `contexts/unified-auth-context.tsx` |
| **Admins** | `lib/auth.ts` (JWT) | Integrado no contexto unificado |
| **Middleware** | `middleware/admin-auth.ts` | `middleware/supabase-auth.ts` |
| **Hooks** | `useAuth()`, `useAdminAuth()` | Hooks unificados mantendo compatibilidade |
| **OAuth** | Não implementado | Suporte completo |
| **Server-side** | JWT manual | Supabase SSR nativo |

## 🚀 Passo a Passo da Migração

### Passo 1: Instalar Dependências

```bash
npm install @supabase/ssr react-icons
```

### Passo 2: Atualizar Layout Principal

**Arquivo: `app/layout.tsx`**

```tsx
// ANTES
import { AuthProvider } from '@/contexts/auth-context'

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

// DEPOIS
import { UnifiedAuthProvider } from '@/contexts/unified-auth-context'

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <UnifiedAuthProvider>
          {children}
        </UnifiedAuthProvider>
      </body>
    </html>
  )
}
```

### Passo 3: Migrar Componentes

#### 3.1 Componentes de Usuário

```tsx
// ANTES
import { useAuth } from '@/contexts/auth-context'

function UserComponent() {
  const { user, signIn, signOut } = useAuth()
  // ...
}

// DEPOIS - Mantém a mesma interface!
import { useAuth } from '@/hooks/use-unified-auth'

function UserComponent() {
  const { user, signIn, signOut } = useAuth()
  // Código continua o mesmo!
}
```

#### 3.2 Componentes Admin

```tsx
// ANTES
import { useAdminAuth } from '@/hooks/use-admin-auth'

function AdminComponent() {
  const { isAuthenticated, login, logout } = useAdminAuth()
  
  const handleLogin = () => {
    const success = login('admin@email.com', 'password')
    if (success) {
      // ...
    }
  }
}

// DEPOIS - Interface atualizada
import { useAdminAuth } from '@/hooks/use-admin-auth'

function AdminComponent() {
  const { isAuthenticated, signIn, signOut } = useAdminAuth()
  
  const handleLogin = async () => {
    const result = await signIn({ 
      email: 'admin@email.com', 
      password: 'password' 
    })
    if (!result.error) {
      // ...
    }
  }
}
```

### Passo 4: Atualizar Rotas Protegidas

```tsx
// ANTES - Verificação manual
function ProtectedPage() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>
  
  return <div>Protected content</div>
}

// DEPOIS - Usando ProtectedRoute
import { ProtectedRoute } from '@/components/auth/protected-route'

function ProtectedPage() {
  return (
    <ProtectedRoute requireAuth="user">
      <div>Protected content</div>
    </ProtectedRoute>
  )
}
```

### Passo 5: Migrar APIs

#### 5.1 APIs de Usuário

```ts
// ANTES - Verificação manual
export async function GET(request: NextRequest) {
  // Verificação manual de JWT...
}

// DEPOIS - Usando withAuth
import { withAuth } from '@/middleware/supabase-auth'

export const GET = withAuth(async (request, session) => {
  // session.user contém dados do usuário
  return NextResponse.json({ user: session.user })
})
```

#### 5.2 APIs Admin

```ts
// ANTES
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    // código admin...
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// DEPOIS
import { withAdminAuth } from '@/middleware/supabase-auth'

export const GET = withAdminAuth(async (request, admin) => {
  // admin contém dados do administrador
  return NextResponse.json({ admin })
})
```

### Passo 6: Configurar OAuth

#### 6.1 Callback Route

Criar arquivo: `app/auth/callback/page.tsx`
```tsx
// Já implementado no sistema!
// O arquivo /app/auth/callback/page.tsx já está criado
```

#### 6.2 Configurar Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em Authentication > Settings
3. Configure os providers OAuth:
   - **Google**: Adicione Client ID e Secret
   - **GitHub**: Adicione Client ID e Secret
4. Adicione URL de callback: `https://seudominio.com/auth/callback`

### Passo 7: Atualizar Middleware Principal

**Arquivo: `middleware.ts`**

```ts
// ANTES
import { adminAuthMiddleware } from "./middleware/admin-auth"

export async function middleware(request: NextRequest) {
  const adminAuthResponse = await adminAuthMiddleware(request)
  // ...
}

// DEPOIS
import { supabaseAuthMiddleware } from "./middleware/supabase-auth"

export async function middleware(request: NextRequest) {
  const authResponse = await supabaseAuthMiddleware(request)
  // ...
}
```

## 🔧 Configuração de Variáveis de Ambiente

Certifique-se de que estas variáveis estejam configuradas:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://iwzwbugfyhvinmyuhggl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# OAuth (opcional - para providers sociais)
SUPABASE_AUTH_GOOGLE_CLIENT_ID=seu_google_client_id
SUPABASE_AUTH_GOOGLE_CLIENT_SECRET=seu_google_client_secret
SUPABASE_AUTH_GITHUB_CLIENT_ID=seu_github_client_id
SUPABASE_AUTH_GITHUB_CLIENT_SECRET=seu_github_client_secret
```

## 🧪 Testando a Migração

### 1. Teste de Usuário Normal

```tsx
// Componente de teste
import { UserAuthModal } from '@/components/auth/user-auth-modal'
import { useAuth } from '@/hooks/use-unified-auth'

function TestUser() {
  const { user, signOut } = useAuth()
  
  return (
    <div>
      {user ? (
        <div>
          <p>Logado: {user.email}</p>
          <button onClick={signOut}>Logout</button>
        </div>
      ) : (
        <UserAuthModal trigger={<button>Login</button>} />
      )}
    </div>
  )
}
```

### 2. Teste de Admin

```tsx
import { AdminLoginForm } from '@/components/auth/admin-login-form'
import { useAdminAuth } from '@/hooks/use-admin-auth'

function TestAdmin() {
  const { admin, signOut } = useAdminAuth()
  
  return (
    <div>
      {admin ? (
        <div>
          <p>Admin: {admin.email}</p>
          <button onClick={signOut}>Logout</button>
        </div>
      ) : (
        <AdminLoginForm />
      )}
    </div>
  )
}
```

### 3. Teste de OAuth

1. Configure providers no Supabase Dashboard
2. Use o `UserAuthModal` com botões sociais
3. Teste o fluxo de callback

## ⚠️ Possíveis Problemas e Soluções

### 1. Erro de Cookie no Middleware

**Problema**: `TypeError: Cannot read properties of undefined`

**Solução**: Certifique-se de que o `@supabase/ssr` está instalado:
```bash
npm install @supabase/ssr
```

### 2. OAuth Redirect Loop

**Problema**: Usuário fica em loop de redirect

**Solução**: Verifique se a URL de callback está configurada corretamente no Supabase Dashboard

### 3. Admin Login Não Funciona

**Problema**: Login de admin sempre falha

**Solução**: Verifique se o admin foi criado corretamente:
```sql
SELECT * FROM admin_users WHERE email = 'admin@corretoria.com.br';
```

### 4. Session Persistence

**Problema**: Usuário é deslogado ao recarregar a página

**Solução**: Verifique se os cookies estão sendo configurados corretamente no Supabase client

## 📚 Novos Recursos Disponíveis

### 1. Conditional Rendering

```tsx
import { ConditionalContent } from '@/components/auth/protected-route'

<ConditionalContent showFor="user">
  <UserOnlyContent />
</ConditionalContent>

<ConditionalContent showFor="admin">
  <AdminOnlyContent />
</ConditionalContent>

<ConditionalContent showFor="unauthenticated">
  <LoginPrompt />
</ConditionalContent>
```

### 2. HOCs para Proteção

```tsx
import { withUserAuth, withAdminAuth } from '@/components/auth/protected-route'

const ProtectedUserPage = withUserAuth(UserPage)
const ProtectedAdminPage = withAdminAuth(AdminPage)
```

### 3. Helpers de Validação

```tsx
import { validatePasswordStrength, getAuthErrorMessage } from '@/utils/auth-helpers'

const passwordCheck = validatePasswordStrength('minhasenha123')
console.log(passwordCheck.isValid) // boolean
console.log(passwordCheck.feedback) // array de sugestões
```

### 4. Rate Limiting

```tsx
import { createRateLimiter } from '@/middleware/supabase-auth'

const limiter = createRateLimiter(10, 60000) // 10 requests per minute
```

## ✅ Checklist Final

- [ ] Dependências instaladas (`@supabase/ssr`, `react-icons`)
- [ ] `UnifiedAuthProvider` no layout principal
- [ ] Imports atualizados para novos hooks
- [ ] Middleware atualizado para `supabaseAuthMiddleware`
- [ ] Rotas protegidas migradas para `ProtectedRoute`
- [ ] APIs atualizadas para usar `withAuth`/`withAdminAuth`
- [ ] Callback OAuth configurado (`/auth/callback`)
- [ ] Variáveis de ambiente configuradas
- [ ] Testes de login/logout funcionando
- [ ] OAuth providers configurados (opcional)

## 🎯 Benefícios da Migração

1. **Segurança**: Autenticação baseada em Supabase com tokens seguros
2. **OAuth**: Suporte nativo a Google, GitHub, etc.
3. **Unificação**: Sistema único para users e admins
4. **Manutenibilidade**: Código mais limpo e organizado
5. **Escalabilidade**: Suporte a funcionalidades avançadas (MFA, etc.)
6. **TypeScript**: Tipagem completa e consistente
7. **Server-side**: Renderização segura no servidor
8. **Performance**: Menos overhead e melhor cache

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Verifique os exemplos em `/examples/`
2. Consulte a documentação do Supabase
3. Teste com os componentes de exemplo primeiro
4. Verifique os logs do console para erros específicos

A migração pode ser feita gradualmente, mantendo compatibilidade com o sistema atual durante a transição.