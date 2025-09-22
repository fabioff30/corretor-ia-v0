# Security Key Risks

1. **Unprotected Supabase Service Role Endpoints**  
   - Files: `app/api/subscriptions/create/route.ts`, `app/api/subscriptions/status/route.ts`, `app/api/subscriptions/cancel/route.ts`  
   - Issue: API routes use the Supabase service-role key without authenticating the requester. Any user can invoke them to create/cancel subscriptions or read other users' data, bypassing row-level security.  
   - Mitigation: Require server-side auth (Supabase session, JWT, or admin token) before allowing access. Remove service-role operations from unauthenticated handlers.

2. **Mercado Pago Webhook Trusts Unsigned Payloads**  
   - File: `app/api/webhooks/mercadopago-subscription/route.ts`  
   - Issue: Accepts webhook JSON without validating Mercado Pago signatures. Attackers can forge "approved" payments to grant themselves premium access.  
   - Mitigation: Verify Mercado Pago signatures/HMAC headers before processing payloads.

3. **Hardcoded Secret Fallbacks**  
   - Files: `utils/constants.ts`, `lib/auth.ts`  
   - Issue: Defaults expose `AUTH_TOKEN` and admin JWT secret when env vars are missing, enabling anyone with repo access to impersonate services/admins.  
   - Mitigation: Remove default secrets and fail fast if required env vars are absent in production.

4. **Insecure Admin Password Handling**  
   - File: `lib/auth.ts`  
   - Issue: Production login still accepts `NEXT_PUBLIC_ADMIN_PASSWORD` (exposed to clients) and development falls back to `admin123`.  
   - Mitigation: Require `ADMIN_PASSWORD` in production and disallow public/dev defaults; enforce strong secret rotation.

