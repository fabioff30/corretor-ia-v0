# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Scripts
- `npm run dev` - Start development server (Next.js 14)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (note: linting ignored during builds)
- `npm run test` - Run Jest test suite

### Package Manager
This project uses `pnpm` as the package manager based on `pnpm-lock.yaml`. Use `pnpm install` to install dependencies.

### Testing Framework
Jest is configured with:
- React Testing Library for component testing
- jsdom environment for DOM testing
- Test setup with proper mocking and polyfills (`jest.setup.ts`)
- API endpoint testing with mock implementations
- Utility function testing (e.g., logger, format utilities)

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18 with extensive Radix UI components
- **Styling**: Tailwind CSS with custom theming
- **AI Integration**: OpenAI API via `ai` and `@ai-sdk/openai` packages
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation
- **Testing**: Jest + React Testing Library with jsdom
- **Security**: JWT authentication with `jose`, DOMPurify sanitization
- **Database/Cache**: Redis integration via Upstash
- **Type Safety**: Full TypeScript with strict configurations

### Core Business Logic
CorretorIA is a Portuguese text correction application powered by AI. The main workflow:

1. **Text Input**: Users input text through `TextCorrectionForm` component (character limits: 1500 free, 5000 premium)
2. **API Processing**: Text is sent to `/api/correct/route.ts` which handles:
   - Rate limiting and input validation via middleware
   - Multiple webhook endpoints for different correction modes
   - Fallback mechanisms and error handling
3. **Response Processing**: Corrected text and evaluation data returned to client
4. **Display**: Results shown with diff highlighting and detailed analysis

### Key API Endpoints
- `/api/correct` - Main text correction endpoint with comprehensive error handling
- `/api/rewrite` - Text rewriting functionality  
- `/api/custom-tone-webhook` - Custom tone adjustment processing with external webhook integration
- `/api/feedback` - User feedback collection
- `/api/mercadopago/*` - Payment processing integration
- `/api/admin/*` - Administrative functions with JWT authentication
- `/api/admin/auth` - Secure admin authentication endpoint
- `/api/revalidate` - Content revalidation with token protection
- `/api/revalidate/webhook` - Webhook-based content revalidation for blog posts

### Component Architecture
- **Layout Components**: `Header`, `Footer` with consistent theming
- **Page Sections**: Modular sections like `HeroSection`, `BenefitsSection`, etc.
- **Form Components**: `TextCorrectionForm` as main interaction point
- **UI Components**: Comprehensive Radix UI component library in `/components/ui/`
- **Specialized Components**: `ToneAdjuster`, `TextDiff`, `JulinhoAssistant` (AI chat)
- **Result Components**: `TextCorrectionTabs` for tabbed display of correction results
- **Advertisement Components**: Smart banner system with frequency control and user engagement tracking

### Configuration & Constants
Key configuration in `utils/constants.ts`:
- Character limits and API timeouts
- Google Analytics, AdSense, and GTM IDs
- Webhook URLs for different correction services
- Feature flags (e.g., `JULINHO_DISABLED`)

### External Integrations
- **AI Services**: Primary and fallback webhook endpoints for text correction and custom tone adjustment
- **Analytics**: Google Tag Manager, Meta Pixel, Hotjar
- **Monetization**: Google AdSense with consent management, CleverWebServer script integration
- **Advertisement**: Smart banner system with engagement tracking and frequency control
- **Payments**: MercadoPago integration
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
- **Timeouts**: 60-second API timeout with fallback mechanisms
- **Caching**: Redis-backed caching and API routes configured with no-store
- **Image Optimization**: Disabled for compatibility
- **Server Actions**: 2MB body size limit configured
- **Bundle Optimization**: Proper code splitting and lazy loading

### Error Handling Strategy
Robust error handling with multiple fallback levels:
1. Primary webhook failure → fallback webhook
2. Processing errors → fallback response with original text
3. Network timeouts → user-friendly timeout messages
4. Comprehensive logging with request IDs

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

- **SECURITY.md** - Comprehensive security implementation guide
- **CONFIGURATION.md** - Environment setup and configuration
- **AGENTS.md** - AI agent integration documentation
- **jest.config.js** - Testing configuration
- **jest.setup.ts** - Test environment setup with polyfills and mocks
- **vercel.json** - Deployment configuration
- **actions/revalidate-content.ts** - Server Actions for content cache management

## 🆕 Recent Feature Additions

### Custom Tone Adjustment
- New `/api/custom-tone-webhook` endpoint for processing custom tone instructions
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
