# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Scripts
- `pnpm dev` (or `npm run dev`) - Start development server (Next.js 15)
- `pnpm build` - Build production application
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint (note: linting ignored during builds)
- `pnpm test` - Run Jest test suite

### Package Manager
This project uses `pnpm` as the package manager. Always use `pnpm install` to install dependencies and `pnpm add <package>` to add new packages.

### Testing Framework
Jest is configured with:
- `@happy-dom/jest-environment` for fast DOM testing
- React Testing Library for component testing
- Test setup with proper mocking and polyfills (`jest.setup.ts`)
- API endpoint testing with mock implementations
- Run specific tests: `pnpm test -- <test-file-path>`

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.5.4 with App Router
- **UI Library**: React 19 with extensive Radix UI components
- **Styling**: Tailwind CSS with custom theming
- **AI Integration**: OpenAI API via `ai` and `@ai-sdk/openai` packages
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation
- **Testing**: Jest + React Testing Library with @happy-dom
- **Security**: JWT authentication with `jose`, DOMPurify sanitization
- **Database/Cache**: Supabase (PostgreSQL) + Upstash Redis
- **Payments**: Mercado Pago (PIX + recurring subscriptions) + Stripe
- **Type Safety**: Full TypeScript with strict configurations

### Core Business Logic
CorretorIA is a Portuguese text correction application powered by AI. The main workflow:

1. **Text Input**: Users input text through `text-correction-form.tsx` component (character limits: 1500 free, 5000 premium)
2. **API Processing**: Text is sent to `/api/correct/route.ts` which handles:
   - Rate limiting and input validation via shared handlers
   - Multiple webhook endpoints for different correction modes (primary + fallback)
   - Automatic fallback on errors (401, timeout, malformed responses)
   - Authentication with AUTH_TOKEN and Vercel bypass tokens
3. **Response Processing**: Corrected text and evaluation data returned to client
4. **Display**: Results shown with diff highlighting and detailed analysis via `TextCorrectionTabs`

### Key API Endpoints
- `/api/correct` - Main text correction endpoint (refactored with shared modules)
- `/api/rewrite` - Text rewriting functionality (refactored with shared modules)
- `/api/tone` - Tone adjustment processing (refactored with shared modules)
- `/api/ai-detector` - AI content detection with brazilianism analysis (10,000 char limit, 2 uses/day)
- `/api/feedback` - User feedback collection
- `/api/julinho` - Julinho AI assistant chat endpoint
- `/api/admin/*` - Administrative functions with JWT authentication
- `/api/admin/auth` - Secure admin authentication endpoint
- `/api/mercadopago/*` - Payment processing (PIX + subscriptions)
- `/api/stripe/*` - Alternative payment processing
- `/api/revalidate` - Content revalidation with token protection
- `/api/revalidate/webhook` - Webhook-based content revalidation for blog posts

### API Architecture
All API routes now use shared modules from `lib/api/` for improved maintainability:
- `lib/api/shared-handlers.ts` - Rate limiting, input validation, request parsing, text sanitization
- `lib/api/webhook-client.ts` - Unified webhook client with retry and fallback logic
- `lib/api/error-handlers.ts` - Centralized error handling and fallback responses
- `lib/api/response-normalizer.ts` - Response format normalization across different webhook responses
- `lib/api/daily-rate-limit.ts` - Daily rate limiting for AI detector (Redis-backed)

### BFF Architecture Pattern (Backend-For-Frontend)

**IMPORTANT**: This project implements a Backend-For-Frontend (BFF) pattern.

#### Architecture Flow
```
Client (Browser)
    ↓ fetch()
Next.js API Routes (/api/correct, /api/rewrite, /api/ai-detector)
    ↓ SERVER-SIDE ONLY
    ↓ validateAndSanitizeInput() + applyRateLimit()
    ↓ callWebhook() with AUTH_TOKEN
Cloudflare Workers API (workers-api.fabiofariasf.workers.dev)
```

#### Why BFF vs Direct Calls?

