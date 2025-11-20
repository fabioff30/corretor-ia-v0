# 💳 Guia de Configuração - Mercado Pago

Este guia contém todas as instruções para configurar pagamentos com Mercado Pago no CorretorIA.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configuração no Mercado Pago](#configuração-no-mercado-pago)
3. [Configuração no Supabase](#configuração-no-supabase)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Testando a Integração](#testando-a-integração)
6. [Troubleshooting](#troubleshooting)

---

## 1. Visão Geral

### Arquitetura da Integração

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  CorretorIA Frontend                    │
│  - /premium (botão "Assinar Agora")     │
│  - /dashboard/subscription (gerenciar)  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  API Routes                             │
│  - POST /api/mercadopago/create         │
│  - POST /api/mercadopago/webhook        │
│  - POST /api/mercadopago/cancel         │
└──────┬─────────┬────────────────────────┘
       │         │
       ▼         ▼
   ┌──────┐  ┌─────────┐
   │  MP  │  │Supabase │
   │ API  │  │   DB    │
   └──────┘  └─────────┘
```

### Fluxo de Assinatura

1. Usuário clica em "Assinar Agora" em `/premium`
2. Frontend chama `POST /api/mercadopago/create-subscription`
3. API cria assinatura no Mercado Pago e salva no Supabase
4. Usuário é redirecionado para checkout do Mercado Pago
5. Após pagamento, Mercado Pago envia webhook
6. Webhook valida assinatura HMAC e processa evento
7. Sistema ativa plano Premium do usuário
8. Usuário ganha acesso aos recursos ilimitados

---

## 2. Configuração no Mercado Pago

### 2.1 Criar Conta no Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma conta de vendedor (pessoa física ou jurídica)
3. Ative sua conta seguindo as instruções de verificação

### 2.2 Obter Credenciais

1. Acesse o [Dashboard de Desenvolvedores](https://www.mercadopago.com.br/developers/panel)
2. Vá em **Suas integrações > Criar aplicação**
3. Preencha:
   - **Nome**: `CorretorIA Subscriptions`
   - **Descrição**: `Sistema de assinaturas do CorretorIA`
   - **Categoria**: SaaS/Assinaturas
4. Após criar, vá em **Credenciais de produção**
5. Copie:
   - **Access Token** (será `MERCADO_PAGO_ACCESS_TOKEN`)
   - **Public Key** (será `MERCADO_PAGO_PUBLIC_KEY`)

⚠️ **IMPORTANTE**: Nunca compartilhe seu Access Token!

### 2.3 Configurar Webhook

1. No Dashboard, vá em **Notificações > Webhooks**
2. Clique em **Adicionar webhook de produção**
3. Configure:
   - **URL**: `https://www.corretordetextoonline.com.br/api/mercadopago/webhook`
   - **Eventos**: Selecione:
     - ✅ `payment` (pagamentos)
     - ✅ `subscription` (assinaturas)
4. Clique em **Salvar**
5. **IMPORTANTE**: Copie o **Secret Signature** gerado (será `MERCADO_PAGO_WEBHOOK_SECRET`)

### 2.4 Testar em Sandbox (Opcional)

Para testar antes de produção:

1. Use as **Credenciais de teste** ao invés de produção
2. Configure webhook de teste: `https://SEU-DOMINIO/api/mercadopago/webhook`
3. Use cartões de teste: [Lista de cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)

**Cartão de teste aprovado**:
- **Número**: 5031 4332 1540 6351
- **CVV**: 123
- **Validade**: 11/25
- **Nome**: APRO

---

## 3. Configuração no Supabase

### 3.1 Executar Migration

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com)
2. Vá em **SQL Editor**
3. Copie e execute o conteúdo de: `lib/supabase/migrations/003_payment_integration.sql`
4. Verifique se todas as tabelas foram criadas:
   - `subscriptions`
   - `payment_transactions`
   - Campos adicionados em `profiles`: `subscription_status`, `subscription_expires_at`

### 3.2 Verificar Tabelas

Execute no SQL Editor para confirmar:

```sql
-- Verificar estrutura das tabelas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'payment_transactions')
ORDER BY table_name, ordinal_position;

-- Verificar funções criadas
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

### 3.3 Verificar RLS Policies

```sql
-- Listar policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('subscriptions', 'payment_transactions');
```

---

## 4. Variáveis de Ambiente

### 4.1 Arquivo `.env.local` (Desenvolvimento)

Crie/atualize `.env.local`:

```env
# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADO_PAGO_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxxxx-xxxx-xxxx-xxxxxxxxxxxx

# Supabase (já existentes)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxx

# Outras variáveis existentes...
```

### 4.2 Vercel (Produção)

1. Acesse o [Dashboard da Vercel](https://vercel.com)
2. Vá em **Settings > Environment Variables**
3. Adicione as variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `MERCADO_PAGO_ACCESS_TOKEN` | `APP_USR-...` | Production, Preview |
| `MERCADO_PAGO_PUBLIC_KEY` | `APP_USR-...` | Production, Preview |
| `MERCADO_PAGO_WEBHOOK_SECRET` | `xxxxxx` | Production, Preview |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | `APP_USR-...` | Production, Preview |

4. **Redeploy** a aplicação

### 4.3 Validação

O arquivo `utils/env-config.ts` já está configurado para ler essas variáveis:

```typescript
// Lado do servidor
const config = getServerConfig()
console.log(config.MERCADO_PAGO_ACCESS_TOKEN) // ✅

// Lado do cliente (apenas public keys)
const publicConfig = getPublicConfig()
console.log(publicConfig.APP_URL) // ✅
```

---

## 5. Testando a Integração

### 5.1 Checklist de Pré-teste

- [ ] Migrations executadas no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook configurado no Mercado Pago
- [ ] Build da aplicação sem erros (`pnpm build`)
- [ ] Deploy realizado

### 5.2 Teste de Criação de Assinatura

1. Acesse `/premium`
2. Clique em "Assinar Agora"
3. **Esperado**:
   - Redirecionamento para checkout do Mercado Pago
   - Registro criado em `subscriptions` com status `pending`

**Verificar no Supabase**:
```sql
SELECT * FROM subscriptions
WHERE user_id = 'SEU-USER-ID'
ORDER BY created_at DESC
LIMIT 1;
```

### 5.3 Teste de Pagamento

1. No checkout do MP, use um cartão de teste (sandbox) ou real (produção)
2. Complete o pagamento
3. **Esperado**:
   - Webhook recebido em `/api/mercadopago/webhook`
   - Registro em `payment_transactions` com status `approved`
   - `subscriptions.status` atualizado para `authorized`
   - `profiles.plan_type` atualizado para `pro`
   - `profiles.subscription_status` = `active`

**Verificar no Supabase**:
```sql
-- Ver transação
SELECT * FROM payment_transactions
WHERE user_id = 'SEU-USER-ID'
ORDER BY created_at DESC
LIMIT 1;

-- Ver perfil atualizado
SELECT id, plan_type, subscription_status
FROM profiles
WHERE id = 'SEU-USER-ID';
```

### 5.4 Teste de Cancelamento

1. Acesse `/dashboard/subscription`
2. Clique em "Cancelar Assinatura"
3. Confirme o cancelamento
4. **Esperado**:
   - `subscriptions.status` = `canceled`
   - `profiles.plan_type` = `free` (após período de graça)
   - `profiles.subscription_expires_at` = data futura (30 dias)

### 5.5 Verificar Logs

**Ver logs de webhook no Vercel**:
1. Vá em **Deployments > [latest] > Functions**
2. Clique em `/api/mercadopago/webhook`
3. Veja logs em tempo real

**Ver logs no Mercado Pago**:
1. Dashboard > **Notificações > Webhooks**
2. Ver histórico de envios
3. Status esperado: `200 OK`

---

## 6. Troubleshooting

### Erro: "Webhook signature validation failed"

**Causa**: Secret do webhook incorreto ou headers faltando

**Solução**:
1. Verifique `MERCADO_PAGO_WEBHOOK_SECRET` no `.env`
2. Confirme que o webhook está configurado no MP
3. Verifique logs: `console.log('x-signature:', xSignature)`

### Erro: "Failed to create subscription"

**Causa**: Access Token inválido ou expirado

**Solução**:
1. Regenere o Access Token no Dashboard do MP
2. Atualize `MERCADO_PAGO_ACCESS_TOKEN`
3. Redeploy da aplicação

### Erro: "User not found or unauthorized"

**Causa**: Usuário não autenticado ou não existe no Supabase

**Solução**:
1. Verifique se o usuário está logado
2. Confirme que o perfil existe em `profiles`
3. Verifique RLS policies

### Webhook não está sendo recebido

**Causa**: URL incorreta ou firewall bloqueando

**Solução**:
1. Confirme URL no Dashboard do MP: `https://corretordetextoonline.com.br/api/mercadopago/webhook`
2. Teste manualmente com cURL:
```bash
curl -X POST https://corretordetextoonline.com.br/api/mercadopago/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123"}}'
```

### Pagamento aprovado mas usuário não virou Premium

**Causa**: Webhook não processou corretamente ou função falhou

**Solução**:
1. Verifique logs do webhook
2. Execute manualmente a ativação:
```sql
SELECT activate_subscription(
  'user-id-here'::UUID,
  'subscription-id-here'::UUID
);
```

### Assinatura cancelada mas usuário ainda tem acesso

**Causa**: Período de graça ativo

**Solução**: Isso é esperado! Usuário mantém acesso até `subscription_expires_at`

Para revogar imediatamente (somente se necessário):
```sql
UPDATE profiles
SET plan_type = 'free',
    subscription_status = 'inactive',
    subscription_expires_at = NOW()
WHERE id = 'user-id';
```

---

## 7. Manutenção e Monitoramento

### 7.1 Verificar Assinaturas Ativas

```sql
SELECT COUNT(*) as total_active_subscriptions
FROM subscriptions
WHERE status = 'authorized';
```

### 7.2 Verificar Receita Mensal

```sql
SELECT
  SUM(amount) as monthly_revenue,
  currency
FROM subscriptions
WHERE status = 'authorized'
GROUP BY currency;
```

### 7.3 Processar Assinaturas Expiradas (Cron Job)

Configure um cron job para executar diariamente:

```sql
-- Verificar e marcar assinaturas atrasadas
SELECT check_past_due_subscriptions();

-- Processar assinaturas expiradas
SELECT process_expired_subscriptions();
```

**No Vercel (Cron)**:
Crie `/app/api/cron/process-subscriptions/route.ts`:
```typescript
export async function GET() {
  const supabase = createServiceRoleClient()

  await supabase.rpc('check_past_due_subscriptions')
  await supabase.rpc('process_expired_subscriptions')

  return Response.json({ success: true })
}
```

Configure em `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-subscriptions",
    "schedule": "0 2 * * *"
  }]
}
```

---

## 8. Segurança

### ✅ Boas Práticas Implementadas

- ✅ Validação HMAC-SHA256 de webhooks
- ✅ Verificação de timestamp (15 min max)
- ✅ Service Role Key apenas no servidor
- ✅ RLS policies no Supabase
- ✅ Sanitização de dados de webhook
- ✅ Logs de auditoria em `payment_transactions`

### ⚠️ Nunca Faça

- ❌ Expor `MERCADO_PAGO_ACCESS_TOKEN` no cliente
- ❌ Desabilitar validação de webhook em produção
- ❌ Confiar em dados do cliente sem verificação
- ❌ Usar credenciais de teste em produção

---

## 9. Recursos Adicionais

- [Documentação Mercado Pago Subscriptions](https://www.mercadopago.com.br/developers/pt/docs/subscriptions)
- [Webhooks do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Criado para o projeto CorretorIA** 🚀

✅ Integração completa com Mercado Pago
✅ Sistema de assinaturas recorrentes
✅ Pagamentos seguros e validados
✅ Gerenciamento de planos Premium
