# Repository Guidelines

## Project Structure & Module Organization
Core application logic lives in `app/`, using the Next.js App Router for pages, layouts, and API routes. Shared UI primitives reside in `components/ui/`, while feature components sit in `components/`. Custom hooks stay under `hooks/`, utilities under `utils/`, and shared types in `types/`. Assets belong in `public/`, with global styles in `app/globals.css` and Tailwind setup in `tailwind.config.ts`. Keep integration scripts and workflows inside `actions/` and `scripts/`, and store email templates in `emails/`.

## Build, Test, and Development Commands
Use `npm run dev` for the local development server with hot reload. `npm run build` creates the production bundle and surfaces type issues. Follow up with `npm run start` to validate the optimized build. `npm run lint` enforces ESLint and Next.js rules; run it before raising a PR. If you introduce tests, wire them to `npm test` so the command stays the single source of truth.

## Coding Style & Naming Conventions
Write strict TypeScript with double quotes and no semicolons. Format files with two-space indentation and keep imports ordered (external, then `@/`). Components export PascalCase symbols, files use kebab-case (`text-correction-form.tsx`), and hooks start with `use-`. Default to server components; add `"use client"` only when browser APIs are required. Prefer the `@/` alias instead of long relative paths.

## Testing Guidelines
Jest with React Testing Library is prepped via `jest.config.js` and `jest.setup.ts`. Add unit or integration specs under `__tests__/` or alongside the file as `*.test.ts(x)`. Target critical behavior first: sanitization utilities, environment validation, caching logic, and rating workflows. Document any new test command in `package.json` so contributors can run `npm test` consistently.

## Commit & Pull Request Guidelines
Commits follow conventional prefixes such as `feat:`, `fix:`, `chore:`, and `refactor:`; keep messages short and present tense. PRs should include a concise summary, implementation notes, linked issues, and screenshots or GIFs for UI updates. Highlight migrations, config changes, or manual steps in a dedicated checklist. Before requesting review, confirm `npm run lint` and `npm run build` both pass locally.

## Security & Configuration Tips
Seed new environments from `.env.example`, storing secrets only in `.env.local` or platform-specific vaults. Rotate `AUTH_TOKEN`, `REVALIDATION_TOKEN`, `WEBHOOK_SECRET`, `OPENAI_API_KEY`, Upstash Redis, and Mercado Pago keys regularly using `openssl rand -hex 32`. Keep credentials off client components, and review `middleware.ts` plus `utils/cache-config.ts` when adjusting authentication or rate-limiting behavior.
