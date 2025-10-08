# Stripe Migration Guide

## ✅ Completed Steps

### FASE 1: Setup
- ✅ Installed `stripe` and `@stripe/stripe-js` packages
- ✅ Created products in Stripe:
  - **Monthly Plan**: R$29,90/mês (price_1SFN5rAaDWyHAlqlK3GSBbU2)
  - **Annual Plan**: R$299/ano (price_1SFN65AaDWyHAlql7m6EslQp)

### FASE 2: Database Migration
- ✅ Applied migration `004_stripe_integration.sql`
- ✅ Added Stripe fields to `subscriptions` and `payment_transactions` tables
- ✅ Created `stripe_customers` table
- ✅ Made Mercado Pago fields nullable for backward compatibility

### FASE 3: Backend Implementation
- ✅ Created `lib/stripe/server.ts` with core Stripe functions
- ✅ Created `lib/stripe/webhooks.ts` with event handlers
- ✅ Created API routes:
  - `/api/stripe/create-checkout-session` - Create subscription checkout
  - `/api/stripe/webhook` - Handle Stripe events
  - `/api/stripe/create-portal-session` - Customer Portal access
  - `/api/stripe/config` - Expose publishable key

### FASE 4: Frontend Updates
- ✅ Updated `components/premium-plan.tsx` to mention Stripe
- ✅ Updated `hooks/use-subscription.ts` to use Stripe endpoints

---

## 📋 Next Steps

### FASE 5: Configure Webhooks and Test

#### 1. Add Environment Variables to Vercel

Add these environment variables to your Vercel project:

```bash
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...  # Use sk_test_ for testing, sk_live_ for production
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Use pk_test_ for testing, pk_live_ for production

# Stripe Webhook Secret (get after creating webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**How to get these values:**

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** → `STRIPE_PUBLISHABLE_KEY`
3. Click "Reveal test key" and copy **Secret key** → `STRIPE_SECRET_KEY`
4. For webhook secret, follow step 2 below

#### 2. Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://your-domain.vercel.app/api/stripe/webhook
   ```
4. Select the following events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click **"Add endpoint"**
6. Click **"Reveal"** to see the **Signing secret**
7. Copy the secret (starts with `whsec_`) → `STRIPE_WEBHOOK_SECRET`

#### 3. Configure Stripe Customer Portal

The Customer Portal allows customers to manage their own subscriptions.

1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Enable **Customer Portal**
3. Configure settings:
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to view invoices
4. Set **Business information** and **Privacy policy URL**
5. Click **"Save changes"**

#### 4. Test the Integration

**Test Mode:**
1. Deploy to Vercel with all environment variables set
2. Visit `/premium` page
3. Click "Assinar Mensal" or "Assinar Anual"
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any billing ZIP code
5. Complete checkout
6. Verify webhook receives `checkout.session.completed` event
7. Check database for new subscription and customer records
8. Verify user is upgraded to Pro plan

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

**Monitor Webhooks:**
- Go to https://dashboard.stripe.com/test/webhooks
- Click on your endpoint
- View **"Events"** tab to see webhook deliveries

#### 5. Test Customer Portal

1. After creating a subscription, visit `/dashboard/subscription`
2. Click **"Gerenciar Assinatura"** or **"Cancelar Assinatura"**
3. Should redirect to Stripe Customer Portal
4. Test canceling, updating payment method, viewing invoices

---

### FASE 6: Cleanup Mercado Pago Code (After Testing)

Once Stripe is fully tested and working:

1. Remove Mercado Pago API routes:
   - `app/api/mercadopago/create-subscription/route.ts`
   - `app/api/mercadopago/cancel-subscription/route.ts`
   - `app/api/mercadopago/webhook/route.ts`
   - etc.

2. Remove Mercado Pago library:
   - `lib/mercadopago/client.ts`
   - `lib/mercadopago/webhooks.ts`

3. Remove Mercado Pago dependencies:
   ```bash
   pnpm remove mercadopago
   ```

4. Remove Mercado Pago environment variables from Vercel

5. Optional: Remove Mercado Pago columns from database in a future migration (keep for now for data retention)

---

## 🔍 Testing Checklist

- [ ] Environment variables added to Vercel
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Customer Portal configured
- [ ] Test subscription creation (monthly)
- [ ] Test subscription creation (annual)
- [ ] Test webhook events are received
- [ ] Test subscription data saved to database
- [ ] Test user upgraded to Pro plan
- [ ] Test Customer Portal access
- [ ] Test subscription cancellation
- [ ] Test failed payment handling
- [ ] Verify `/debug` page shows Stripe config correctly

---

## 🚀 Going to Production

When ready to go live:

1. Switch to **Live Mode** in Stripe Dashboard
2. Get **live** API keys from https://dashboard.stripe.com/apikeys
3. Update Vercel environment variables:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `STRIPE_PUBLISHABLE_KEY=pk_live_...`
4. Create new webhook endpoint for production URL
5. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
6. Configure live Customer Portal settings
7. Test with real card (small amount first!)

---

## 📊 Key Differences: Stripe vs Mercado Pago

| Feature | Mercado Pago | Stripe |
|---------|--------------|--------|
| **Test Mode** | ❌ Broken for subscriptions | ✅ Full test mode with test cards |
| **Checkout** | Hosted page | Stripe Checkout (hosted) |
| **Subscription Management** | Manual API calls | ✅ Customer Portal (self-service) |
| **Webhooks** | Signature validation | ✅ Signature validation |
| **International** | Latin America | ✅ Global (190+ countries) |
| **Documentation** | Limited | ✅ Comprehensive |
| **Developer Experience** | ⚠️ Challenging | ✅ Excellent |

---

## 🎯 Advantages of Stripe

1. **Reliable Test Mode**: Proper testing without real charges
2. **Customer Portal**: Self-service subscription management
3. **Better Webhooks**: More reliable event delivery
4. **Superior Documentation**: Clear guides and examples
5. **Better Error Handling**: Clear error messages
6. **More Payment Methods**: Credit cards, digital wallets, etc.
7. **Revenue Recognition**: Built-in tax and invoicing
8. **Fraud Prevention**: Stripe Radar included

---

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Billing Quickstart](https://stripe.com/docs/billing/quickstart)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