**Current Implementation (BFF)**:
- ✅ AUTH_TOKEN remains server-side only (never exposed to client)
- ✅ Centralized rate limiting and input validation
- ✅ Consistent error handling and fallback logic
- ✅ Text sanitization before sending to workers
- ✅ CF-Ray header forwarding for support correlation
- ✅ Metadata logging for auditing (promptVersion, termsVersion)

**Direct Calls would expose**:
- ❌ AUTH_TOKEN in client-side code
- ❌ No centralized validation or sanitization

#### Implementation Details

1. **Error Responses**: All errors follow the format `{ error: string, message?: string, details?: string[] }`
2. **Timeouts**:
   - Standard endpoints: 90 seconds
   - Premium endpoints: 120 seconds (for ultrathink mode)
   - AI detector: 120 seconds (for ultrathink processing)
   - Vercel function max duration: 120 seconds (configured in vercel.json)
3. **Health Checks**: GET endpoints return `{ "status": "OK" }` for monitoring
4. **Headers**: Responses include:
   - `X-Request-ID` - Internal request ID for debugging
   - `CF-Ray` - Cloudflare Ray ID when available (for support)
   - `X-Prompt-Version`, `X-Terms-Version` - AI detector metadata for auditing
   - `X-Processing-Time` - Request processing duration
5. **Input Sanitization**: Text is automatically sanitized to remove excessive whitespace

### Component Architecture
- **Layout Components**: `Header`, `Footer` with consistent theming
- **Server Components**: Static sections converted to server components for better performance (`BenefitsSection`, `FeaturesSection`, `AboutAuthorSection`)
- **Client Components**: Interactive components like `TextCorrectionForm`, `ToneAdjuster`, `JulinhoAssistant`
- **Form Components**: `TextCorrectionForm` as main interaction point
- **UI Components**: Comprehensive Radix UI component library in `/components/ui/`
- **Specialized Components**: `ToneAdjuster`, `TextDiff`, `JulinhoAssistant` (AI chat), `AIDetectorForm`, `AIDetectorRating`
- **Result Components**: `TextCorrectionTabs` for tabbed display of correction results
- **Advertisement Components**: Smart banner system with frequency control and user engagement tracking
- **Admin Components**: Located in `/components/admin/` for administrative dashboard
- **Auth Components**: Located in `/components/auth/` for authentication flows

### Configuration & Constants
Key configuration in `utils/constants.ts`:
- Character limits: `FREE_CHARACTER_LIMIT` (1500), `PREMIUM_CHARACTER_LIMIT` (5000), `AI_DETECTOR_CHARACTER_LIMIT` (10000)
- Daily usage limits (configured in Supabase `plan_limits_config` table):
  - Free plan: 3 corrections/day, 3 rewrites/day, 1 AI analysis/day
  - Pro/Admin plan: unlimited (-1) for all operations
  - Enforced via `canUserPerformOperation()` and `incrementUserUsage()` in `/api/correct` and `/api/rewrite`
- Rate limits: `AI_DETECTOR_DAILY_LIMIT` (2 uses per day)
- API timeouts: `API_REQUEST_TIMEOUT` (90s), `PREMIUM_API_TIMEOUT` (120s), `AI_DETECTOR_TIMEOUT` (120s)
- Google Analytics, AdSense, and GTM IDs
- Webhook URLs (Workers API base: `https://workers-api.fabiofariasf.workers.dev`):
  - `WEBHOOK_URL` - `/api/corrigir` (text correction)
  - `PREMIUM_WEBHOOK_URL` - `/api/premium-corrigir` (premium correction)
  - `REWRITE_WEBHOOK_URL` - `/api/reescrever` (text rewriting)
  - `PREMIUM_REWRITE_WEBHOOK_URL` - `/api/premium-reescrever` (premium rewriting)
  - `ANALYSIS_WEBHOOK_URL` - `/api/analysis-ai` (AI content detection)
  - `FALLBACK_WEBHOOK_URL` - same as primary (automatic fallback)
- Authentication: `AUTH_TOKEN` (server-side only)
- Feature flags: `JULINHO_DISABLED` (currently false), `DISABLE_ADS` (currently true)

### Database Architecture (Supabase)

