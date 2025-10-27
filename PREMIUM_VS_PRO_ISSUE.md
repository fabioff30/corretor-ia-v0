# ⚠️ PROBLEMA CRÍTICO: plan_type 'premium' vs 'pro'

## 🔴 Problema Identificado

A tabela `profiles` no Supabase tem um CHECK constraint que aceita apenas:
```sql
plan_type TEXT CHECK (plan_type IN ('free', 'pro', 'admin'))
```

**MAS** vários lugares no código tentam usar `plan_type: 'premium'`, o que causará **erro de constraint violation**!

---

## 📍 Locais Afetados

### 1. Webhooks do Stripe
**Arquivo:** `lib/stripe/webhooks.ts:417`
```typescript
plan_type: 'premium',  // ❌ ERRO! Deveria ser 'pro'
```

### 2. Webhook Mercado Pago Subscription
**Arquivo:** `app/api/webhooks/mercadopago-subscription/route.ts:98`
```typescript
plan_type: 'premium',  // ❌ ERRO! Deveria ser 'pro'
```

### 3. Link Guest Payment (Mercado Pago)
**Arquivo:** `app/api/mercadopago/link-guest-payment/route.ts:147`
```typescript
plan_type: 'premium',  // ❌ ERRO! Deveria ser 'pro'
```

### 4. Webhook Mercado Pago
**Arquivo:** `app/api/mercadopago/webhook/route.ts:254`
```typescript
plan_type: 'premium',  // ❌ ERRO! Deveria ser 'pro'
```

### 5. Migration Original (já corrigida)
**Arquivo:** `supabase/migrations/20251027_fix_profiles_trigger.sql` (NÃO USAR)
```sql
plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'pro'))  // ❌ ERRO!
```

---

## ✅ Todas as Correções Aplicadas (2025-10-27)

1. ✅ `app/api/link-guest-payments/route.ts` - Corrigido para usar 'pro'
2. ✅ `lib/stripe/webhooks.ts:416` - Corrigido para usar 'pro' e removido is_pro
3. ✅ `app/api/webhooks/mercadopago-subscription/route.ts:98` - Corrigido para usar 'pro'
4. ✅ `app/api/mercadopago/webhook/route.ts:253` - Corrigido para usar 'pro' e removido is_pro
5. ✅ `app/api/mercadopago/link-guest-payment/route.ts:146` - Corrigido para usar 'pro' e removido is_pro
6. ✅ `supabase/migrations/20251027_fix_profiles_final.sql` - Migration correta aplicada

---

## ✅ Status Final

Todas as referências a `plan_type: 'premium'` e `is_pro: true` foram removidas do código. O sistema agora usa exclusivamente:
- `plan_type: 'pro'` para planos pagos
- `plan_type: 'free'` para planos gratuitos
- `plan_type: 'admin'` para administradores

Nenhum campo `is_pro` é mais utilizado.

---

## 🔍 Como Verificar

Execute esta query no Supabase para ver o constraint atual:
```sql
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname LIKE '%plan_type%';
```

---

## 📝 Impacto

**Se não corrigir:**
- ❌ Pagamentos processados via Stripe → **FALHARÃO ao ativar plano**
- ❌ Pagamentos recorrentes via Mercado Pago → **FALHARÃO ao ativar plano**
- ❌ Usuário paga mas conta fica como FREE
- ❌ Logs mostrarão: `ERROR: new row for relation "profiles" violates check constraint "profiles_plan_type_check"`

**Após corrigir:**
- ✅ Pagamentos ativam plano corretamente
- ✅ profile.plan_type = 'pro'
- ✅ Usuário tem acesso aos recursos premium

---

## 🎯 Prioridade

**CRÍTICO** - Corrigir IMEDIATAMENTE antes de:
1. Ativar pagamentos via Stripe
2. Processar pagamentos recorrentes do Mercado Pago
3. Liberar para produção

---

## 📚 Referências

- Estrutura da tabela: `types/supabase.ts:23`
- CHECK constraint: Definido na criação inicial da tabela profiles
- Documentação: `SUPABASE_SETUP.md:132`

---

**Data do documento:** 2025-10-27
**Status:** ✅ RESOLVIDO - Todas as correções aplicadas
