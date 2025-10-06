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
- React Testing Library for component testing
- jsdom environment for DOM testing
- Test setup with proper mocking and polyfills (`jest.setup.ts`)
- API endpoint testing with mock implementations
- Utility function testing (e.g., logger, format utilities)

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.2.4 with App Router
- **UI Library**: React 19 with extensive Radix UI components
- **Styling**: Tailwind CSS with custom theming
- **AI Integration**: OpenAI API via `ai` and `@ai-sdk/openai` packages
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation
- **Testing**: Jest + React Testing Library with jsdom and polyfills
- **Security**: JWT authentication with `jose`, DOMPurify sanitization
- **Database/Cache**: Redis integration via Upstash
- **Type Safety**: Full TypeScript with strict configurations

### Core Business Logic
CorretorIA is a Portuguese text correction application powered by AI. The main workflow:

1. **Text Input**: Users input text through `text-correction-form.tsx` component (character limits: 1500 free, 5000 premium)
2. **API Processing**: Text is sent to `/api/correct/route.ts` which handles:
   - Rate limiting and input validation via middleware
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
- `/api/admin/*` - Administrative functions with JWT authentication
- `/api/admin/auth` - Secure admin authentication endpoint
- `/api/revalidate` - Content revalidation with token protection
- `/api/revalidate/webhook` - Webhook-based content revalidation for blog posts

### API Architecture
All API routes now use shared modules from `lib/api/` for improved maintainability:
- `lib/api/shared-handlers.ts` - Rate limiting, input validation, request parsing
- `lib/api/webhook-client.ts` - Unified webhook client with retry and fallback logic
- `lib/api/error-handlers.ts` - Centralized error handling and fallback responses
- `lib/api/response-normalizer.ts` - Response format normalization across different webhook responses
- `lib/api/daily-rate-limit.ts` - Daily rate limiting for AI detector (Redis-backed)

### Component Architecture
- **Layout Components**: `Header`, `Footer` with consistent theming
- **Server Components**: Static sections converted to server components for better performance (`BenefitsSection`, `FeaturesSection`, `AboutAuthorSection`)
- **Client Components**: Interactive components like `TextCorrectionForm`, `ToneAdjuster`, `JulinhoAssistant`
- **Form Components**: `TextCorrectionForm` as main interaction point
- **UI Components**: Comprehensive Radix UI component library in `/components/ui/`
- **Specialized Components**: `ToneAdjuster`, `TextDiff`, `JulinhoAssistant` (AI chat), `AIDetectorForm`, `AIDetectorRating`
- **Result Components**: `TextCorrectionTabs` for tabbed display of correction results
- **Advertisement Components**: Smart banner system with frequency control and user engagement tracking

### Configuration & Constants
Key configuration in `utils/constants.ts`:
- Character limits: `FREE_CHARACTER_LIMIT` (1500), `PREMIUM_CHARACTER_LIMIT` (5000), `AI_DETECTOR_CHARACTER_LIMIT` (10000)
- Rate limits: `AI_DETECTOR_DAILY_LIMIT` (2 uses per day)
- API timeouts: `API_REQUEST_TIMEOUT` (30s), `FETCH_TIMEOUT` (25s)
- Google Analytics, AdSense, and GTM IDs
- Webhook URLs (Workers API base: `https://workers-api.fabiofariasf.workers.dev`):
  - `WEBHOOK_URL` - `/api/corrigir` (text correction)
  - `PREMIUM_WEBHOOK_URL` - `/api/premium-corrigir` (premium correction)
  - `REWRITE_WEBHOOK_URL` - `/api/reescrever` (text rewriting)
  - `PREMIUM_REWRITE_WEBHOOK_URL` - `/api/premium-reescrever` (premium rewriting)
  - `ANALYSIS_WEBHOOK_URL` - `/api/analysis-ai` (AI content detection)
  - `FALLBACK_WEBHOOK_URL` - same as primary (automatic fallback)
- Authentication: `AUTH_TOKEN` (server-side only)
- Feature flags: `JULINHO_DISABLED` (currently false)

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
- **Analytics**: Google Tag Manager, Meta Pixel, Hotjar
- **Monetization**: Google AdSense with consent management, CleverWebServer script integration
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
- **Rate Limiting**: Redis-backed rate limiting on API endpoints
- **Input Validation**: Multi-layer validation with Zod schemas and pattern matching
- **CORS**: Configured for API routes with no-cache headers
- **Canonical URLs**: SEO optimization via canonical middleware
- **Token Security**: Cryptographically secure tokens with validation

### Performance Considerations
- **Timeouts**: 30-second API timeout (reduced from 60s) with 25s fetch timeout
- **Max Duration**: 60 seconds configured for serverless functions
- **Caching**: Redis-backed caching and API routes configured with no-store
- **Image Optimization**: Disabled for compatibility (`unoptimized: true`)
- **Server Actions**: 2MB body size limit configured
- **Bundle Optimization**: Proper code splitting and lazy loading
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

## 🔧 Environment Setup

### Required Environment Variables
Critical production variables (see `CONFIGURATION.md` for auto-generated tokens):
\`\`\`bash
AUTH_TOKEN=your-secure-32-character-token
REVALIDATION_TOKEN=your-secure-revalidation-token  
WEBHOOK_SECRET=your-secure-webhook-secret
ADMIN_API_KEY=your-secure-admin-api-key
\`\`\`

### Optional Services
\`\`\`bash
# AI Processing
OPENAI_API_KEY=sk-your-key

# Cache & Database
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Payments
MERCADO_PAGO_ACCESS_TOKEN=your-token
\`\`\`

## 📚 Additional Documentation

- **SECURITY.md** - Comprehensive security implementation guide with JWT auth, input validation, and CSP
- **CONFIGURATION.md** - Environment setup with auto-generated secure tokens
- **AGENTS.md** - AI agent integration documentation
- **jest.config.js** - Jest configuration with Next.js integration
- **jest.setup.ts** - Test environment setup with TextEncoder/TextDecoder polyfills and crypto mocks
- **vercel.json** - Deployment configuration
- **actions/revalidate-content.ts** - Server Actions for content cache management

## 🆕 Recent Feature Additions

### AI Content Detector (Latest)
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
