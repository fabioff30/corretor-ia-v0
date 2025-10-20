# 🚀 Guia Completo: Migração Stripe de Teste para Produção

Este guia vai te ajudar a colocar o sistema de pagamentos do CorretorIA em produção com o Stripe.

---

## ⚠️ IMPORTANTE: Leia Antes de Começar

- ✅ **Certifique-se que seu site está em HTTPS** (obrigatório para Stripe em produção)
- ✅ **Faça backup do banco de dados** antes de qualquer mudança
- ✅ **Teste tudo em staging primeiro** com as chaves de teste
- ✅ **Nunca exponha suas chaves secretas** em commits ou frontend

---

## 📋 Checklist de Pré-Requisitos

- [ ] Conta Stripe criada e verificada
- [ ] Informações bancárias adicionadas ao Stripe (para receber pagamentos)
- [ ] Domínio em produção com HTTPS ativo
- [ ] Acesso ao painel do Stripe Dashboard
- [ ] Acesso às variáveis de ambiente de produção (Vercel/servidor)

---

## 📖 Passo a Passo

### **ETAPA 1: Ativar Modo Live no Stripe**

1. **Acesse o Stripe Dashboard**: https://dashboard.stripe.com
2. **Complete o onboarding**:
   - Clique em "Activate your account" (canto superior direito)
   - Preencha informações da empresa
   - Adicione informações bancárias para receber pagamentos
   - Verifique sua identidade (pode levar 1-2 dias úteis)

3. **Alterne para modo Live**:
   - No canto superior esquerdo, você verá um toggle "Test mode / Live mode"
   - Clique e selecione **"Live mode"**
   - ⚠️ ATENÇÃO: Certifique-se de estar em **Live mode** para os próximos passos!

---

### **ETAPA 2: Criar Produtos e Preços em Produção**

#### 2.1. Criar Produto Premium

1. No dashboard (modo Live), vá em: **Products** → **Add product**
2. Preencha os dados:
   - **Name**: `CorretorIA Premium`
   - **Description**: `Plano premium com correções ilimitadas, análise avançada de IA e histórico completo`
   - **Image**: (opcional) Faça upload do logo do CorretorIA
   - **Pricing model**: `Standard pricing`

#### 2.2. Criar Preço Mensal

1. Na seção **Pricing**, clique em **Add price**:
   - **Price**: `29.90` BRL
   - **Billing period**: `Monthly`
   - **Usage type**: `Licensed`
   - **Payment type**: `Recurring`
   - Clique em **Add price**

2. **Copie o Price ID gerado** (formato: `price_xxxxxxxxxx`)
   - Exemplo: `price_1AB2CD3EF4GH5IJ6K`
   - ⚠️ Salve este ID - você vai precisar dele!

#### 2.3. Criar Preço Anual

1. No mesmo produto, clique em **Add another price**:
   - **Price**: `299.00` BRL
   - **Billing period**: `Yearly`
   - **Usage type**: `Licensed`
   - **Payment type**: `Recurring`
   - Clique em **Add price**

2. **Copie o Price ID gerado**
   - Exemplo: `price_7KL8MN9OP0QR1ST2U`
   - ⚠️ Salve este ID também!

---

### **ETAPA 3: Obter Chaves de API de Produção**

1. No Stripe Dashboard (modo **Live**), vá em: **Developers** → **API keys**

2. **Copie a Publishable Key**:
   - Formato: `pk_live_xxxxxxxxxxxxxxxxxx`
   - Esta chave é pública e vai no frontend

3. **Revele e copie a Secret Key**:
   - Clique em **Reveal live key token**
   - Formato: `sk_live_xxxxxxxxxxxxxxxxxx`
   - ⚠️ **NUNCA compartilhe ou commite esta chave!**

---

### **ETAPA 4: Configurar Webhooks de Produção**

#### 4.1. Criar Endpoint de Webhook

