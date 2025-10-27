# 🔧 Como Configurar Auth Hook no Supabase

## ⚠️ OBRIGATÓRIO: Configure para auto-criação de profiles

Após aplicar a migration `20251027_fix_profiles_final.sql`, você **PRECISA** configurar um Auth Hook no Supabase para que novos usuários tenham profiles criados automaticamente.

---

## 📋 Passo a Passo

### 1. Acesse Authentication Hooks

1. Abra o dashboard do Supabase
2. Navegue para: **Authentication → Hooks**
3. URL: `https://supabase.com/dashboard/project/[SEU_PROJETO_ID]/auth/hooks`

### 2. Habilite Hooks (se necessário)

Se aparecer um botão **"Enable Hooks"**, clique nele primeiro.

### 3. Crie um Novo Hook

Clique em **"Add a new hook"** ou **"Create Hook"**

Preencha:
- **Hook name:** `create_profile_on_signup`
- **Event:** Selecione `auth.users` → **INSERT**
- **Type:** `PostgreSQL Function`
- **Schema:** `public`
- **Function name:** `handle_new_user`
- **Enable this hook:** ✅ (marcado)

### 4. Salvar

Clique em **"Create hook"** ou **"Save"**

---

## 🧪 Como Testar

Após configurar o hook:

1. Crie um novo usuário via signup
2. Verifique na tabela `profiles` se o profile foi criado automaticamente
3. Confirme que o email está correto

### Query para verificar:
```sql
SELECT
  au.id,
  au.email as auth_email,
  p.email as profile_email,
  p.full_name,
  p.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 5;
```

Todos os usuários devem ter profile (sem NULL).

---

## ❌ Troubleshooting

### Hook não aparece na lista?
- Verifique se você tem permissões de admin no projeto
- Tente atualizar a página do dashboard

### Função não aparece na lista?
- Execute a migration novamente
- Verifique se a função existe:
  ```sql
  SELECT routine_name
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';
  ```

### Profile não é criado automaticamente?
- Verifique se o hook está **enabled** (✅)
- Verifique os logs do Supabase para erros
- Teste manualmente:
  ```sql
  SELECT public.create_profile_for_user('USER_UUID_AQUI');
  ```

---

## 📚 Referências

- [Supabase Auth Hooks Documentation](https://supabase.com/docs/guides/auth/auth-hooks)
- Migration aplicada: `supabase/migrations/20251027_fix_profiles_final.sql`
- Função criada: `public.handle_new_user()`

---

**Data:** 2025-10-27
**Status:** ✅ CONCLUÍDO - Trigger ativo no banco de dados

---

## ✅ STATUS ATUAL

O trigger `on_auth_user_created` foi criado com sucesso via MCP do Supabase e está **ATIVO**.

### Verificação:
```sql
SELECT tgname, tgenabled, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';
```

**Resultado:**
- Trigger: `on_auth_user_created`
- Status: `O` (enabled)
- Definição: `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()`

### Sincronização:
- 26 auth.users
- 26 profiles
- 0 missing profiles ✅

**Conclusão:** Não é necessário configurar nada no dashboard. O trigger está funcionando via PostgreSQL diretamente.
