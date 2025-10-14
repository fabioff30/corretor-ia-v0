# Repository Guidelines

## Project Structure & Module Organization
Core logic lives in `app/`, which hosts App Router pages, layouts, and API routes. Shared primitives sit under `components/ui/`, while feature-level components belong in `components/`. Reuse hooks through `hooks/`, utilities through `utils/`, and shared types via `types/`. Store static assets in `public/`, with styling centralized in `app/globals.css` and `tailwind.config.ts`. Place workflows or scripts in `actions/` and `scripts/`, and keep transactional email templates in `emails/`. Organize new modules by matching these directories and using the `@/` alias for imports.

## Build, Test, and Development Commands
- `npm run dev` launches the local Next.js server with hot reload.
- `npm run build` compiles the production bundle and runs type checks.
- `npm run start` serves the optimized build for smoke testing.
- `npm run lint` enforces ESLint and Next.js rules; run before PRs.
- `npm test` executes Jest with React Testing Library. Wire new suites here.

## Coding Style & Naming Conventions
Write strict TypeScript with double quotes, two-space indentation, and no semicolons. Keep imports ordered: external packages first, then `@/` paths. Components export PascalCase symbols and live in kebab-case files (e.g., `text-correction-form.tsx`). Hooks start with `use-`, utilities prefer verb-noun naming, and default to server components; add `"use client"` only when browser APIs are required. Format edits with the repo’s Prettier and ESLint settings before committing.

## Testing Guidelines
Use Jest plus React Testing Library; place specs in `__tests__/` or alongside source files as `*.test.ts(x)`. Target behavior-critical paths such as sanitization helpers, caching logic, and rating workflows. Keep tests deterministic, mock external services, and ensure any new command integrates with `npm test`. Failing tests block merges.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`) in present tense. Group related changes; avoid bundling unrelated refactors. PRs must summarize intent, list implementation notes, and link issues. Include screenshots or GIFs for UI updates, call out migrations or config changes, and confirm `npm run lint` plus `npm run build` before requesting review.

## Security & Configuration Tips
Duplicate `.env.example` into `.env.local` for new environments, keeping secrets out of version control. Rotate `AUTH_TOKEN`, `REVALIDATION_TOKEN`, `WEBHOOK_SECRET`, `OPENAI_API_KEY`, and other keys with `openssl rand -hex 32`. Never expose credentials in client components, and review `middleware.ts` and `utils/cache-config.ts` when adjusting authentication or rate limiting.
