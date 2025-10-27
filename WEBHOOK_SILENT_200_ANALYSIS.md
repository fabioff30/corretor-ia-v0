# Análise: Webhook Retorna 200 mas Não Processa Pagamento

**Data**: 2025-10-27
**Investigador**: Claude Code
**Pagamento Analisado**: 131487308062
**Usuário de Teste**: viajante14@gmail.com

---

## 🔴 Problema Identificado

O webhook do Mercado Pago está retornando **HTTP 200 OK** (considerado "entregue" no dashboard do MP), mas o pagamento PIX **NÃO está sendo processado internamente**. O status do pagamento no banco permanece `"pending"` mesmo após o webhook ser chamado.

---

## ✅ Fatos Confirmados

| Item | Status | Evidência |
|------|---------|-----------|
| Pagamento aprovado no MP | ✅ | `GET /v1/payments/131487308062` retorna `status: "approved"` |
| Notification URL correta | ✅ | `https://corretordetextoonline.com.br/api/mercadopago/webhook` (sem double slash) |
| Registro PIX existe no banco | ✅ | `payment_intent_id = '131487308062'` encontrado na tabela `pix_payments` |
| RLS policies permitem service role | ✅ | Policy: `auth.jwt()->>'role' = 'service_role'` |
| Webhook retorna 200 ao MP | ✅ | Dashboard do MP mostra "entregue" |
| Pagamento foi processado? | ❌ | Status no banco: `pending` → não foi processado |
| Fixes commitados e pushed | ✅ | Commits `1ebf125` e `debead5` no remote |

---

## ⏰ Timeline dos Eventos

```
18:07:43 UTC → Pagamento criado no Mercado Pago
18:07:44 UTC → Registro PIX criado no banco (1 segundo depois)
18:08:18 UTC → Pagamento aprovado no Mercado Pago
~18:08:18 UTC → Webhook chamado pelo Mercado Pago
~18:08:18 UTC → Webhook retorna 200 OK ao MP
             → Status no banco: AINDA "pending" ❌
```

**Conclusão**: O registro PIX **já existia** há 34 segundos quando o webhook foi chamado. Não é problema de timing ou race condition.

---

## 🏗️ Arquitetura do Webhook

### Por Que Sempre Retorna 200?

O webhook foi projetado para **SEMPRE** retornar 200 OK, mesmo quando há erros internos. Isso evita que o Mercado Pago fique retentando o webhook indefinidamente:

```typescript
// app/api/mercadopago/webhook/route.ts
export async function POST(request: NextRequest) {
  try {
    // ... validações e parsing ...
    await handlePaymentEvent(webhookData.id, body)

    // ✅ SEMPRE retorna 200
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)

    // ⚠️ AINDA retorna 200 mesmo com erro!
    return NextResponse.json(
      { received: true, error: error.message },
      { status: 200 }
    )
  }
}
```

**Implicação**: O status HTTP 200 NÃO garante que o pagamento foi processado. É apenas um ACK ao Mercado Pago.

---

## 🚪 Pontos de Saída Silenciosa

O webhook handler tem **múltiplos pontos** onde pode sair sem processar o pagamento. Cada `return` finaliza a execução sem lançar erro:

| Linha | Condição | Saída Silenciosa |
|-------|----------|------------------|
| **147-150** | `!supabase` | Service role client não criado |
| **170-173** | `!externalReference` | External reference vazio |
| **188-191** | `pixCheckError` | Erro ao buscar PIX payment |
| **193-196** | `!pixPaymentCheck` | **Registro PIX não encontrado** |
| **214-217** | `pixUpdateError` | Erro ao atualizar PIX payment |
| **219-222** | `!pixPayment` | PIX payment null após update |
| **232-241** | `isGuestPayment \|\| !pixPayment.user_id` | Detectado como guest payment |
| **254-257** | `existingSubError` | Erro ao checar subscription |
| **259-262** | `existingSubscription` | **Subscription já existe** |
| **266-269** | `planType` inválido | Plan type não é monthly/annual |

**Impacto**: Webhook retorna 200 ao MP, mas pagamento não é processado. Usuário fica sem acesso Premium.

---

## 🔍 Hipóteses Investigadas

### ❌ Hipótese 1: Double Slash na URL

**Status**: ❌ Descartada

**Teste realizado**:
```bash
curl -s "https://api.mercadopago.com/v1/payments/131487308062" \
  -H "Authorization: Bearer $TOKEN" | grep notification_url

# Resultado: https://corretordetextoonline.com.br/api/mercadopago/webhook
```

**Conclusão**: Fix do double slash funcionou. URL está correta.

---

### ❌ Hipótese 2: Registro PIX Não Existe

**Status**: ❌ Descartada

**Teste realizado**:
```sql
SELECT id, payment_intent_id, user_id, created_at
FROM pix_payments
WHERE payment_intent_id = '131487308062';

-- Resultado: Registro existe, criado em 18:07:44 UTC
```

**Conclusão**: Registro existe e estava presente 34 segundos antes do webhook ser chamado.