1. No Stripe Dashboard (modo **Live**), vá em: **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. Preencha:
   - **Endpoint URL**: `https://SEU-DOMINIO.com/api/stripe/webhook`
     - Exemplo: `https://corretordetextoonline.com.br/api/stripe/webhook`
   - **Description**: `CorretorIA Production Webhook`
   - **Events to send**: Selecione:
     - ✅ `checkout.session.completed`
     - ✅ `invoice.paid`
     - ✅ `invoice.payment_failed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
   - Clique em **Add endpoint**

4. **Copie o Signing Secret**:
   - Após criar, clique no webhook criado
   - Na seção **Signing secret**, clique em **Reveal**
   - Formato: `whsec_xxxxxxxxxxxxxxxxxx`
   - ⚠️ Salve este secret - você vai precisar!

#### 4.2. Testar Webhook (opcional mas recomendado)

1. No detalhe do webhook, clique em **Send test webhook**
2. Selecione `checkout.session.completed`
3. Verifique se retorna `200 OK`

---

### **ETAPA 5: Configurar Customer Portal (Auto-gerenciamento)**

1. No Stripe Dashboard (modo **Live**), vá em: **Settings** → **Billing** → **Customer portal**
2. Clique em **Activate test link** (ou **Activate** se já estiver em Live)
3. Configure:
   - ✅ **Invoice history**: ON
   - ✅ **Update payment method**: ON
   - ✅ **Cancel subscription**: ON
     - Configure política de cancelamento:
       - **Cancellation behavior**: `Cancel immediately` ou `At period end` (recomendado)
   - ✅ **Customer information**: ON (deixe clientes atualizarem email)
4. Clique em **Save**

---

### **ETAPA 6: Atualizar Variáveis de Ambiente**

#### 6.1. Atualizar arquivo `.env.local` (desenvolvimento)

```bash
# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXX
```

#### 6.2. Atualizar Vercel (produção)

1. **Acesse o dashboard da Vercel**: https://vercel.com/dashboard
2. Selecione seu projeto **corretor-ia**
3. Vá em **Settings** → **Environment Variables**
4. **Atualize ou adicione**:

| Name | Value | Environment |
|------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_XXXXX` | Production |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_XXXXX` | Production, Preview |
| `STRIPE_WEBHOOK_SECRET` | `whsec_XXXXX` | Production |

5. Clique em **Save**
6. **Faça um novo deploy** para aplicar as mudanças:
   - Vá em **Deployments**
   - Clique nos 3 pontinhos do último deploy
   - Clique em **Redeploy**

---

### **ETAPA 7: Atualizar Price IDs no Código**

#### 7.1. Editar `lib/stripe/server.ts`

**Antes (Test Mode)**:
```typescript
export const STRIPE_PRICES = {
  MONTHLY: 'price_1SFxorAaDWyHAlqlbEy1Ozk5', // Test price
  ANNUAL: 'price_1SFxpsAaDWyHAlql8RAud6sp',  // Test price
} as const
```

**Depois (Live Mode)**:
```typescript
export const STRIPE_PRICES = {
  MONTHLY: 'price_XXXXXXXXXXXXX', // Seu price ID mensal de produção
  ANNUAL: 'price_YYYYYYYYYYYYY',  // Seu price ID anual de produção
} as const
```

#### 7.2. Fazer commit e deploy

```bash
git add lib/stripe/server.ts
git commit -m "feat: update Stripe to production price IDs"
git push origin staging  # ou main
```

Aguarde o deploy automático da Vercel.

---

### **ETAPA 8: Testes em Produção**

#### 8.1. Teste de Checkout

1. **Acesse seu site em produção**: `https://SEU-DOMINIO.com/premium`
2. **Faça login** com uma conta de teste (não use conta real ainda!)
3. Clique em **Assinar Mensal** ou **Assinar Anual**
4. **Use um cartão de teste do Stripe**:
   - Número: `4242 4242 4242 4242`
   - Data: Qualquer data futura (ex: `12/25`)
   - CVC: Qualquer 3 dígitos (ex: `123`)
   - CEP: Qualquer (ex: `12345`)

⚠️ **IMPORTANTE**: Em produção, cartões de teste NÃO funcionam! Use este teste apenas se ainda estiver com chaves de teste. Para produção real, você precisará usar um cartão real (pode cancelar logo depois).

#### 8.2. Verificar no Stripe Dashboard

1. Vá em **Payments** → **All transactions**
2. Verifique se o pagamento aparece
3. Vá em **Customers** → veja se o cliente foi criado
4. Vá em **Subscriptions** → veja se a assinatura está ativa

#### 8.3. Verificar no Banco de Dados

1. Acesse o Supabase
2. Vá na tabela `profiles`
3. Verifique se o campo `plan_type` foi atualizado para `"pro"`
4. Vá na tabela `stripe_customers`
5. Verifique se o customer foi criado com o `stripe_customer_id`

#### 8.4. Testar Customer Portal

1. **Acesse o dashboard do site**: `https://SEU-DOMINIO.com/dashboard/subscription`
2. Clique em **Gerenciar Assinatura**
3. Deve abrir o Customer Portal do Stripe
4. Teste:
   - Visualizar faturas
   - Atualizar cartão de crédito
   - Cancelar assinatura (depois reative para testar!)

---

### **ETAPA 9: Configurações Adicionais de Segurança**

#### 9.1. Ativar 3D Secure (SCA - Strong Customer Authentication)

1. No Stripe Dashboard, vá em **Settings** → **Payment methods**
2. Certifique-se que **3D Secure** está ativado
3. Configure para **Adaptive** (recomendado)

