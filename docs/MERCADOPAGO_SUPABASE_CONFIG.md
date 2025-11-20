# ⚡ Configurações do Supabase para Mercado Pago

Este documento contém APENAS as configurações que você precisa fazer no Supabase para que a integração com Mercado Pago funcione.

---

## 📊 1. Executar Migration SQL

Acesse o **SQL Editor** no Supabase Dashboard e execute o arquivo:

**Arquivo**: `lib/supabase/migrations/003_payment_integration.sql`

Ou copie e cole o SQL abaixo:

<details>
<summary>📄 Clique para ver o SQL completo</summary>

```sql
-- Migration 003: Payment Integration with Mercado Pago
-- Created: 2025-10-03

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- 1.1 Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mp_subscription_id TEXT UNIQUE,
  mp_plan_id TEXT,
  mp_payer_id TEXT,
  status TEXT CHECK (status IN ('pending', 'authorized', 'paused', 'canceled')) DEFAULT 'pending',
  payment_method_id TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mp_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_id ON subscriptions(mp_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 1.2 Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mp_payment_id TEXT UNIQUE,
  mp_subscription_id TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')) DEFAULT 'pending',
  status_detail TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT,
  payment_type TEXT,
  webhook_data JSONB,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_mp_payment ON payment_transactions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON payment_transactions(created_at DESC);

-- 1.3 Add subscription fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- ============================================================================
-- 2. FUNCTIONS
-- ============================================================================

-- 2.1 Activate subscription
CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET plan_type = 'pro', subscription_status = 'active', updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE subscriptions
  SET status = 'authorized', updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- 2.2 Cancel subscription
CREATE OR REPLACE FUNCTION cancel_subscription(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET plan_type = 'free', subscription_status = 'cancelled',
      subscription_expires_at = NOW() + INTERVAL '30 days', updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE subscriptions
  SET status = 'canceled', end_date = NOW(), updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- 2.3 Check past due subscriptions
CREATE OR REPLACE FUNCTION check_past_due_subscriptions()
RETURNS INTEGER AS $$
DECLARE affected_count INTEGER;
BEGIN
  UPDATE profiles p
  SET subscription_status = 'past_due', updated_at = NOW()
  FROM subscriptions s
  WHERE p.id = s.user_id
    AND s.status = 'authorized'
    AND s.next_payment_date < NOW() - INTERVAL '5 days'
    AND p.subscription_status = 'active';

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- 2.4 Process expired subscriptions
CREATE OR REPLACE FUNCTION process_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE affected_count INTEGER;
BEGIN
  UPDATE profiles
  SET plan_type = 'free', subscription_status = 'inactive', updated_at = NOW()
  WHERE subscription_expires_at < NOW()
    AND plan_type = 'pro'
    AND subscription_status IN ('cancelled', 'past_due');

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND plan_type = 'admin'
    )
  );

CREATE POLICY "System can manage subscriptions"
  ON subscriptions FOR ALL
  USING (true) WITH CHECK (true);

-- Policies for payment_transactions
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND plan_type = 'admin'
    )
  );

CREATE POLICY "System can insert transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true);
```

</details>

---

## ✅ 2. Verificar Execução

Após executar o SQL, verifique se tudo foi criado corretamente:

### Verificar Tabelas

Execute no SQL Editor:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'payment_transactions')
ORDER BY table_name, ordinal_position;
```

**Esperado**: Você deve ver todas as colunas das duas tabelas.

### Verificar Funções

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'activate_subscription',
    'cancel_subscription',
    'check_past_due_subscriptions',
    'process_expired_subscriptions'
  );
```

**Esperado**: 4 funções listadas.

### Verificar Policies

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('subscriptions', 'payment_transactions');
```

**Esperado**: 6 policies listadas.

---

## 🔑 3. Criar Primeiro Usuário Admin (Opcional)

Se você quiser promover um usuário a admin para gerenciar assinaturas:

```sql
-- Substituir 'seu-email@example.com' pelo email do usuário
UPDATE profiles
SET plan_type = 'admin'
WHERE email = 'seu-email@example.com';
```

Ou via Table Editor:
1. Vá em **Table Editor > profiles**
2. Encontre seu usuário
3. Edite o campo `plan_type` para `admin`

---

## 📊 4. Consultas Úteis

### Ver todas as assinaturas ativas

```sql
SELECT
  p.email,
  s.status,
  s.amount,
  s.next_payment_date
FROM subscriptions s
JOIN profiles p ON s.user_id = p.id
WHERE s.status = 'authorized'
ORDER BY s.created_at DESC;
```

### Ver histórico de pagamentos

```sql
SELECT
  p.email,
  t.status,
  t.amount,
  t.paid_at
FROM payment_transactions t
JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC
LIMIT 20;
```

### Ver receita total

```sql
SELECT
  COUNT(*) as total_subscriptions,
  SUM(amount) as monthly_revenue,
  currency
FROM subscriptions
WHERE status = 'authorized'
GROUP BY currency;
```

---

## 🛠️ 5. Próximos Passos

Após executar essas configurações no Supabase:

1. ✅ Configure as variáveis de ambiente (ver `MERCADOPAGO_SETUP.md`)
2. ✅ Configure o webhook no Mercado Pago
3. ✅ Teste a integração

**Documentação completa**: Ver `MERCADOPAGO_SETUP.md` para instruções detalhadas de setup do Mercado Pago, testes e troubleshooting.

---

## 🚨 Troubleshooting Rápido

### Erro: "relation does not exist"
**Solução**: Execute novamente a migration SQL.

### Erro: "permission denied for relation"
**Solução**: Verifique se as RLS policies foram criadas corretamente.

### Função não funciona
**Solução**:
```sql
-- Adicionar SECURITY DEFINER
ALTER FUNCTION activate_subscription(UUID, UUID) SECURITY DEFINER;
ALTER FUNCTION cancel_subscription(UUID, UUID) SECURITY DEFINER;
```

---

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do SQL Editor
2. Policies de RLS estão ativas
3. Service Role Key está configurada no `.env`

---

**Configuração Supabase Completa** ✅