#### Core Tables
- `profiles` - User profiles with plan information (free, pro, admin)
- `user_corrections` - Historical record of corrections, rewrites, and AI analyses
- `usage_limits` - Daily usage tracking per user (corrections_used, rewrites_used, ai_analyses_used)
- `plan_limits_config` - Configurable limits per plan type (-1 = unlimited)
- `limits_change_history` - Audit log of admin changes to plan limits
- `subscriptions` - Mercado Pago subscription records
- `payment_transactions` - Payment history and transaction logs
- `pix_payments` - PIX payment records with QR codes and status

#### Key Database Functions
- `handle_new_user()` - Automatically creates profile on user signup
- `check_user_limit(user_id, operation_type)` - Verifies if user can perform operation
- `increment_usage(user_id, operation_type)` - Increments usage counter
- `activate_subscription(user_id, subscription_id)` - Activates premium subscription
- `cancel_subscription(subscription_id)` - Cancels subscription with grace period
- `check_past_due_subscriptions()` - Marks overdue subscriptions
- `process_expired_subscriptions()` - Downgrades expired subscriptions
- `cleanup_old_usage_limits()` - Removes usage records older than 30 days

#### Row Level Security (RLS)
All tables have RLS enabled with policies for:
- Users can only view/modify their own data
- Admins have full access (checked via JWT or profiles table)
- Service role bypasses RLS for system operations

See `SUPABASE_SETUP.md` for complete database setup instructions.

### Payment Integration

> ⚠️ **CRITICAL RULE**: All payment flows MUST follow the exact same pattern as `/premium`. This means:
> 1. **Authentication BEFORE payment**: User must be logged in or register BEFORE generating PIX/payment
> 2. **No guest payments**: Never allow payment generation without an authenticated user
> 3. **Registration dialog pattern**: Use `RegisterForPixDialog` pattern (or adapted version like `RegisterForBundleDialog`)
> 4. **Auto-generate after registration**: Store pending data in localStorage, then auto-trigger payment after successful registration
> 5. **Reference implementation**: Always check `/app/premium/page.tsx` and `/components/premium/` as the canonical implementation
>
> This prevents 401 errors on payment verification endpoints and ensures all payments are properly linked to user accounts.

#### Mercado Pago (Primary - Brazil)
- **PIX Payments**: One-time payments for subscriptions
  - 30-minute expiration on QR codes
  - Real-time webhook confirmation
  - Automatic subscription activation
- **Recurring Subscriptions**: Monthly/annual plans with automatic renewal
  - HMAC-SHA256 webhook validation
  - Subscription status tracking
  - Grace period on cancellation
- **Setup**: See `MERCADOPAGO_SETUP.md` and `PIX_SETUP.md`
- **Client Library**: `lib/mercadopago/` with full CRUD operations
- **API Routes**: `/api/mercadopago/*`

#### Stripe (Alternative/International)
- Payment Intents for one-time payments
- Subscription management
- Setup: See `STRIPE_PRODUCTION_SETUP.md`
- Client library: `lib/stripe/`
- API routes: `/api/stripe/*`

**Payment Flow**:
1. User selects plan on `/premium` page
2. Client calls `/api/mercadopago/create-pix-payment` or `/api/mercadopago/create-subscription`
3. User completes payment (PIX or credit card)
4. Webhook validates payment and updates Supabase
5. User profile upgraded to `pro` plan
6. Premium features unlocked immediately

### External Integrations
- **AI Services**: Cloudflare Workers API (`workers-api.fabiofariasf.workers.dev`) for text correction, rewriting, and AI analysis
  - POST `/api/corrigir` - Text correction with evaluation
  - POST `/api/premium-corrigir` - Premium correction with advanced models
  - POST `/api/reescrever` - Text rewriting with style options
  - POST `/api/premium-reescrever` - Premium rewriting
  - POST `/api/analysis-ai` - AI-generated content detection with brazilianism analysis, grammar summary, and confidence scoring
- **Payments**: Mercado Pago integration for recurring subscriptions
  - Subscription management with automatic renewals
  - Webhook validation with HMAC-SHA256
  - Full payment transaction history
  - See `MERCADOPAGO_SETUP.md` for setup guide