---

### ❌ Hipótese 3: RLS Blocking Service Role

**Status**: ❌ Descartada

**Teste realizado**:
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'pix_payments';

-- Policy encontrada:
-- "Service role can manage all pix payments"
-- qual: (auth.jwt() ->> 'role') = 'service_role'
```

**Conclusão**: Service role tem permissão total. Query manual funciona perfeitamente.

---

### ❌ Hipótese 4: Subscription Já Existia

**Status**: ❌ Descartada

**Teste realizado**:
```sql
SELECT id, created_at, status
FROM subscriptions
WHERE user_id = '65afbab7-09f4-4cef-a46d-f040b7640209';

-- Resultado: 1 subscription, criada em 18:13:11 UTC
```

**Conclusão**: Subscription foi criada 5 minutos DEPOIS do webhook (quando ativei manualmente). Não existia durante o webhook.

---

### ❌ Hipótese 5: Guest Payment Detection Incorreta

**Status**: ❌ Descartada

**Evidências**:
- `external_reference`: `65afbab7-09f4-4cef-a46d-f040b7640209` (é o user_id, NÃO começa com "guest_")
- `pixPaymentCheck.user_id`: `65afbab7-09f4-4cef-a46d-f040b7640209` (existe!)

**Lógica do código**:
```typescript
const isGuestPayment = externalReference.startsWith('guest_')  // FALSE ✅
const isGuestPaymentCheck = !pixPaymentCheck.user_id          // FALSE ✅

if (isGuestPayment || !pixPayment.user_id) {  // NÃO deveria entrar aqui
  return
}
```

**Conclusão**: Não deveria ter sido detectado como guest payment. Esta NÃO é a causa.

---

### ⚠️ Hipótese 6: Código Deployado Desatualizado

**Status**: ⚠️ **PROVÁVEL CAUSA RAIZ**

**Evidências a favor**:
- Usuário disse "eu fiz o deploy"
- Git status mostra: `up to date with origin/main`
- Commits com fixes estão no remote:
  - `1ebf125`: fix: resolve webhook 502 errors
  - `debead5`: fix: webhook URL double slash
- **MAS** webhook retornou 200 sem processar

**Possibilidades**:
1. **Deploy ainda propagando**: Webhook foi chamado enquanto deploy estava em andamento
2. **Vercel build cache**: Build usou cache com código antigo
3. **Vercel pegou commit errado**: Por alguma razão, não deployou o último commit

**Como testar**:
```bash
# Forçar novo deploy limpo
vercel --prod --force

# OU via dashboard do Vercel:
# Deployments → Latest → "Redeploy" → ✅ Use existing Build Cache: OFF
```

---

### ⚠️ Hipótese 7: Variável de Ambiente Faltando

**Status**: ⚠️ **POSSÍVEL CAUSA**

**Cenário**:
- Se `SUPABASE_SERVICE_ROLE_KEY` não estiver configurada no Vercel
- `createServiceRoleClient()` pode falhar silenciosamente
- Webhook sairia na linha 150 sem processar:

```typescript
const supabase = createServiceRoleClient()

if (!supabase) {
  console.error('[MP Webhook Payment] Failed to create Supabase client')
  return  // ← Sai aqui sem processar!
}
```

**Como verificar**:
```bash
# Via Vercel CLI
vercel env ls

# OU via dashboard:
# Settings → Environment Variables → Production
```

**Variáveis críticas**:
- `SUPABASE_SERVICE_ROLE_KEY` ← **MAIS IMPORTANTE**
- `NEXT_PUBLIC_SUPABASE_URL`
- `MERCADO_PAGO_ACCESS_TOKEN`

---

## 🎯 Causa Raiz Mais Provável

### Teoria Principal: **Código Deployado vs Código Local**

Acreditamos que o webhook deployado no Vercel **NÃO** contém os fixes mais recentes, mesmo com git mostrando `up to date`. Possíveis razões:

1. **Timing do Deploy**
   - Usuário fez deploy às ~18:00 UTC
   - Pagamento foi criado às 18:07 UTC
   - **MAS**: Deploy do Vercel leva 2-5 minutos para propagar globalmente
   - Webhook pode ter sido roteado para edge location com código antigo

2. **Build Cache do Vercel**
   - Next.js faz cache agressivo de builds
   - Se mudanças foram apenas em `.ts` files (não em `package.json`), cache pode ter sido reutilizado
   - Código antigo permanece em produção

3. **Falta de Variável de Ambiente**
   - `SUPABASE_SERVICE_ROLE_KEY` pode estar ausente ou incorreta
   - `createServiceRoleClient()` retorna null
   - Webhook sai na linha 150 sem logar erro visível

---

## 📋 Próximos Passos Recomendados

### 1. ⚡ URGENTE: Verificar Environment Variables

```bash
# Via CLI
vercel env ls --environment production

