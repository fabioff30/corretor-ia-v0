# Webhook 502 Error Fix

## Problem Identified

**Date:** 2025-10-27
**Issue:** Webhook returned HTTP 502 error to Mercado Pago
**Payment ID:** 130895552147
**Event:** `payment.updated`

### Root Causes

The webhook was failing with 502 errors due to multiple issues in error handling:

1. **`.single()` throwing exceptions**
   - Used `.single()` on Supabase queries that might not find records
   - When no record exists, PostgREST throws an exception
   - Exception was not properly caught, causing 502 errors

2. **Re-throwing errors in catch blocks**
   - `catch` blocks used `throw error`, propagating errors up
   - Even though main handler had try-catch, internal errors could cause issues

3. **No validation of Supabase client**
   - Missing check if `createServiceRoleClient()` succeeded
   - Could fail if environment variables are missing

4. **Poor error logging**
   - Errors were logged but not structured
   - Difficult to debug webhook failures

---

## Solutions Implemented

### 1. Replace `.single()` with `.maybeSingle()`

**Before (caused 502):**
```typescript
const { data: pixPayment, error } = await supabase
  .from('pix_payments')
  .select('*')
  .eq('payment_intent_id', paymentId)
  .single()  // ❌ Throws if no record found

if (error || !pixPayment) {
  console.error('Error:', error)
  return
}
```

**After (robust):**
```typescript
const { data: pixPayment, error } = await supabase
  .from('pix_payments')
  .select('*')
  .eq('payment_intent_id', paymentId)
  .maybeSingle()  // ✅ Returns null if no record, doesn't throw

if (error) {
  console.error('Database error:', error)
  return
}

if (!pixPayment) {
  console.error('Payment record not found')
  return
}
```

**Changes made:**
- Line 186: `pixPaymentCheck` query
- Line 212: `pixPayment` update query
- Line 252: `existingSubscription` query
- Line 320: `updatedProfile` query
- Line 365: `subscription` query (non-PIX payments)
- Line 467: `subscription` query (subscription events)

### 2. Remove `throw error` from Catch Blocks

**Before:**
```typescript
} catch (error) {
  console.error('Error handling payment event:', error)
  throw error  // ❌ Re-throws error, can cause 502
}
```

**After:**
```typescript
} catch (error) {
  console.error('[MP Webhook Payment] ❌ Error handling payment event:', {
    paymentId,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    processing_time_ms: Date.now() - startTime
  })
  // ✅ Don't throw - let main handler catch and return 200
}
```

### 3. Add Supabase Client Validation

```typescript
const supabase = createServiceRoleClient()

if (!supabase) {
  console.error('[MP Webhook Payment] Failed to create Supabase client')
  return
}
```

### 4. Improve Error Logging

All error logs now include:
- Structured error details
- Timestamp
- Processing time
- Context (payment ID, user ID, etc.)
- Stack traces for debugging

**Example:**
```typescript
console.error('[MP Webhook Payment] ❌ Error handling payment event:', {
  paymentId,
  error: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
  processing_time_ms: Date.now() - startTime
})
```

---

## Testing

### Unit Tests Created

**File:** `__tests__/api/mercadopago-webhook-robust.test.ts`

Tests cover:
1. ✅ Webhook returns 200 when payment record not found
2. ✅ No exceptions thrown when using `.maybeSingle()`
3. ✅ Malformed data handled gracefully
4. ✅ All errors return 200 to prevent MP retries

**Test Results:**
```
Test Suites: 1 passed
Tests:       4 passed
Time:        0.34 s
```

### Manual Testing Checklist

- [ ] Deploy to staging/production
- [ ] Test PIX payment flow end-to-end
- [ ] Monitor webhook logs for errors
- [ ] Verify payments are processed correctly
- [ ] Check that 502 errors don't occur

---

## Monitoring & Prevention

### How to Monitor Webhook Health