- **Analytics**:
  - **Google Analytics 4**: Official `@next/third-parties/google` integration
    - Cookie consent-aware loading via `GoogleAnalyticsWrapper`
    - Custom event tracking with `useGoogleAnalytics` hook
    - Credentials stored securely in Vercel Blob Storage
    - See `GOOGLE_ANALYTICS_SETUP.md` for complete setup guide
  - **Google Tag Manager**: Enhanced event tracking and tag management
  - **Meta Pixel**: Facebook conversion tracking with consent management
  - **Hotjar**: User behavior analytics and heatmaps
- **Monetization**: Google AdSense with consent management
- **Advertisement**: Smart banner system with engagement tracking and frequency control
- **Email**: React Email components for notifications
- **Content Management**: WordPress API integration for blog content with automatic revalidation

### Middleware & Security

#### ⚡ Recent Security Enhancements
- **JWT Authentication**: Server-side JWT with HTTP-only cookies (`lib/auth.ts`)
- **Admin Authentication**: Secure admin middleware (`middleware/admin-auth.ts`)
- **Input Sanitization**: Enhanced with DOMPurify (`utils/html-sanitizer.ts`)
- **Environment Validation**: Production-ready validation (`utils/env-validation.ts`)
- **Security Headers**: Comprehensive security headers (`middleware/security-headers.ts`)

#### Core Security Features
- **Rate Limiting**: Redis-backed rate limiting on API endpoints with in-memory fallback
- **Input Validation**: Multi-layer validation with Zod schemas and pattern matching
- **CORS**: Configured for API routes with no-cache headers
- **Canonical URLs**: SEO optimization via canonical middleware
- **Token Security**: Cryptographically secure tokens with validation
- **CSP**: Content Security Policy headers for XSS protection
- **Payment Security**: HMAC webhook validation, secure token handling

See `SECURITY.md` for complete security documentation.

### Performance Considerations
- **Timeouts**: 90-120 second API timeouts depending on endpoint
- **Max Duration**: 120 seconds configured for serverless functions in vercel.json
- **Caching**: Redis-backed caching and API routes configured with no-store
- **Image Optimization**: Disabled for compatibility (`unoptimized: true`)
- **Server Actions**: 2MB body size limit configured
- **Bundle Optimization**: Proper code splitting and lazy loading, minimization disabled for build compatibility
- **Build Optimization**: TypeScript and ESLint errors ignored during builds

### Error Handling Strategy
Robust error handling with multiple fallback levels:
1. Primary webhook failure → automatic fallback webhook (FALLBACK_WEBHOOK_URL)
2. 401 authentication errors → immediate fallback retry
3. Processing errors → fallback response with original text and generic evaluation
4. Network timeouts → user-friendly 504 timeout messages
5. Malformed responses → graceful fallback with original text
6. All errors logged with request IDs and context

### Development Notes
- TypeScript and ESLint errors ignored during builds (configured in `next.config.mjs`)
- React Strict Mode enabled
- Extensive tracking and analytics integration
- Mobile-responsive design with device detection
- Server Actions for content revalidation with Next.js cache management
- Dynamic banner display system with localStorage-based frequency control
- Enhanced user engagement tracking for advertisement optimization
- Webpack minimization disabled for dev builds

## 🔧 Environment Setup

### Required Environment Variables
Critical production variables (see `CONFIGURATION.md` for auto-generated tokens):
```bash
# Authentication & Security
AUTH_TOKEN=your-secure-32-character-token
REVALIDATION_TOKEN=your-secure-revalidation-token
WEBHOOK_SECRET=your-secure-webhook-secret
ADMIN_API_KEY=your-secure-admin-api-key

# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mercado Pago (Primary Payment Provider)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-your-access-token
MERCADO_PAGO_PUBLIC_KEY=APP_USR-your-public-key
MERCADO_PAGO_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-your-public-key
```

### Optional Services
```bash
# AI Processing
OPENAI_API_KEY=sk-your-key

# Cache & Database
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Alternative Payment (Stripe)
STRIPE_SECRET_KEY=sk_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_your_key

# Google Analytics 4
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX
GOOGLE_CLOUD_CREDENTIALS_BLOB_URL=https://blob.vercel-storage.com/...

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXX
```

## 🔧 Common Issues & Solutions