# Verificar se existem:
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - MERCADO_PAGO_ACCESS_TOKEN
```

**Se faltando**: Adicionar via dashboard ou CLI e fazer redeploy.

---

### 2. ⚡ URGENTE: Forçar Redeploy Limpo

```bash
# Sem cache
vercel --prod --force

# OU via dashboard:
# Deployments → Latest → "Redeploy" → Desmarcar "Use existing Build Cache"
```

---

### 3. 🔍 Verificar Logs do Vercel

```bash
# Obter última URL de deployment
vercel ls --prod | head -2

# Ver logs (substitua DEPLOYMENT_URL)
vercel logs DEPLOYMENT_URL --since 2h
```

**Procurar por**:
- `[MP Webhook Payment]` - Logs do webhook handler
- `Failed to create Supabase client` - Indica env var faltando
- `PIX payment record not found` - Indica problema na query
- Timestamp: `2025-10-27T18:08:18` (quando webhook foi chamado)

---

### 4. 🧪 Testar com Novo Pagamento PIX

**IMPORTANTE**: Usar **NOVO usuário** de teste (não viajante14@gmail.com, conforme pedido).

```
1. Criar novo usuário: testewebhook01@gmail.com
2. Fazer novo pagamento PIX
3. Monitorar logs do Vercel em tempo real
4. Verificar se webhook processa corretamente
5. Comparar com comportamento anterior
```

---

### 5. 📊 Adicionar Logging Melhorado

Para facilitar debugging futuro, adicionar logs mais detalhados:

```typescript
// No início do handlePaymentEvent
console.log(`[MP Webhook] ========== START ==========`)
console.log(`[MP Webhook] Timestamp: ${new Date().toISOString()}`)
console.log(`[MP Webhook] Payment ID: ${paymentId}`)
console.log(`[MP Webhook] Request ID: ${crypto.randomUUID()}`)

// Em CADA ponto de saída
console.log(`[MP Webhook] EXIT: pixPaymentCheck not found`)
console.log(`[MP Webhook] EXIT: is guest payment`)
console.log(`[MP Webhook] EXIT: subscription already exists`)
// ... etc
```

---

## 🛠️ Solução Temporária (Manual)

Enquanto investigamos a causa raiz, pagamentos podem ser ativados manualmente:

### Via SQL (Service Role):

```sql
-- 1. Atualizar PIX payment
UPDATE pix_payments
SET status = 'paid', paid_at = NOW()
WHERE payment_intent_id = '<PAYMENT_ID>';

-- 2. Criar subscription
INSERT INTO subscriptions (
  user_id, mp_subscription_id, mp_payer_id,
  status, start_date, next_payment_date,
  amount, currency, payment_method_id
) VALUES (
  '<USER_ID>', 'pix_<PAYMENT_ID>', '<PAYER_ID>',
  'authorized', NOW(), NOW() + INTERVAL '1 month',
  14.95, 'BRL', 'pix'
);

-- 3. Ativar subscription
SELECT activate_subscription('<USER_ID>', '<SUBSCRIPTION_ID>');

-- 4. Atualizar profile
UPDATE profiles
SET plan_type = 'pro',
    subscription_status = 'active',
    subscription_expires_at = NOW() + INTERVAL '1 month'
WHERE id = '<USER_ID>';

-- 5. Marcar PIX como consumido
UPDATE pix_payments
SET status = 'consumed'
WHERE payment_intent_id = '<PAYMENT_ID>';
```

### Via API (Frontend):

Se o usuário estiver logado, pode usar o botão "Ativar assinatura" que chama `/api/mercadopago/activate-pix-payment`.

---

## 📝 Recomendação Final

**Causa mais provável**: Código deployado no Vercel está desatualizado OU variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` está faltando.

**Ação imediata**:
1. ✅ Verificar env vars no Vercel (especialmente `SUPABASE_SERVICE_ROLE_KEY`)
2. ✅ Forçar redeploy limpo (sem build cache)
3. ✅ Testar com novo pagamento PIX
4. ✅ Monitorar logs em tempo real

**Se problema persistir**:
- Adicionar logging mais verboso no webhook
- Criar endpoint `/api/mercadopago/webhook/debug` para testes
- Considerar adicionar healthcheck que valida:
  - Service role client funciona
  - Queries ao banco funcionam
  - RLS policies estão corretas

---

## 🔗 Referências

- **Documentos relacionados**:
  - `WEBHOOK_FIX.md` - Fix do double slash
  - `WEBHOOK_502_FIX.md` - Fix do `.maybeSingle()`
  - `PIX_SETUP.md` - Setup completo do PIX

- **Commits relevantes**:
  - `1ebf125` - fix: resolve webhook 502 errors with robust error handling
  - `debead5` - fix: webhook URL double slash causing HTTP 308 redirect

- **Arquivos modificados**:
  - `app/api/mercadopago/webhook/route.ts`
  - `lib/mercadopago/client.ts`
  - `app/api/mercadopago/activate-pix-payment/route.ts`

---

**Status**: 🟡 Em investigação
**Próxima atualização**: Após testar com novo pagamento PIX
