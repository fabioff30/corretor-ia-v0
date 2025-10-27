# Guest PIX Payment Flow - Technical Documentation

## Overview

This document describes the improved PIX payment flow that properly handles **guest payments** (users who pay before creating an account). The new system uses a "voucher" approach where approved payments can be linked to accounts created later.

## Problem Solved

**Previous Issue:**
- Guest pays via PIX → Mercado Pago confirms payment → Webhook marks payment as "paid"
- BUT: Webhook cannot create subscription (no user_id yet)
- Guest creates account → Account stays as "free" plan ❌
- **Result:** Payment confirmed but Premium not activated

**Solution:**
Separate "payment approved" from "account activated" using 3 distinct payment states.

---

## Payment States

The `pix_payments.status` field now has these states:

| State | Description | When |
|-------|-------------|------|
| `pending` | PIX generated, awaiting payment | User generates QR Code |
| `approved` | Mercado Pago confirmed, not yet linked to account | Webhook receives payment confirmation (guest only) |
| `paid` | Legacy state (migrated to `consumed`) | - |
| `consumed` | Payment benefit applied to user profile | Subscription created + Profile activated |
| `failed` | Payment failed | Mercado Pago reports failure |
| `expired` | QR Code expired (30min) | Automatic expiration |

---

## Flow Diagrams

### Guest Payment Flow (New)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. GUEST GENERATES PIX                                          │
│    POST /api/mercadopago/create-pix-payment                     │
│    { guestEmail: "user@example.com", planType: "monthly" }      │
│                                                                  │
│    Database: pix_payments                                       │
│    {                                                             │
│      user_id: NULL,                                              │
│      email: "user@example.com",                                 │
│      status: "pending",                                          │
│      plan_type: "monthly"                                        │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. GUEST PAYS PIX                                               │
│    Mercado Pago sends webhook → POST /api/mercadopago/webhook  │
│                                                                  │
│    Webhook logic:                                               │
│    - Detects user_id is NULL (guest payment)                   │
│    - Updates status: "pending" → "approved"                     │
│    - Does NOT create subscription (no user yet)                 │
│    - Returns early                                              │
│                                                                  │
│    Database: pix_payments                                       │
│    {                                                             │
│      user_id: NULL,           ← Still unlinked                  │
│      email: "user@example.com",                                 │
│      status: "approved",      ← Payment confirmed!              │
│      paid_at: "2025-10-27T..."                                  │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. GUEST CREATES ACCOUNT                                        │
│    Frontend: /premium/pix-sucesso?guest=1&email=user@...       │
│    Component: PixPostPayment                                    │
│                                                                  │
│    User fills form:                                             │
│    - Name: "João Silva"                                         │
│    - Password: "******"                                         │
│    - Confirms password                                          │
│    - Accepts terms                                              │
│                                                                  │
│    Component calls:                                             │
│    1. await signUp(email, password, name)                       │
│       → Creates user in auth.users                              │
│       → Creates profile in profiles (plan_type: "free")         │
│                                                                  │
│    2. await fetch('/api/mercadopago/link-pix-payment', {        │
│         method: 'POST',                                          │
│         body: JSON.stringify({ email })                          │
│       })                                                         │
│       → Links approved payment to newly created account         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. LINK PAYMENT TO ACCOUNT                                      │
│    POST /api/mercadopago/link-pix-payment                       │
│    Endpoint calls: linkPendingPayment(userId, email)            │
│                                                                  │
│    Function logic:                                              │
│    1. Find approved payment for email:                          │
│       SELECT * FROM pix_payments                                │
│       WHERE email = 'user@example.com'                          │
│         AND status = 'approved'                                 │
│         AND user_id IS NULL                                     │
│                                                                  │
│    2. Create subscription:                                      │
│       INSERT INTO subscriptions (                               │
│         user_id, status: 'authorized', ...                      │
│       )                                                          │
│                                                                  │
│    3. Activate profile via RPC:                                 │
│       CALL activate_subscription(user_id, subscription_id)      │
│       → Updates profiles.plan_type = 'pro'                      │
│       → Updates profiles.subscription_status = 'active'         │
│                                                                  │
│    4. Mark payment as consumed:                                 │
│       UPDATE pix_payments                                       │
│       SET status = 'consumed',                                  │
│           user_id = <new_user_id>,                              │
│           linked_to_user_at = NOW()                             │
│       WHERE ...                                                 │
│                                                                  │
│    ✅ Result: Premium activated!                                │
└─────────────────────────────────────────────────────────────────┘
```

### Logged User Payment Flow (Existing)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LOGGED USER GENERATES PIX                                    │
│    POST /api/mercadopago/create-pix-payment                     │
│    { userId: "uuid-123", planType: "monthly" }                  │
│                                                                  │
│    Database: pix_payments                                       │
│    {                                                             │
│      user_id: "uuid-123",  ← User already exists                │
│      email: null,          ← Not needed for logged users        │
│      status: "pending"                                          │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. USER PAYS PIX                                                │
│    Mercado Pago sends webhook → POST /api/mercadopago/webhook  │
│                                                                  │
│    Webhook logic:                                               │
│    - Detects user_id is NOT NULL (logged user)                 │
│    - Updates status: "pending" → "paid"                         │
│    - Creates subscription in subscriptions table                │
│    - Activates profile (plan_type: 'pro')                       │
│    - Updates status: "paid" → "consumed"                        │
│                                                                  │
│    ✅ Result: Premium activated immediately!                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Database Migration

**File:** `supabase/migrations/20251027_fix_guest_pix_activation.sql`

Changes:
- Added `approved` and `consumed` states to `pix_payments.status` constraint
- Created index for fast lookup of approved guest payments
- Migrated existing `paid` records to `consumed` for backward compatibility

### 2. Link Payment Function

**File:** `lib/mercadopago/link-pending-payment.ts`

Main function: `linkPendingPayment(userId: string, userEmail: string)`

Responsibilities:
1. Find approved payments for email
2. Create subscription in database
3. Activate user profile (PRO plan)
4. Mark payment as consumed

### 3. API Endpoint

**File:** `app/api/mercadopago/link-pix-payment/route.ts`

Endpoints:
- `POST /api/mercadopago/link-pix-payment`
  - Links approved payment to authenticated user
  - Called automatically after signup
  - Can be called manually to retry linking

- `GET /api/mercadopago/link-pix-payment?email=...`
  - Checks if user has pending payments to link
  - Returns count and list of approved payments

### 4. Webhook Updates

**File:** `app/api/mercadopago/webhook/route.ts`

Changes:
- Guest payments: Mark as `approved` (not `consumed`)
- Logged user payments: Mark as `consumed` after activation
- Added detailed logging for debugging

### 5. Signup Component

**File:** `components/premium/pix-post-payment.tsx`

Changes:
- After successful signup, automatically calls link endpoint
- Handles errors gracefully (doesn't block signup)
- Tracks events for analytics

### 6. Manual Activation Endpoint

**File:** `app/api/mercadopago/activate-pix-payment/route.ts`

Changes:
- Updated to use `consumed` status instead of `paid`
- Serves as fallback when automatic linking fails

---

## Testing Checklist

### Guest Payment Flow
- [ ] Guest generates PIX → `pix_payments` has `user_id=NULL`, `status='pending'`
- [ ] Guest pays PIX → Webhook updates to `status='approved'`
- [ ] Webhook does NOT create subscription for guest
- [ ] Guest creates account → Signup succeeds
- [ ] Link endpoint called automatically → Finds approved payment
- [ ] Subscription created, profile activated → `status='consumed'`
- [ ] User sees Premium features in dashboard

### Logged User Flow
- [ ] Logged user generates PIX → `pix_payments` has `user_id`, `status='pending'`
- [ ] User pays PIX → Webhook creates subscription immediately
- [ ] Profile activated → `status='consumed'`
- [ ] User sees Premium features

### Edge Cases
- [ ] Guest pays but never creates account → Payment stays `approved` (can be refunded)
- [ ] Guest pays, creates account with different email → Payment not linked (manual support needed)
- [ ] Guest pays twice → Second payment also stays `approved` until linked
- [ ] User already has subscription → Link endpoint returns `alreadyActive: true`

---

## Migration Rollback

If needed, rollback with:

```sql
-- Restore old constraint (removes new states)
ALTER TABLE pix_payments
  DROP CONSTRAINT IF EXISTS pix_payments_status_check;

ALTER TABLE pix_payments
  ADD CONSTRAINT pix_payments_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'expired'));

