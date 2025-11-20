# Webhook Fix - Double Slash Issue

## Problem Identified

**Date:** 2025-10-27

### Symptoms
- PIX payments were approved by Mercado Pago
- Webhooks were never processed
- Database remained with `status: 'pending'`
- Users stayed on `free` plan even after payment

### Root Cause

The webhook URL had a **double slash** that caused HTTP 308 redirects:

```
Sent URL:     https://corretordetextoonline.com.br//api/mercadopago/webhook
HTTP Status:  308 Permanent Redirect
Redirects to: https://corretordetextoonline.com.br/api/mercadopago/webhook
```

**Mercado Pago does NOT follow redirects in webhooks!** When it receives a 308/301/302, it considers the webhook delivery failed and does not retry.

### Investigation Process

1. ✅ Checked Supabase logs - no errors
2. ✅ Queried payment in database - status `pending`
3. ✅ Checked Mercado Pago API - payment `approved`
4. ✅ Tested webhook endpoint publicly - HTTP 200 OK on single slash
5. 🚨 **Tested with double slash - HTTP 308 Redirect!**

### Technical Details

The issue was in `lib/mercadopago/client.ts`:

```typescript
// BEFORE (incorrect)
notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`
// If NEXT_PUBLIC_APP_URL = "https://corretordetextoonline.com.br/"
// Result: "https://corretordetextoonline.com.br//api/mercadopago/webhook"
```

## Solution Implemented

### Code Changes

**File:** `lib/mercadopago/client.ts`

1. Created `getWebhookUrl()` method:
```typescript
private getWebhookUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://corretordetextoonline.com.br'
  // Remove trailing slash from base URL if present
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
  return `${cleanBaseUrl}/api/mercadopago/webhook`
}
```

2. Updated `createPixPayment()` to use the method:
```typescript
notification_url: this.getWebhookUrl()
```

### Environment Variable

Added to `.env.local` and should be set in Vercel:
```bash
# Application URL (without trailing slash)
NEXT_PUBLIC_APP_URL=https://corretordetextoonline.com.br
```

**Important:** URL should **NOT** have trailing slash.

## Verification Steps

### 1. Test Single Slash URL
```bash
curl -I https://corretordetextoonline.com.br/api/mercadopago/webhook
# Expected: HTTP 200
```

### 2. Test Double Slash URL (should be fixed in new payments)
```bash
curl -I https://corretordetextoonline.com.br//api/mercadopago/webhook
# Current: HTTP 308 (redirect)
# This is OK now - we won't send double slash anymore
```

### 3. Verify New Payment Creation
After deploying, create a test PIX payment and verify:
```sql
SELECT payment_intent_id, notification_url
FROM mercadopago_api_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC LIMIT 1;
```

Should show: `https://corretordetextoonline.com.br/api/mercadopago/webhook` (single slash)

## Manual Processing of Failed Payments

For payments that were approved but never processed due to this bug:

### 1. Find Affected Payments
```sql
SELECT
  pp.id,
  pp.payment_intent_id,
  pp.user_id,
  pp.email,
  pp.status,
  pp.amount,
  pp.created_at
FROM pix_payments pp
WHERE pp.status = 'pending'
  AND pp.created_at > '2025-10-20'  -- Adjust date range
  AND pp.expires_at < NOW();  -- Expired but might be paid
```

### 2. Check Each Payment in Mercado Pago
```bash
curl -s 'https://api.mercadopago.com/v1/payments/<payment_id>' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  | python3 -m json.tool
```

### 3. Manual Activation Script
For approved payments not processed, use `scripts/manual-activation.sql` as template.

**Process:**
1. Update `pix_payments` to `paid` status
2. Create `subscriptions` record
3. Call `activate_subscription()` RPC
4. Update `profiles` to PRO plan
5. Mark payment as `consumed`

## Prevention Measures

### 1. Add URL Validation Test
```typescript
// __tests__/lib/mercadopago/webhook-url.test.ts
describe('Webhook URL Generation', () => {
  it('should not have double slashes', () => {
    const client = new MercadoPagoClient()
    const url = client['getWebhookUrl']()  // Access private method in test
    expect(url).not.toMatch(/\/\//)
    expect(url).toBe('https://corretordetextoonline.com.br/api/mercadopago/webhook')
  })
})
```

### 2. Add Webhook Monitoring
Create a cron job to check for stuck payments:
```sql
-- Find payments pending for > 1 hour
SELECT * FROM pix_payments
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
  AND expires_at > NOW();
```

### 3. Add Webhook Retry Logic
In `app/api/mercadopago/webhook/route.ts`, improve error logging:
```typescript
console.error('[MP Webhook] Processing failed:', {
  paymentId,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
})
```

## Deployment Checklist

- [x] Fix `lib/mercadopago/client.ts` to use `getWebhookUrl()`
- [x] Add `NEXT_PUBLIC_APP_URL` to `.env.local`
- [ ] Add `NEXT_PUBLIC_APP_URL` to Vercel environment variables
- [ ] Deploy to production
- [ ] Test new payment creation
- [ ] Verify webhook URL in Mercado Pago payment
- [ ] Monitor webhook delivery success rate

## Related Issues

- User: ads@fabiofariasf.com.br
- Payment ID: 130895552147
- Status: Manually activated ✅
- Date: 2025-10-27

## References

- Mercado Pago Webhooks Documentation: https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
- PIX Setup Guide: `PIX_SETUP.md`
- Guest Payment Flow: `GUEST_PIX_FLOW.md`
