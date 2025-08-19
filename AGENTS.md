# Repository Guidelines

## Project Structure & Modules
- Source: `app/` (Next.js App Router, pages, layouts, API routes), UI in `components/`, hooks in `hooks/`, utilities in `utils/`, shared types in `types/`.
- Assets: `public/` (images, icons), global styles in `app/globals.css`, Tailwind config in `tailwind.config.ts`.
- Config: `next.config.mjs`, `tsconfig.json`, env examples in `.env.example`.

## Build, Test, and Development
- `npm run dev`: Start the Next.js dev server.
- `npm run build`: Create a production build.
- `npm run start`: Serve the production build.
- `npm run lint`: Run Next.js/ESLint checks.
Tip: Use one package manager consistently. Given `package-lock.json`, default to `npm`.

## Coding Style & Conventions
- Language: TypeScript (strict mode). React Server Components by default; add `"use client"` when needed.
- Formatting: Two-space indentation, no semicolons, double quotes. Keep imports ordered; prefer alias `@/` for internal modules.
- Filenames: kebab-case (e.g., `text-correction-form.tsx`).
- Components: PascalCase exports; colocate UI elements under `components/` and primitives under `components/ui/`.
- Hooks: `hooks/` with `use-*` naming.
- Utilities: `utils/` with focused, testable functions.

## Testing Guidelines
- Framework: Not configured yet. If adding tests, prefer Vitest or Jest with React Testing Library.
- Location: `__tests__/` or alongside files as `*.test.ts(x)`.
- Coverage: Aim for critical flows (sanitization, env validation, rating stats). Add a minimal CI job later.
- Run: Document test commands in `package.json` (e.g., `npm test`).

## Commit & Pull Requests
- Commits: Use concise, present-tense, conventional types: `feat:`, `fix:`, `chore:`, `refactor:`. Include a short scope when helpful.
- PRs: Provide summary, rationale, and screenshots/GIFs for UI changes. Link issues, list breaking changes, and note any env or migration steps.
- Checks: Ensure `npm run lint` and build succeed before requesting review.

## Security & Configuration
- Env vars: Start from `.env.example` → `.env.local`. Do not commit secrets. Key vars: `AUTH_TOKEN`, `REVALIDATION_TOKEN`, `WEBHOOK_SECRET`, `OPENAI_API_KEY`, Upstash Redis tokens, Mercado Pago keys.
- Webhooks/tokens: Rotate regularly; use strong values (`openssl rand -hex 32`).
- Rate limiting/cache: See `utils/cache-config.ts` and Redis setup. Keep tokens off client components.

