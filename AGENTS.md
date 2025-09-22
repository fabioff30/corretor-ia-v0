# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `app/`, where each route folder can include UI, loading states, and API handlers. Shared UI is in `components/`, with interactive pieces marked by `"use client"`. Cross-cutting logic is grouped under `hooks/`, `utils/`, and `types/`. Server-side integrations (Supabase, OpenAI, Mercado Pago) sit in `lib/` and `supabase/`; update schemas alongside `supabase/schema.sql`. UI styling is centralized in `styles/` with Tailwind config, while assets belong in `public/`. Test fixtures and mocks use `__tests__/`, automation scripts are in `actions/` and `scripts/`, and email templates live in `emails/`.

## Build, Test, and Development Commands
- `npm run dev`: Start the local dev server with hot reload on http://localhost:3000.
- `npm run build`: Produce the production bundle and surface type errors.
- `npm run start`: Serve the optimized build; use after `npm run build` to validate.
- `npm run lint`: Enforce ESLint + Prettier rules.
- `npm test`: Execute the Jest suite (React Testing Library + jsdom environment).

## Coding Style & Naming Conventions
Write modern TypeScript with React 18 patterns. Components export PascalCase, hooks begin with `use`, and utilities prefer kebab-case filenames such as `text-correction-form.tsx`. Group imports by origin: external packages, then `@/` aliases, then relative paths. Favor server components; add `"use client"` only when browser APIs or hooks require it. Format via Prettier (mirrors `npm run lint`) and follow Tailwind utility ordering already established in `styles/`.

## Testing Guidelines
Tests run under Jest with jsdom (`jest.config.js`, `jest.setup.ts`). Place specs in `__tests__/` or co-locate as `*.test.tsx`. Cover API routes, webhook flows, Supabase auth, and text-processing utilities. Use React Testing Library patterns (`render`, `screen`, `userEvent`) and keep assertions resilient to copy updates.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) with imperative, present-tense subjects. PRs should summarize changes, call out implementation details, reference issues, and attach UI screenshots or GIFs when applicable. Before requesting review, run `npm run lint`, `npm run build`, and `npm test`, and document any skipped steps.

## Security & Configuration Tips
Copy `.env.example` to `.env.local` per environment. Keep API keys rotated and never committed. When modifying middleware or caching, review `middleware.ts`, `utils/subscription.ts`, and Supabase policies to ensure access stays scoped to authenticated contexts.
