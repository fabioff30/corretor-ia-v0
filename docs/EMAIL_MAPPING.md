# 📧 Mapeamento Completo de Emails - CorretorIA

Documentação completa de todos os emails enviados pelo sistema, seus gatilhos, e fluxos.

---

## 📋 Índice

1. [Templates Disponíveis](#templates-disponíveis)
2. [Emails por Fluxo](#emails-por-fluxo)
3. [Configuração de Envio](#configuração-de-envio)
4. [Detalhamento por Email](#detalhamento-por-email)
5. [Webhooks e Integrações](#webhooks-e-integrações)

---

## 📨 Templates Disponíveis

O sistema possui **5 templates de email** implementados:

| Template | ID | Função | Status |
|----------|----|---------| ------ |
| **Boas-vindas** | `welcome` | `sendWelcomeEmail()` | ✅ Ativo |
| **Upgrade Premium** | `premium-upgrade` | `sendPremiumUpgradeEmail()` | ✅ Ativo |
| **Pagamento Aprovado** | `payment-approved` | `sendPaymentApprovedEmail()` | ✅ Ativo |
| **Cancelamento** | `cancellation` | `sendCancellationEmail()` | ✅ Ativo |
| **Recuperação de Senha** | `password-reset` | `sendPasswordResetEmail()` | ✅ Ativo |

**Localização dos templates:** `lib/email/templates.ts`
**Funções de envio:** `lib/email/send.ts`
**Provedor:** Brevo (via `lib/email/brevo.ts`)

---

## 🔄 Emails por Fluxo

### 1️⃣ **Fluxo de Cadastro**

#### 1.1 Cadastro via Email/Senha
```
Usuário preenche formulário de cadastro
    ↓
POST /api/auth/signup (Supabase Auth)
    ↓
❌ NÃO ENVIA EMAIL AUTOMÁTICO
```

**Status Atual:** ❌ **Não implementado**
**Motivo:** Email de boas-vindas não está integrado ao fluxo de cadastro padrão

**Sugestão de Implementação:**
```typescript
// Em contexts/auth-context.tsx, após signUp bem-sucedido:
if (data.user?.email) {
  await fetch('/api/emails/welcome', {
    method: 'POST',
    body: JSON.stringify({
      email: data.user.email,
      name: name || data.user.user_metadata?.name
    })
  })
}
```

#### 1.2 Cadastro via Google OAuth
```
Usuário clica "Continuar com Google"
    ↓
Redirect para Google OAuth
    ↓
Callback: /auth/callback
    ↓
Trigger: handle_new_user() (database)
    ↓
❌ NÃO ENVIA EMAIL AUTOMÁTICO
```

**Status Atual:** ❌ **Não implementado**
**Trigger de Database:** Existe `handle_new_user()` mas não envia emails

---

### 2️⃣ **Fluxo de Pagamento PIX (Mercado Pago)**

#### 2.1 Pagamento PIX Sem Conta (Guest)
```
Usuário sem login clica "Pagar com PIX"
    ↓
Abre RegisterForPixDialog
    ↓
Usuário cria conta (email ou Google)
    ↓
✅ ENVIA: Email de Boas-vindas
    ↓
Gera QR Code PIX
    ↓
[Usuário paga PIX]
    ↓
Webhook: /api/mercadopago/webhook
    ↓
⚠️ DEVERIA ENVIAR: Email de Pagamento Aprovado
    ↓
Usuário clica link de ativação
    ↓
✅ ENVIA: Email de Upgrade Premium
```

**Arquivo:** `components/premium/pix-post-payment.tsx:304-369`

**Código de envio do Welcome:**
```typescript
const emailResponse = await fetch('/api/emails/welcome', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, name }),
})
```

**Status:** ✅ Email de boas-vindas **implementado**
**⚠️ Problema:** Email de pagamento aprovado **não está sendo enviado** no webhook do PIX

#### 2.2 Pagamento PIX Com Conta Existente
```
Usuário logado clica "Pagar com PIX"
    ↓
Gera QR Code PIX
    ↓
[Usuário paga PIX]
    ↓
Webhook: /api/mercadopago/webhook
    ↓
⚠️ DEVERIA ENVIAR: Email de Pagamento Aprovado
    ↓
Usuário clica link de ativação
    ↓
❌ NÃO ENVIA EMAIL (já é premium)
```

**Status Atual:** ⚠️ **Email de pagamento aprovado NÃO implementado no webhook**

---

### 3️⃣ **Fluxo de Pagamento Stripe**

#### 3.1 Checkout Stripe Completo
```
Usuário completa checkout Stripe
    ↓
Webhook: checkout.session.completed
    ↓
Arquivo: lib/stripe/webhooks.ts:14-216
    ↓
Cria assinatura no banco
    ↓
❌ NÃO ENVIA EMAIL (aguarda primeiro pagamento)
```

#### 3.2 Primeiro Pagamento Stripe Aprovado
```
Stripe confirma primeiro pagamento
    ↓
Webhook: invoice.payment_succeeded
    ↓
Arquivo: lib/stripe/webhooks.ts:158-219
    ↓
Atualiza subscription_status para 'active'
    ↓
✅ ENVIA: Email de Upgrade Premium
```

**Código:**
```typescript
// lib/stripe/webhooks.ts:208-211
await sendPremiumUpgradeEmail({
  to: { email: profile.email, name: profile.full_name },
  name: profile.full_name,
})
```

#### 3.3 Pagamento PIX via Stripe
```
Usuário paga via PIX no Stripe
    ↓
Webhook: payment_intent.succeeded (PIX)
    ↓
Arquivo: lib/stripe/webhooks.ts:348-441
    ↓
Atualiza status do PIX
    ↓
Atualiza profile para 'pro'
    ↓
✅ ENVIA: Email de Upgrade Premium
```

**Código:**
```typescript
// lib/stripe/webhooks.ts:430-433
await sendPremiumUpgradeEmail({
  to: { email: profile.email, name: profile.full_name },
  name: profile.full_name,
})
```

#### 3.4 Cancelamento de Assinatura Stripe
```
Usuário cancela assinatura
    ↓
Webhook: customer.subscription.deleted
    ↓
Arquivo: lib/stripe/webhooks.ts:277-342
    ↓
Atualiza status para 'canceled'
    ↓
Atualiza profile para 'free'
    ↓
✅ ENVIA: Email de Cancelamento
```

**Código:**
```typescript
// lib/stripe/webhooks.ts:334-337
await sendCancellationEmail({
  to: { email: profile.email, name: profile.full_name },
  name: profile.full_name,
})
```

---

### 4️⃣ **Fluxo de Recuperação de Senha**

```
Usuário clica "Esqueci minha senha"
    ↓
POST /api/auth/password/forgot
    ↓
Arquivo: app/api/auth/password/forgot/route.ts:59-63
    ↓
Gera link de recuperação (Supabase)
    ↓
✅ ENVIA: Email de Recuperação de Senha
```

**Código:**
```typescript
// app/api/auth/password/forgot/route.ts:59-63
await sendPasswordResetEmail({
  to: { email, name: user.user_metadata?.full_name || user.email },
  name: user.user_metadata?.full_name || user.email,
  resetLink: actionLink,
})
```

**Status:** ✅ **Implementado e funcionando**

---

## ⚙️ Configuração de Envio

### Provedor de Email

**Brevo (SendinBlue)**
- Arquivo: `lib/email/brevo.ts`
- Endpoint: `https://api.brevo.com/v3/smtp/email`
- Autenticação: API Key via header `api-key`

**Variáveis de Ambiente Necessárias:**
```bash
BREVO_API_KEY=xkeysib-your-key
BREVO_SENDER_EMAIL=contato@corretordetextoonline.com.br
BREVO_SENDER_NAME=CorretorIA  # Opcional
```

### Funções de Envio

**Arquivo:** `lib/email/send.ts`

```typescript
// 1. Boas-vindas
sendWelcomeEmail({ to, name })

// 2. Upgrade Premium
sendPremiumUpgradeEmail({ to, name })

// 3. Pagamento Aprovado
sendPaymentApprovedEmail({ to, name, amount, planType, activationLink })

// 4. Cancelamento
sendCancellationEmail({ to, name })

// 5. Recuperação de Senha
sendPasswordResetEmail({ to, name, resetLink })
```

---

## 📝 Detalhamento por Email

### 1. 📩 Email de Boas-vindas

**Template ID:** `welcome`
**Função:** `sendWelcomeEmail()`
**Arquivo:** `lib/email/templates.ts:11-107`

**Quando é enviado:**
- ✅ Após cadastro via PIX (guest checkout) - `pix-post-payment.tsx:304`
- ✅ Via endpoint de teste `/api/emails/welcome`
- ❌ **NÃO** enviado no cadastro padrão (email/senha)
- ❌ **NÃO** enviado no cadastro via Google OAuth

**Parâmetros:**
```typescript
{
  to: { email: string, name?: string },
  name?: string
}
```

**Conteúdo:**
- Saudação personalizada
- Lista de recursos disponíveis (5 itens)
- Botão CTA: "Começar a usar agora"
- Link para upgrade Premium (sutil)

**Subject:** `Bem-vindo ao CorretorIA!`

---

### 2. 🌟 Email de Upgrade Premium

**Template ID:** `premium-upgrade`
**Função:** `sendPremiumUpgradeEmail()`
**Arquivo:** `lib/email/templates.ts:109-205`

**Quando é enviado:**
- ✅ Stripe: Primeiro pagamento confirmado - `lib/stripe/webhooks.ts:208`
- ✅ Stripe: Pagamento PIX confirmado - `lib/stripe/webhooks.ts:430`
- ❌ **NÃO** enviado no Mercado Pago (PIX)
- ✅ Após ativação manual via webhook

**Parâmetros:**
```typescript
{
  to: { email: string, name?: string },
  name?: string
}
```

**Conteúdo:**
- Título celebratório com emoji 🌟
- Lista de 6 benefícios Premium
- Botão CTA: "Acessar meu painel Premium"
- Link para dashboard

**Subject:** `Sua assinatura Premium está ativa! 🌟`

---

### 3. 💳 Email de Pagamento Aprovado

**Template ID:** `payment-approved`
**Função:** `sendPaymentApprovedEmail()`
**Arquivo:** `lib/email/templates.ts:393-541`

**Quando DEVERIA ser enviado:**
- ⚠️ **Mercado Pago:** Após pagamento PIX confirmado (webhook)
- ⚠️ **Antes da ativação da assinatura**

**Status Atual:** ❌ **NÃO IMPLEMENTADO em nenhum webhook**

**Parâmetros:**
```typescript
{
  to: { email: string, name?: string },
  name?: string,
  amount: number,           // Valor pago em reais
  planType: 'monthly' | 'annual',
  activationLink: string   // URL para ativar assinatura
}
```

**Conteúdo:**
- Box verde com detalhes do pagamento
- Botão grande: "🚀 Ativar Assinatura Premium"
- Lista de benefícios Premium
- Link alternativo para ativação

**Subject:** `✅ Pagamento aprovado! Ative sua assinatura Premium`

**⚠️ ATENÇÃO:** Este email foi criado mas **não está sendo enviado** em nenhum fluxo de pagamento.

---

### 4. 📉 Email de Cancelamento

**Template ID:** `cancellation`
**Função:** `sendCancellationEmail()`
**Arquivo:** `lib/email/templates.ts:207-300`

**Quando é enviado:**
- ✅ Stripe: Webhook `customer.subscription.deleted` - `lib/stripe/webhooks.ts:334`
- ❌ **NÃO** implementado no Mercado Pago

**Parâmetros:**
```typescript
{
  to: { email: string, name?: string },
  name?: string
}
```

**Conteúdo:**
- Confirmação de cancelamento
- Box com "O que acontece agora" (4 pontos)
- Botão CTA: "Reativar Premium"
- Convite para feedback

**Subject:** `Sua assinatura foi cancelada`

---

### 5. 🔑 Email de Recuperação de Senha

**Template ID:** `password-reset`
**Função:** `sendPasswordResetEmail()`
**Arquivo:** `lib/email/templates.ts:302-391`

**Quando é enviado:**
- ✅ POST `/api/auth/password/forgot` - `app/api/auth/password/forgot/route.ts:59`

**Parâmetros:**
```typescript
{
  to: { email: string, name?: string },
  name?: string,
  resetLink: string   // Link de recuperação do Supabase
}
```

**Conteúdo:**
- Box amarelo de alerta (expira em 60min)
- Botão CTA: "Redefinir minha senha"
- Link alternativo em box cinza
- Instruções de segurança

**Subject:** `Recupere sua senha no CorretorIA`

---

## 🔔 Webhooks e Integrações

### Stripe Webhooks

**Arquivo:** `lib/stripe/webhooks.ts`

| Evento | Handler | Email Enviado |
|--------|---------|---------------|
| `checkout.session.completed` | `handleCheckoutCompleted` | ❌ Nenhum |
| `invoice.payment_succeeded` | `handleInvoicePaymentSucceeded` | ✅ Premium Upgrade |
| `invoice.payment_failed` | `handleInvoicePaymentFailed` | ❌ Nenhum |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | ✅ Cancelamento |
| `payment_intent.succeeded` (PIX) | `handlePixPaymentSucceeded` | ✅ Premium Upgrade |
| `payment_intent.payment_failed` (PIX) | `handlePixPaymentFailed` | ❌ Nenhum |

### Mercado Pago Webhooks

**Arquivo:** `app/api/mercadopago/webhook/route.ts`

| Evento | Email Enviado | Status |
|--------|---------------|---------|
| PIX payment confirmed | ❌ Nenhum | ⚠️ **Deveria enviar "Pagamento Aprovado"** |
| Subscription payment | ❌ Nenhum | ⚠️ **Deveria enviar "Premium Upgrade"** |
| Subscription canceled | ❌ Nenhum | ⚠️ **Deveria enviar "Cancelamento"** |

**⚠️ PROBLEMA:** Webhooks do Mercado Pago **não estão enviando emails**.

---

## ⚠️ Problemas Identificados

### 1. Email de Boas-vindas Não Enviado no Cadastro Normal

**Impacto:** Usuários que se cadastram via email/senha ou Google OAuth **não recebem** email de boas-vindas.

**Localização do Problema:**
- `contexts/auth-context.tsx:211-247` (função `signUp`)
- `contexts/auth-context.tsx:266-305` (função `signInWithGoogle`)

**Solução Sugerida:**

```typescript
// Em contexts/auth-context.tsx, após signUp bem-sucedido:
if (data.user) {
  // ... existing code ...

  // Send welcome email
  try {
    await fetch('/api/emails/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.user.email,
        name: name || data.user.user_metadata?.name
      })
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    // Don't block signup if email fails
  }
}
```

---

### 2. Email de Pagamento Aprovado Não Implementado no Mercado Pago

**Impacto:** Usuários que pagam via PIX (Mercado Pago) **não recebem** confirmação de pagamento com botão de ativação.

**Localização do Problema:**
- `app/api/mercadopago/webhook/route.ts` - Não envia email após PIX confirmado

**Solução Sugerida:**

```typescript
// Em app/api/mercadopago/webhook/route.ts, após PIX confirmado:
import { sendPaymentApprovedEmail } from '@/lib/email/send'

// Após confirmar o pagamento no banco:
const activationToken = generateSecureToken() // Implementar função
await supabase
  .from('pix_activations')
  .insert({
    user_id: userId,
    token: activationToken,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
  })

// Enviar email
await sendPaymentApprovedEmail({
  to: { email: user.email, name: user.name },
  name: user.name,
  amount: pixPayment.amount,
  planType: pixPayment.plan_type,
  activationLink: `${appUrl}/api/verify-pix-activation?token=${activationToken}`
})
```

---

### 3. Webhooks do Mercado Pago Sem Emails

**Impacto:** Nenhum email é enviado para eventos do Mercado Pago (pagamentos, cancelamentos, etc).

**Solução:** Implementar envio de emails nos handlers do webhook do Mercado Pago, seguindo o padrão dos webhooks do Stripe.

---

### 4. Email de Upgrade Premium Enviado Imediatamente no PIX (Stripe)

**Problema:** No fluxo Stripe PIX, o email de "Premium Upgrade" é enviado imediatamente após pagamento confirmado, sem passo intermediário de ativação.

**Localização:** `lib/stripe/webhooks.ts:430`

**Sugestão:** Considerar usar email de "Pagamento Aprovado" primeiro, depois "Premium Upgrade" após ativação confirmada.

---

## 📊 Resumo: Emails por Situação

| Situação | Email Enviado | Status |
|----------|---------------|---------|
| Cadastro via Email/Senha | ❌ Nenhum | ⚠️ Deveria enviar Boas-vindas |
| Cadastro via Google OAuth | ❌ Nenhum | ⚠️ Deveria enviar Boas-vindas |
| Cadastro via PIX (guest) | ✅ Boas-vindas | ✅ Implementado |
| Pagamento PIX Mercado Pago | ❌ Nenhum | ⚠️ Deveria enviar Pagamento Aprovado |
| Ativação após PIX (Mercado Pago) | ❌ Nenhum | ⚠️ Deveria enviar Premium Upgrade |
| Primeiro pagamento Stripe | ✅ Premium Upgrade | ✅ Implementado |
| Pagamento PIX Stripe | ✅ Premium Upgrade | ✅ Implementado |
| Cancelamento Stripe | ✅ Cancelamento | ✅ Implementado |
| Cancelamento Mercado Pago | ❌ Nenhum | ⚠️ Deveria enviar Cancelamento |
| Esqueci minha senha | ✅ Recuperação de Senha | ✅ Implementado |

---

## 🎯 Prioridades de Implementação

### Alta Prioridade 🔴

1. **Implementar email de Pagamento Aprovado no Mercado Pago PIX**
   - Maior volume de pagamentos
   - Melhora UX do fluxo de ativação
   - Reduz confusão do usuário

2. **Implementar email de Boas-vindas no cadastro normal**
   - Primeira impressão do usuário
   - Aumenta engajamento inicial

### Média Prioridade 🟡

3. **Implementar email de Premium Upgrade no Mercado Pago**
   - Após ativação da assinatura PIX
   - Consistência com fluxo Stripe

4. **Implementar email de Cancelamento no Mercado Pago**
   - Menor frequência de uso
   - Importante para transparência

### Baixa Prioridade 🟢

5. **Email de falha de pagamento**
   - Notificar quando PIX expira
   - Notificar quando cartão falha

6. **Email de cobrança pendente**
   - Avisar antes da cobrança renovar
   - Lembrete de atualizar cartão

---

## 📚 Arquivos Relacionados

### Templates e Envio
- `lib/email/templates.ts` - Todos os templates HTML/texto
- `lib/email/send.ts` - Funções de envio
- `lib/email/brevo.ts` - Cliente Brevo (SendinBlue)

### Webhooks
- `lib/stripe/webhooks.ts` - Handlers Stripe
- `app/api/mercadopago/webhook/route.ts` - Handlers Mercado Pago
- `app/api/webhooks/mercadopago-subscription/route.ts` - Subscriptions Mercado Pago

### Fluxos de Autenticação
- `contexts/auth-context.tsx` - Contexto de autenticação
- `app/api/auth/password/forgot/route.ts` - Recuperação de senha

### Componentes
- `components/premium/pix-post-payment.tsx` - Pós-pagamento PIX

### API Endpoints
- `app/api/emails/welcome/route.ts` - Endpoint para email de boas-vindas
- `app/api/admin/debug/send-test-email/route.ts` - Debug de emails

---

## 🧪 Testando Emails

### Via Interface de Debug

1. Acesse: `https://www.corretordetextoonline.com.br/admin/debug/emails`
2. Faça login com conta admin
3. Selecione o template desejado
4. Preencha os campos necessários
5. Clique "Enviar Email de Teste"

### Via API Diretamente

```bash
# Email de Boas-vindas
curl -X POST https://www.corretordetextoonline.com.br/api/emails/welcome \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","name":"Teste"}'

# Email de Pagamento Aprovado (via debug)
curl -X POST https://www.corretordetextoonline.com.br/api/admin/debug/send-test-email \
  -H "Content-Type: application/json" \
  -H "Cookie: your-admin-session-cookie" \
  -d '{
    "template":"payment-approved",
    "to":"teste@exemplo.com",
    "name":"João Silva",
    "amount":49.90,
    "planType":"monthly",
    "activationLink":"https://www.corretordetextoonline.com.br/api/verify-pix-activation?token=test123"
  }'
```

---

**Última atualização:** 2025-10-27
**Versão:** 1.0.0
**Autor:** Sistema de Documentação CorretorIA