-- Convert consumed back to paid
UPDATE pix_payments
SET status = 'paid'
WHERE status = 'consumed';

-- Drop new index
DROP INDEX IF EXISTS idx_pix_payments_approved_by_email;
```

---

## Support & Monitoring

### Logs to Monitor

**Webhook logs:**
```
[MP Webhook] Guest PIX payment approved: { paymentId, email, status: 'approved' }
[MP Webhook] Payment marked as APPROVED. Will be linked when user registers/logs in.
```

**Link payment logs:**
```
[Link Payment] Starting for user: <userId> email: <email>
[Link Payment] Found approved payment: <paymentId>
[Link Payment] Subscription created: <subscriptionId>
[Link Payment] ✅ Successfully linked payment and activated PRO plan
```

**Signup logs:**
```
[PIX Post-Payment] Account created successfully, linking payment...
[PIX Post-Payment] Payment linked successfully: { subscriptionId, planType }
```

### Common Issues

**Issue:** Payment not linked after signup
- **Check:** Does user email match payment email exactly?
- **Check:** Is payment status `approved` in database?
- **Solution:** Call `/api/mercadopago/link-pix-payment` manually

**Issue:** Duplicate subscriptions
- **Check:** Link function checks for existing subscription first
- **Should not happen:** Function returns early if subscription exists

**Issue:** Guest never creates account
- **Status:** Payment stays `approved` indefinitely
- **Action:** Can refund or manually link to email after account creation

---

## Related Documentation

- `PIX_SETUP.md` - PIX payment integration guide
- `SUPABASE_SETUP.md` - Database setup instructions
- `MERCADOPAGO_SETUP.md` - Mercado Pago configuration

---

## Changelog

### 2025-10-27 - Guest Payment Flow Implementation
- Added `approved` and `consumed` payment states
- Created link payment function and endpoint
- Updated webhook to handle guest payments
- Updated signup to automatically link payments
- Migrated existing `paid` records to `consumed`
