# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Scripts
- `npm run dev` - Start development server (Next.js 14)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (note: linting ignored during builds)

### Package Manager
This project uses `pnpm` as the package manager based on `pnpm-lock.yaml`. Use `pnpm install` to install dependencies.

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18 with extensive Radix UI components
- **Styling**: Tailwind CSS with custom theming
- **AI Integration**: OpenAI API via `ai` and `@ai-sdk/openai` packages
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation

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
- `/api/feedback` - User feedback collection
- `/api/mercadopago/*` - Payment processing integration
- `/api/admin/*` - Administrative functions

### Component Architecture
- **Layout Components**: `Header`, `Footer` with consistent theming
- **Page Sections**: Modular sections like `HeroSection`, `BenefitsSection`, etc.
- **Form Components**: `TextCorrectionForm` as main interaction point
- **UI Components**: Comprehensive Radix UI component library in `/components/ui/`
- **Specialized Components**: `ToneAdjuster`, `TextDiff`, `JulinhoAssistant` (AI chat)

### Configuration & Constants
Key configuration in `utils/constants.ts`:
- Character limits and API timeouts
- Google Analytics, AdSense, and GTM IDs
- Webhook URLs for different correction services
- Feature flags (e.g., `JULINHO_DISABLED`)

### External Integrations
- **AI Services**: Primary and fallback webhook endpoints for text correction
- **Analytics**: Google Tag Manager, Meta Pixel, Hotjar
- **Monetization**: Google AdSense with consent management
- **Payments**: MercadoPago integration
- **Email**: React Email components for notifications

### Middleware & Security
- **Rate Limiting**: Applied to API endpoints
- **Input Validation**: Sanitization and validation middleware
- **CORS**: Configured for API routes with no-cache headers
- **Canonical URLs**: SEO optimization via canonical middleware

### Performance Considerations
- **Timeouts**: 60-second API timeout with fallback mechanisms
- **Caching**: API routes configured with no-store caching
- **Image Optimization**: Disabled for compatibility
- **Server Actions**: 2MB body size limit configured

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