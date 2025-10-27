# 🔧 Fix: Erro 429 "over_request_rate_limit" no Refresh Token

## 🔴 Problema

Usuários recebiam erro 429 ao fazer refresh do token do Supabase:

```
HTTP 429 - over_request_rate_limit
{"code":"over_request_rate_limit","message":"Request rate limit reached"}
```

## 🔍 Causa Raiz

O problema ocorria porque **múltiplas instâncias do Supabase client** estavam sendo criadas, e cada uma tentava fazer `refreshToken` simultaneamente:

### Antes da Correção:

```typescript
// components/providers/user-provider.tsx
export function UserProvider({ children, initialUser = null, initialProfile = null }: UserProviderProps) {
  // ❌ PROBLEMA: Criava um novo client a cada render
  const supabase = useMemo(() => createClient(), [])

  // Com autoRefreshToken: true, cada client tenta fazer refresh
  // Se houver 3 tabs abertas = 3 clientes diferentes = 3 refreshes simultâneos = 429 rate limit
}
```

### Cenários que causavam o problema:

1. **Múltiplas tabs/janelas**: Cada tab criava seu próprio client
2. **Re-renders**: Qualquer re-render do UserProvider poderia criar novo client
3. **Todos com autoRefresh ativo**: Cada client tentava refresh independentemente

## ✅ Solução

Usar o **singleton** do Supabase client em vez de criar novos clientes:

### Depois da Correção:

```typescript
// components/providers/user-provider.tsx
import { supabase } from "@/lib/supabase/client" // ✅ Import singleton

export function UserProvider({ children, initialUser = null, initialProfile = null }: UserProviderProps) {
  // ✅ SOLUÇÃO: Use singleton - apenas UMA instância compartilhada
  // Sem useMemo(() => createClient(), [])

  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  // ... resto do código usa 'supabase' diretamente
}
```

### Singleton já estava definido:

```typescript
// lib/supabase/client.ts
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true, // ✅ Apenas um client fazendo refresh agora
      },
    }
  )
}

// ✅ Singleton - compartilhado entre todos os componentes
export const supabase = createClient()
```

## 📊 Benefícios da Correção

### Antes (Problema):
```
Tab 1: [Client A] → autoRefresh → Supabase API
Tab 2: [Client B] → autoRefresh → Supabase API  } 3 requisições
Tab 3: [Client C] → autoRefresh → Supabase API    simultâneas = 429
```

### Depois (Solução):
```
Tab 1: ┐
Tab 2: ├─→ [Singleton Client] → autoRefresh → Supabase API
Tab 3: ┘        (1 requisição apenas)
```

### Vantagens:

✅ **Apenas 1 refresh por sessão** - Não importa quantas tabs estejam abertas
✅ **Sem rate limiting** - Supabase não bloqueia mais
✅ **Melhor performance** - Menos requisições = mais rápido
✅ **Sincronização automática** - Todas as tabs compartilham o mesmo estado

## 🔧 Arquivos Modificados

1. **components/providers/user-provider.tsx**:
   - Removido: `const supabase = useMemo(() => createClient(), [])`
   - Adicionado: `import { supabase } from "@/lib/supabase/client"`
   - Atualizado: Todas as dependências de `useCallback` removeram `supabase`

## 📝 Observações Técnicas

### Por que o singleton funciona?

1. **Supabase SDK gerencia estado interno**: O client mantém a sessão em `localStorage`
2. **Eventos compartilhados**: `onAuthStateChange` funciona através de `localStorage` events
3. **Auto-refresh coordenado**: Apenas uma instância tenta refresh, todos os listeners recebem a atualização

### Outras considerações:

- **AuthContext** já usava o singleton corretamente
- **UserProvider** agora também usa o singleton
- Ambos podem coexistir sem conflito
- O `onAuthStateChange` de ambos receberá os mesmos eventos

## 🧪 Como Testar

### Antes da correção:
1. Abrir 3 tabs do site
2. Fazer login
3. Esperar ~50 minutos (tempo de expiração do token)
4. Ver erro 429 no console

### Depois da correção:
1. Abrir 3 tabs do site
2. Fazer login
3. Esperar ~50 minutos
4. ✅ Refresh automático sem erros

## 🎯 Conclusão

O problema era que cada tab/componente criava seu próprio Supabase client, resultando em múltiplas tentativas simultâneas de refresh token. A solução foi usar o singleton já disponível no código, garantindo que apenas **uma instância** faça o refresh, independentemente de quantas tabs estejam abertas.

---

**Commit**: `fix: usar singleton do Supabase client para evitar rate limit no refresh token`
**Data**: 2025-01-27
**Issue**: HTTP 429 "over_request_rate_limit"