### Invalid Keep-Alive Header Error
**Error**: `Error [InvalidArgumentError]: invalid keep-alive header` with code `UND_ERR_INVALID_ARG`

**Cause**: Node.js fetch (undici) automatically manages connection keep-alive and doesn't allow manual `Connection` or `Keep-Alive` headers.

**Solution**: Remove these headers from fetch requests. Node.js handles keep-alive automatically:
```typescript
// ❌ WRONG - causes UND_ERR_INVALID_ARG
headers: {
  "Connection": "keep-alive",
  "Keep-Alive": "timeout=5, max=100"
}

// ✅ CORRECT - let Node.js manage it
headers: {
  "Content-Type": "application/json"
}
```

**Fixed in**: `lib/api/webhook-client.ts` (removed manual keep-alive headers)

### Supabase Connection Issues
- Verify environment variables are correctly set
- Check RLS policies if getting "permission denied" errors
- Use `SUPABASE_SERVICE_ROLE_KEY` for server-side operations that bypass RLS

### Payment Webhook Failures
- Verify webhook secret matches Mercado Pago dashboard
- Check webhook signature validation in logs
- Ensure webhook URL is publicly accessible (no localhost in production)
- Review `payment_transactions` table for failed attempts

## 📚 Additional Documentation

- **SECURITY.md** - Comprehensive security implementation guide with JWT auth, input validation, and CSP
- **CONFIGURATION.md** - Environment setup with auto-generated secure tokens
- **SUPABASE_SETUP.md** - Complete database setup guide with migrations and RLS policies
- **MERCADOPAGO_SETUP.md** - Mercado Pago integration guide for subscriptions
- **PIX_SETUP.md** - PIX payment setup and troubleshooting
- **STRIPE_PRODUCTION_SETUP.md** - Alternative payment provider setup
- **GOOGLE_ANALYTICS_SETUP.md** - Complete Google Analytics 4 integration guide with Vercel Blob credentials storage
- **AGENTS.md** - AI agent integration documentation
- **jest.config.js** - Jest configuration with Next.js integration
- **jest.setup.ts** - Test environment setup with TextEncoder/TextDecoder polyfills and crypto mocks
- **vercel.json** - Deployment configuration with function timeouts
- **actions/revalidate-content.ts** - Server Actions for content cache management

## 🆕 Recent Feature Additions

### PIX Payment Integration (Latest)
- One-time PIX payments for Premium subscriptions
- QR Code generation with 30-minute expiration
- Real-time payment confirmation via webhooks
- Automatic subscription activation on payment
- Modal component with payment status polling
- See `PIX_SETUP.md` for implementation details

### AI Content Detector
- New `/api/ai-detector` endpoint for detecting AI-generated content
- Advanced analysis including:
  - AI vs Human content classification with confidence scores
  - Brazilian Portuguese language patterns detection (brazilianism analysis)
  - Grammar summary with error counts and categorization
  - Text statistics (word count, sentence length, etc.)
- Daily rate limiting (2 uses per day per IP/session)
- Character limit: 10,000 characters
- Components: `AIDetectorForm`, `AIDetectorRating`
- Feedback system for user rating and improvements

### Supabase Integration
- Full authentication system (email/password + Google OAuth)
- User profiles with plan management (free, pro, admin)
- Usage tracking and limit enforcement
- Historical corrections storage
- Admin dashboard for user and limit management

### Custom Tone Adjustment
- `/api/custom-tone-webhook` endpoint for processing custom tone instructions
- External webhook integration with fallback handling
- Graceful error handling to maintain user experience

### Enhanced Banner System
- Smart advertisement banner rotation system with engagement tracking
- Frequency control to avoid banner fatigue (`utils/banner-frequency.ts`)
- User interaction tracking for optimized display timing (`utils/track-banner-interaction.ts`)
- Multiple banner variants with UTM parameter tracking

### Content Management Improvements
- Server Actions for efficient content revalidation
- WordPress integration with automatic cache invalidation
- Blog content synchronization with sitemap regeneration

### Testing Infrastructure
- Comprehensive test setup with polyfills for Node.js/JSDOM environment
- API endpoint testing framework
- Utility function test coverage