#### 9.2. Configurar Retry de Pagamentos Falhados

1. Vá em **Settings** → **Billing** → **Subscriptions and emails**
2. Configure **Smart Retries**: ON
3. Configure tentativas:
   - 1ª tentativa: 3 dias após falha
   - 2ª tentativa: 5 dias após 1ª tentativa
   - 3ª tentativa: 7 dias após 2ª tentativa
4. **Email notifications**: ON (avisa clientes sobre falhas)

#### 9.3. Configurar Emails Automáticos

1. Vá em **Settings** → **Billing** → **Emails**
2. Ative:
   - ✅ **Successful payments**
   - ✅ **Failed payments**
   - ✅ **Upcoming invoices** (3 dias antes)
   - ✅ **Subscription cancellations**

---

### **ETAPA 10: Monitoramento e Logs**

#### 10.1. Configurar Alertas no Stripe

1. Vá em **Settings** → **Notifications**
2. Configure notificações por email para:
   - ✅ **Failed payments**
   - ✅ **Disputes**
   - ✅ **Refunds**

#### 10.2. Verificar Logs de Webhook

1. Vá em **Developers** → **Webhooks**
2. Clique no seu webhook de produção
3. Veja a aba **Logs** para verificar eventos recebidos
4. ⚠️ Se vir muitos erros (400, 500), investigue!

---

## 🎯 Checklist Final Antes de Ir ao Ar

- [ ] Stripe em modo **Live** ativado e verificado
- [ ] Produtos e preços criados em produção
- [ ] Price IDs atualizados no código e deployed
- [ ] Chaves de API de produção configuradas (secret, publishable, webhook)
- [ ] Webhook de produção configurado e testado
- [ ] Customer Portal ativado e configurado
- [ ] Variáveis de ambiente atualizadas na Vercel
- [ ] Site em HTTPS funcionando
- [ ] Teste de checkout completo realizado
- [ ] Banco de dados sendo atualizado corretamente após pagamento
- [ ] Emails automáticos do Stripe configurados
- [ ] Informações bancárias adicionadas para receber pagamentos

---

## 🚨 Problemas Comuns e Soluções

### Erro: "No such price: price_xxxxx"

**Causa**: Price ID de teste sendo usado em modo Live (ou vice-versa)

**Solução**:
1. Verifique se está em modo Live no Stripe
2. Confirme que os price IDs em `lib/stripe/server.ts` são de produção
3. Faça redeploy do código

### Webhook retorna 400/500

**Causa**: Webhook secret incorreto ou URL inválida

**Solução**:
1. Verifique se `STRIPE_WEBHOOK_SECRET` está correta no Vercel
2. Teste manualmente: `Send test webhook` no Stripe Dashboard
3. Verifique logs em `/api/stripe/webhook` (adicione console.log se necessário)

### Pagamento aprovado mas plano não atualiza

**Causa**: Webhook não sendo processado ou erro no handler

**Solução**:
1. Vá em **Developers** → **Webhooks** → veja os logs
2. Verifique se evento `checkout.session.completed` foi recebido
3. Verifique tabela `profiles` no Supabase manualmente
4. Rode o handler do webhook manualmente para debug

### Customer Portal não abre

**Causa**: Portal não ativado ou URL incorreta

**Solução**:
1. Ative o Customer Portal em **Settings** → **Billing** → **Customer portal**
2. Verifique se `createPortalSession()` está sendo chamado corretamente
3. Verifique se o `customer_id` existe no Stripe

---

## 📊 Métricas para Monitorar

Após colocar em produção, monitore:

1. **Taxa de conversão**: Visitas → Checkouts → Pagamentos
2. **Taxa de falha de pagamento**: Deve ser <5%
3. **Taxa de cancelamento (churn)**: Objetivo <5%/mês
4. **MRR (Monthly Recurring Revenue)**: Receita mensal recorrente
5. **LTV (Lifetime Value)**: Valor médio por cliente

Acesse **Reports** no Stripe Dashboard para visualizar estas métricas.

---

## 🆘 Suporte

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Status do Stripe**: https://status.stripe.com
- **CorretorIA Issues**: suporte@corretordetextoonline.com.br

---

## 📝 Notas Importantes

1. **Compliance**: Certifique-se de estar em conformidade com as leis locais de tributação
2. **Impostos**: Configure impostos se necessário em **Settings** → **Tax**
3. **Reembolsos**: Configure política de reembolso clara
4. **LGPD**: Garanta que está coletando consentimento adequado para processar dados de pagamento
5. **Backup**: Faça backup regular da tabela `stripe_customers` e `profiles`

---

**✅ Pronto! Seu sistema de pagamentos está configurado para produção!**

🎉 Boa sorte com os lançamentos e vendas do CorretorIA Premium!
