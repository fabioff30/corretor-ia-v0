# 🏦 Configuração de Pagamento PIX com Mercado Pago

## 📋 Visão Geral

Esta documentação descreve a implementação de pagamentos via PIX usando Mercado Pago para assinaturas Premium do CorretorIA.

### ⚠️ Limitações Importantes

1. **PIX não suporta assinaturas recorrentes automáticas** - O usuário precisa fazer pagamentos manuais periodicamente
2. **Tempo de expiração**: QR Codes PIX expiram em 30 minutos (configurável)
3. **Confirmação**: Pagamentos PIX são confirmados via webhook em tempo real

## 🚀 Setup Inicial

### 1. Configurar PIX no Mercado Pago

1. Acesse o [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação para o CorretorIA
3. Obtenha suas credenciais:
   - Access Token de Produção
   - Access Token de Teste
4. PIX já vem habilitado por padrão para contas brasileiras

### 2. Configurar Webhooks

No Painel do Mercado Pago:

1. Vá para **Suas integrações** → **Webhooks**
2. Configure os seguintes eventos:
   - `payment`
   - `authorized_payment`
3. Configure a URL do webhook:
   - Produção: `https://seu-dominio.com/api/mercadopago/webhook`
   - Desenvolvimento: Use ngrok ou similar para testes locais

### 3. Executar Migration no Supabase

Execute a migration para criar a tabela `pix_payments`:

```bash
# Via Supabase Dashboard
1. Acesse SQL Editor no Supabase
2. Cole e execute o conteúdo de: supabase/migrations/20250124_create_pix_payments_table.sql

# Ou via CLI
supabase db push
```

## 💻 Fluxo de Implementação

### 1. Frontend - Usuário Inicia Pagamento

```typescript
// Usuario clica no botão "Pagar com PIX"
const handlePixPayment = async (planType: 'monthly' | 'annual') => {
  const payment = await createPixPayment(planType, userId, userEmail)
  if (payment) {
    // Abre modal com QR Code
    setPixModalOpen(true)
  }
}
```

### 2. Backend - Criação do Pagamento PIX

```typescript
// POST /api/mercadopago/create-pix-payment
const payment = await mpClient.createPixPayment(
  29.90, // Valor em reais
  userEmail,
  userId,
  'Plano Premium Mensal - CorretorIA',
  30 // Expira em 30 minutos
)
```

### 3. Frontend - Exibição do QR Code

O modal PIX exibe:
- QR Code para escaneamento
- Código PIX copia-cola
- Timer de 30 minutos
- Polling automático a cada 5 segundos

### 4. Webhook - Confirmação do Pagamento

Quando o pagamento é confirmado:
1. Mercado Pago envia webhook com evento `payment`
2. Sistema verifica se é pagamento PIX aprovado
3. Cria assinatura no banco de dados
4. Ativa plano Premium do usuário
5. Envia email de confirmação (opcional)

## 🧪 Testando em Desenvolvimento

### Com Ambiente de Teste do Mercado Pago

```bash
# Use o Access Token de teste no .env.local
MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-de-teste

# Para testar webhooks localmente, use ngrok
ngrok http 3000

# Configure o webhook no Mercado Pago com a URL do ngrok
# https://seu-id.ngrok.io/api/mercadopago/webhook
```

### Teste Manual

1. Use credenciais de teste do Mercado Pago
2. Para PIX em ambiente de teste:
   - O QR Code é gerado normalmente
   - Use o app do Mercado Pago em modo teste
   - Ou simule pagamento via API

## 📊 Monitoramento

### Verificar Pagamentos PIX

```sql
-- Ver todos os pagamentos PIX
SELECT * FROM pix_payments
ORDER BY created_at DESC;

-- Ver pagamentos pendentes
SELECT * FROM pix_payments
WHERE status = 'pending'
  AND expires_at > NOW();

-- Ver pagamentos confirmados hoje
SELECT * FROM pix_payments
WHERE status = 'paid'
  AND paid_at::date = CURRENT_DATE;
```

### Logs do Mercado Pago

Verifique logs em:
- Mercado Pago Dashboard → Atividade
- API: GET `/v1/payments/search?external_reference={userId}`

## 🔧 Troubleshooting

### Problema: QR Code não aparece

**Solução**: Verificar se o pagamento foi criado corretamente

```javascript
// Verificar no console
const payment = await mpClient.getPayment(paymentId)
console.log(payment.point_of_interaction?.transaction_data)
```

### Problema: Pagamento não é confirmado

**Possíveis causas**:
1. Webhook não configurado corretamente
2. Assinatura de webhook inválida
3. Timeout no processamento

**Debug**:
```bash
# Verificar pagamentos via API
curl -X GET \
  'https://api.mercadopago.com/v1/payments/search?limit=10' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'

# Verificar webhook específico
curl -X GET \
  'https://api.mercadopago.com/v1/payments/{payment_id}' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### Problema: QR Code expira muito rápido

**Solução**: Aumentar tempo de expiração (máximo 7 dias)

```typescript
payment_method_options: {
  pix: {
    expires_after_seconds: 86400 // 24 horas
  }
}
```

## 📱 UX Recomendações

1. **Instruções Claras**: Sempre mostrar passo-a-passo de como pagar
2. **Timer Visível**: Mostrar tempo restante prominentemente
3. **Feedback Imediato**: Confirmar pagamento assim que processado
4. **Fallback**: Oferecer opção de cartão se PIX falhar
5. **Mobile First**: QR Code deve ser grande o suficiente para mobile

## 🔐 Segurança

1. **Validar Webhooks**: Sempre verificar assinatura Stripe
2. **Rate Limiting**: Limitar criação de Payment Intents
3. **Timeout**: Expirar QR Codes não utilizados
4. **Logs**: Registrar todas as transações para auditoria

## 📈 Analytics Recomendados

Track os seguintes eventos:

```typescript
// Google Analytics / GTM
sendGTMEvent('pix_payment_initiated', { plan, value })
sendGTMEvent('pix_qr_displayed', { payment_intent_id })
sendGTMEvent('pix_code_copied', { payment_intent_id })
sendGTMEvent('pix_payment_confirmed', { plan, value })
sendGTMEvent('pix_payment_failed', { reason })
sendGTMEvent('pix_payment_expired', { payment_intent_id })
```

## 🚀 Deploy Checklist

- [ ] Migration executada no Supabase
- [ ] Access Token do Mercado Pago configurado
- [ ] Webhooks configurados e testados
- [ ] Variáveis de ambiente configuradas (MERCADO_PAGO_ACCESS_TOKEN)
- [ ] Teste end-to-end em staging
- [ ] Monitoramento configurado
- [ ] Documentação para suporte preparada

## 📞 Suporte

Para problemas com PIX:
1. Verificar status no Mercado Pago Dashboard
2. Consultar logs do webhook
3. Verificar tabela `pix_payments` no Supabase
4. Contatar: contato@corretordetextoonline.com.br

## 🔗 Links Úteis

- [Mercado Pago PIX Documentation](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/payment-methods/pix)
- [Mercado Pago API Reference](https://www.mercadopago.com.br/developers/pt/reference)
- [Banco Central - PIX](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Webhooks Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)