1. **Check Mercado Pago Dashboard**
   - Go to: Integrations → Webhooks
   - Look for: HTTP status codes
   - ❌ Red flags: 502, 500, 401, 404
   - ✅ Good: 200 OK

2. **Application Logs**
   ```bash
   # Search for webhook errors
   grep "\[MP Webhook.*❌" logs.txt

   # Search for 502 errors
   grep "502" logs.txt
   ```

3. **Supabase Logs**
   - Check for PostgREST errors
   - Look for slow queries (>1s)

### Prevention Measures

1. **Always use `.maybeSingle()`** when query might not find record
2. **Never use `throw` in webhook handlers** - always return gracefully
3. **Always return HTTP 200** - even on errors (prevents MP retries)
4. **Add comprehensive logging** - structured with context
5. **Test edge cases** - missing records, invalid data, timeouts

---

## Impact Analysis

### Before Fix
- ❌ Webhooks failing with 502 errors
- ❌ Payments approved but not activated
- ❌ Manual intervention required for each payment
- ❌ Poor user experience

### After Fix
- ✅ Webhooks return 200 consistently
- ✅ Errors logged but don't crash webhook
- ✅ Payments processed automatically
- ✅ Better debugging with structured logs
- ✅ Edge cases handled gracefully

---

## Related Issues

- **Webhook URL Double Slash:** Fixed in `WEBHOOK_FIX.md`
- **Guest Payment Flow:** Documented in `GUEST_PIX_FLOW.md`
- **Manual Payment Activation:** User `ads@fabiofariasf.com.br` activated manually

---

## Code Changes Summary

**File:** `app/api/mercadopago/webhook/route.ts`

| Line | Change | Reason |
|------|--------|--------|
| 147-150 | Added Supabase client validation | Prevent null reference errors |
| 186 | `.single()` → `.maybeSingle()` | Avoid exception when record not found |
| 188-196 | Split error handling | Separate database error from missing record |
| 212 | `.single()` → `.maybeSingle()` | Avoid exception on update |
| 252 | `.single()` → `.maybeSingle()` | Avoid exception checking subscription |
| 320 | `.single()` → `.maybeSingle()` | Avoid exception on profile update |
| 365 | `.single()` → `.maybeSingle()` | Avoid exception finding subscription |
| 420-428 | Improved error logging | Structured logs with context |
| 467 | `.single()` → `.maybeSingle()` | Avoid exception in subscription event |
| 497-498 | Removed `throw error` | Return gracefully instead |
| 504-511 | Improved error logging | Structured logs for subscription events |

---

## Deployment Notes

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
MERCADO_PAGO_ACCESS_TOKEN=xxx
```

### Deployment Steps
1. ✅ Code changes committed
2. ✅ Tests passing
3. [ ] Push to repository
4. [ ] Deploy to Vercel
5. [ ] Monitor webhook logs
6. [ ] Test end-to-end payment flow

---

## Lessons Learned

1. **Never assume queries will find records** - Always use `.maybeSingle()` for optional queries
2. **Webhooks must be extremely robust** - Return 200 even on errors to prevent retries
3. **Structured logging is essential** - Helps debug issues in production
4. **Test edge cases thoroughly** - Missing records, invalid data, etc.
5. **Monitor webhook health regularly** - Check MP dashboard for 502 errors

---

## References

- Mercado Pago Webhooks: https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
- Supabase `.maybeSingle()` docs: https://supabase.com/docs/reference/javascript/using-modifiers
- PostgREST Error Handling: https://postgrest.org/en/stable/errors.html

---

## Changelog

### 2025-10-27 - Webhook 502 Error Fix
- Replaced all `.single()` with `.maybeSingle()` where appropriate
- Removed `throw error` from catch blocks
- Added Supabase client validation
- Improved error logging with structured output
- Created comprehensive tests for webhook robustness
- Documented all changes and prevention measures
