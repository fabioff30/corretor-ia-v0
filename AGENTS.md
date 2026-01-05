# Repository Guidelines

## Project Structure & Modules
- Next.js App Router lives in `app/`; API handlers are in `app/api/*` and feature pages under route folders (e.g., `app/dashboard`, `app/presente`).
- UI primitives stay in `components/ui/`; composite widgets in `components/`; context providers in `components/providers/`.
- Domain logic and integrations: `lib/` (payments, Supabase, webhook helpers), `utils/` (parsers, logging), `hooks/` (client state), `types/` (Supabase schema + app models).
- Data layer: SQL and migrations in `supabase/`; generated Supabase types in `types/supabase.ts`.
- Tests live in `__tests__/` (Jest + Happy DOM); fixtures/mocks in `__mocks__/`. Static assets stay in `public/`.

## Build, Test & Dev Commands
- Install: `pnpm install`.
- Local dev: `pnpm dev` (http://localhost:3000).
- Quality gates: `pnpm lint` (Next + TypeScript rules), `pnpm typecheck`, `pnpm typecheck:tests`, `pnpm test` (Jest), `pnpm build` (production bundle), `pnpm start` to serve the build.
- Common scripts: `pnpm format` (if present) before commits; prefer `pnpm` for all tasks to match lockfile.

## Coding Style & Naming
- TypeScript first; keep `strict` happy. Use `@/*` aliases over deep relatives. Prefer server components; add `"use client"` only when needed.
- Components in PascalCase files; hooks prefixed with `use`; API routes stay lowercase-hyphenated.
- Import order: externals → `@/` aliases → relatives. Keep functions small; share helpers in `lib/`/`utils/` before new copies.
- Tailwind is the baseline—reuse design tokens and avoid ad-hoc inline styles. Stick to existing typography/spacing scales.

## Testing Expectations
- Add/extend tests for API handlers, Supabase edge cases, billing flows, and AI detector/text tools. Place alongside code or in `__tests__/`.
- Mock external services (Supabase, Stripe/MercadoPago, OpenAI, Redis) and network calls; avoid hitting real endpoints.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tests`, and `pnpm test` before PRs; record any skipped checks in the PR.

## Commits & PRs
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`). Keep scopes small and messages in present tense.
- PRs should include: what/why, manual verification steps, linked issues, and screenshots/recordings for UI or flow changes. Ensure regression-sensitive areas (auth, payments) are called out.

## Security & Config
- Never commit secrets; use `.env.local` (see `docs/CONFIGURATION.md`). Rotate keys if leaked.
- Respect middleware/auth: route changes in `middleware.ts`, `app/api/*`, or `actions/` must preserve access control and caching semantics.
- Client code should call internal API routes instead of external providers directly to avoid exposing tokens.
