# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts App Router pages, layouts, and route handlers; import shared code with the `@/` alias.
- Primitive building blocks stay in `components/ui/`; feature assemblies (dashboards, payment flows) belong in `components/`.
- Share logic through `hooks/`, `utils/`, `lib/`, `contexts/`, and type definitions in `types/`.
- Automations and maintenance jobs live in `actions/` and `scripts/`; transactional emails sit in `emails/`; static assets belong in `public/`.
- Guard authentication and caching centrally via `middleware.ts` and `utils/cache-config.ts`.

## Build, Test, and Development Commands
- `npm run dev` boots the Next.js dev server on `http://localhost:3000`.
- `npm run build` compiles the production bundle and performs type checking.
- `npm run start` serves the prebuilt `.next/` output for smoke testing.
- `npm run lint` enforces ESLint and Prettier rules; use `npm run lint -- --fix` to autofix.
- `npm test` runs Jest with the Happy DOM environment and React Testing Library.

## Coding Style & Naming Conventions
- Write strict TypeScript with double quotes, two-space indentation, and no semicolons.
- Order imports: external packages, then `@/` aliases, then relatives.
- Export PascalCase components from kebab-case files (e.g., `components/text-correction-form.tsx`); prefix hooks with `use-`; prefer verb-noun names for utilities.
- Default to server components—add `"use client"` only when browser APIs or interactivity require it.

## Testing Guidelines
- Jest is configured through `jest.config.js` and `jest.setup.ts`; specs live in `__tests__/` or alongside sources as `*.test.ts(x)`.
- Focus coverage on sanitization helpers, Supabase adapters, caching logic, and payment flows.
- Mock external services (OpenAI, Upstash, Stripe) and keep tests deterministic.
- Run `npm test` before every PR and extend suites when touching logic in `lib/`, API routes, or shared hooks.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) in present tense and keep scopes narrow.
- Confirm `npm run lint` and `npm run build` succeed locally, then link the relevant issue and document manual verification steps.
- Provide screenshots or clips for UI changes and call out schema, env, or infrastructure updates.

## Security & Configuration Tips
- Duplicate `.env.example` to `.env.local`, never commit secrets, and rotate tokens (`AUTH_TOKEN`, `REVALIDATION_TOKEN`, `WEBHOOK_SECRET`, `OPENAI_API_KEY`) with `openssl rand -hex 32`.
- Review changes to `middleware.ts` and `utils/cache-config.ts` for auth implications, and avoid exposing Supabase or Stripe secrets in client components.
- Revalidate webhook URLs whenever scripts in `actions/` alter integration behavior.
