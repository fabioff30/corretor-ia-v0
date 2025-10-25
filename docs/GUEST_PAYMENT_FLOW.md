# Guest Payment Flow - Pagamento sem Login

Este documento descreve o novo fluxo de pagamento que permite usuários não logados realizarem pagamentos PIX e vincularem posteriormente à sua conta.

## 📋 Visão Geral

O novo fluxo permite que usuários:
1. Realizem pagamento PIX **sem precisar fazer login primeiro**
2. Após o pagamento, criem conta ou façam login com o email usado no pagamento
3. Tenham a assinatura premium **automaticamente vinculada** à conta

## 🔄 Fluxo Detalhado

### 1. Usuário Não Logado Clica em "Pagar com PIX"

**Componente**: `components/premium-plan.tsx`

```typescript
// Se não estiver logado, abre dialog para pedir email
if (!user) {
  setPendingPlanType(planType)
  setIsEmailDialogOpen(true)
  return
}
```

### 2. Dialog Pede Email do Usuário

**UI**: Dialog modal com campo de email

```typescript
<Dialog open={isEmailDialogOpen}>
  <Input
    type="email"
    placeholder="seu@email.com"
    value={guestEmail}
    onChange={(e) => setGuestEmail(e.target.value)}
  />
</Dialog>
```

### 3. Criação do Pagamento Guest

**API**: `POST /api/mercadopago/create-pix-payment`

```typescript
// Request body
{
  planType: 'monthly' | 'annual',
  guestEmail: 'usuario@exemplo.com'
}

// Response
{
  paymentId: '123456789',
  qrCode: 'base64...',
  qrCodeText: '00020126...',
  amount: 29.90
}
```

**Banco de Dados**: Registro criado na tabela `pix_payments`

```sql
INSERT INTO pix_payments (
  user_id,          -- NULL para guest payments
  email,            -- email do guest
  payment_intent_id,
  amount,
  plan_type,
  status,           -- 'pending'
  ...
)
```

### 4. Usuário Paga o PIX

**Webhook**: `POST /api/mercadopago/webhook`

Quando o pagamento é confirmado:

```typescript
// Atualiza status do pagamento
UPDATE pix_payments
SET status = 'paid', paid_at = NOW()
WHERE payment_intent_id = '...'

// Para guest payments (user_id IS NULL):
// NÃO cria subscription ainda
// Apenas marca como pago e aguarda vinculação
```

### 5. Usuário Cria Conta ou Faz Login

**Componente**: `contexts/auth-context.tsx`

```typescript
// Listener de autenticação detecta login/signup
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
    // Chama API para vincular pagamentos guest
    await fetch('/api/mercadopago/link-guest-payment', {
      method: 'POST'
    })
  }
})
```

### 6. Vinculação Automática do Pagamento

**API**: `POST /api/mercadopago/link-guest-payment`

Processo:
1. Busca pagamentos pagos sem `user_id` que tenham o email do usuário logado
2. Vincula o `user_id` ao pagamento
3. Cria a subscription para o usuário
4. Ativa o plano premium

```sql
-- 1. Vincular pagamento
UPDATE pix_payments
SET user_id = '...', linked_to_user_at = NOW()
WHERE email = '...' AND user_id IS NULL AND status = 'paid'

-- 2. Criar subscription
INSERT INTO subscriptions (
  user_id,
  mp_subscription_id,
  status,
  ...
)

-- 3. Ativar premium
UPDATE profiles
SET is_pro = true, plan_type = 'premium', subscription_status = 'active'
WHERE id = '...'
```

## 🗄️ Estrutura do Banco de Dados

### Migration: `20251025_allow_guest_pix_payments.sql`

Mudanças na tabela `pix_payments`:

```sql
-- user_id agora é nullable
ALTER TABLE pix_payments ALTER COLUMN user_id DROP NOT NULL;

-- Novo campo: email para guest payments
ALTER TABLE pix_payments ADD COLUMN email TEXT;

-- Novo campo: timestamp de vinculação
ALTER TABLE pix_payments ADD COLUMN linked_to_user_at TIMESTAMPTZ;

-- Constraint: deve ter user_id OU email
ALTER TABLE pix_payments
ADD CONSTRAINT pix_payments_user_or_email_check
CHECK (user_id IS NOT NULL OR email IS NOT NULL);
```

## 🔑 Endpoints da API

### POST `/api/mercadopago/create-pix-payment`

**Autenticação**: Opcional (aceita guest)

**Body**:
```json
{
  "planType": "monthly" | "annual" | "test",
  "guestEmail": "usuario@exemplo.com"  // Required se não estiver logado
}
```

### POST `/api/mercadopago/link-guest-payment`

**Autenticação**: Required

**Resposta**:
```json
{
  "linked": true,
  "message": "Guest payment(s) successfully linked to your account",
  "payments": [
    {
      "paymentId": "123456789",
      "amount": 29.90,
      "planType": "monthly",
      "paidAt": "2025-01-24T10:30:00Z"
    }
  ]
}
```

### GET `/api/mercadopago/link-guest-payment`

**Autenticação**: Required

**Resposta**:
```json
{
  "hasPendingPayments": true,
  "count": 1,
  "payments": [...]
}
```

## 📱 Componentes Modificados

### `components/premium-plan.tsx`

- ✅ Removida verificação de login obrigatória
- ✅ Adicionado dialog para pedir email (guest)
- ✅ Adicionada função `handleGuestPixPayment()`
- ✅ Tracking separado para pagamentos guest no GTM

### `hooks/use-pix-payment.ts`

- ✅ Parâmetros tornados opcionais: `userId?`, `userEmail?`
- ✅ Novo parâmetro: `guestEmail?`
- ✅ Tracking diferenciado para guest vs autenticado

### `contexts/auth-context.tsx`

- ✅ Adicionada chamada automática ao endpoint de vinculação após login
- ✅ Refresh automático dos dados do usuário após vinculação

## 🧪 Testando o Fluxo

### Cenário 1: Guest Payment + Novo Cadastro

1. **Guest**: Acesse `/premium` sem login
2. **Guest**: Clique em "Pagar com PIX"
3. **Guest**: Insira email: `teste@exemplo.com`
4. **Guest**: Pague o PIX gerado
5. **Guest**: Aguarde confirmação (webhook marca como `paid`)
6. **Usuário**: Registre-se com email `teste@exemplo.com`
7. **Sistema**: Automaticamente vincula pagamento e ativa premium

### Cenário 2: Guest Payment + Login Existente

1. **Guest**: Acesse `/premium` sem login
2. **Guest**: Clique em "Pagar com PIX"
3. **Guest**: Insira email: `usuario-existente@exemplo.com`
4. **Guest**: Pague o PIX
5. **Usuário**: Faça login com `usuario-existente@exemplo.com`
6. **Sistema**: Automaticamente vincula pagamento e ativa premium

### Cenário 3: Usuário Logado (Fluxo Original)

1. **Usuário**: Faça login
2. **Usuário**: Acesse `/premium`
3. **Usuário**: Clique em "Pagar com PIX"
4. **Sistema**: Cria pagamento diretamente vinculado ao user_id
5. **Usuário**: Pague o PIX
6. **Sistema**: Ativa premium imediatamente via webhook

## 🔒 Segurança

### Validações Implementadas

1. **Validação de Email**: Regex no frontend e backend
2. **Autenticação JWT**: Endpoint de vinculação requer autenticação
3. **Verificação de Email**: Apenas pagamentos com o mesmo email são vinculados
4. **Idempotência**: Não cria subscription duplicada se usuário já tiver uma ativa
5. **Service Role**: Operações de banco usando service role client

### Logs e Monitoramento

```typescript
// Todos os eventos são logados:
console.log('[MP PIX] Creating guest payment for email:', email)
console.log('[MP Webhook] Guest PIX payment approved:', { paymentId, email })
console.log('[Link Guest Payment] Successfully linked payment:', { userId, paymentId })
console.log('[Auth] Guest payment(s) linked successfully:', payments)
```

## 📊 Analytics (GTM)

Eventos trackados:

```typescript
// Iniciação de pagamento guest
sendGTMEvent('pix_payment_initiated', {
  plan: 'monthly',
  guest: true
})

// Pagamento criado com sucesso
sendGTMEvent('pix_payment_created', {
  payment: 'anonymized_id',
  plan: 'monthly',
  amount: 29.90,
  guest: true
})

// Erro em pagamento guest
sendGTMEvent('pix_payment_error', {
  error: 'message',
  plan: 'monthly',
  guest: true
})
```

## 🚀 Deploy

### Migrações Necessárias

Executar migration no Supabase:

```bash
# Production
supabase db push

# Ou via SQL editor:
# Executar: supabase/migrations/20251025_allow_guest_pix_payments.sql
```

### Variáveis de Ambiente

Nenhuma nova variável necessária. Usa as existentes:
- `MERCADO_PAGO_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## ❓ FAQ

### O que acontece se o usuário nunca criar conta?

O pagamento fica marcado como `paid` no banco mas nunca é vinculado. Após 30 dias, pode ser considerado como "doação" ou processado manualmente pelo suporte.

### E se o usuário usar email diferente para criar conta?

O pagamento não será vinculado automaticamente. Usuário pode entrar em contato com suporte para vinculação manual.

### O pagamento guest expira?

Sim, o QR Code PIX expira em 30 minutos como os pagamentos normais.

### Pode haver múltiplos pagamentos guest para o mesmo email?

Sim, mas apenas o mais recente será vinculado automaticamente. Os demais podem ser vinculados pelo suporte.

## 🔗 Referências

- Migration: `supabase/migrations/20251025_allow_guest_pix_payments.sql`
- API Create: `app/api/mercadopago/create-pix-payment/route.ts`
- API Link: `app/api/mercadopago/link-guest-payment/route.ts`
- Webhook: `app/api/mercadopago/webhook/route.ts`
- Auth Context: `contexts/auth-context.tsx`
- Component: `components/premium-plan.tsx`
- Hook: `hooks/use-pix-payment.ts`
