# Repository Guidelines

## Project Structure & Module Organization

AssetMap is organized as independent TypeScript services. `assetmap/frontend/` is the Vite + React client; its application code is in `src/`, static files in `public/`, and reusable UI primitives in `src/components/ui/`. `assetmap/backend/` is the Fastify API, with routes in `src/routes/`, business logic in `src/services/`, database code and migrations in `src/db/`, and background jobs in `src/workers/`. `b2b_gateway/` contains the partner-facing gateway, including transforms, API-key auth, rate limits, and webhook handling under `src/b2b/`. Read `ARCHITECTURE.md` before making cross-service changes.

## Build, Test, and Development Commands

Run commands from the relevant package directory after `npm install`.

- `cd assetmap && docker-compose up -d` starts PostgreSQL, Redis, backend, and frontend dependencies.
- `cd assetmap/backend && npm run dev` runs the API with reload; `npm run build` emits `dist/`; `npm run typecheck` checks TypeScript without output.
- `cd assetmap/backend && npm test` runs `tests/runAllTests.ts`.
- `cd assetmap/frontend && npm run dev` starts Vite; `npm run build` type-checks and creates the production bundle; `npm run lint` runs Oxlint.
- `cd b2b_gateway && npm run dev` watches the gateway; run `npm run typecheck` before submitting changes. Its current `npm test` script is a placeholder.

## Coding Style & Naming Conventions

Use TypeScript with two-space indentation, semicolons, single quotes, and explicit types at service boundaries. Use PascalCase for React components and their files (for example, `AssetTimeline.tsx`), camelCase for functions and variables, and descriptive lowercase feature directories such as `src/nominee/` or `src/recovery/`. Keep route handlers thin; place domain behavior in services, and keep SQL migrations in `src/db/migrations/` with the existing numeric-prefix pattern.

## Testing Guidelines

Add or update backend coverage alongside behavior changes, using focused `*.test.ts` files in `assetmap/backend/tests/`. Exercise authorization, validation, and error-envelope behavior for changed API routes. Run the relevant typecheck, backend test command, and frontend lint/build checks before opening a PR.

## Commit & Pull Request Guidelines

History follows Conventional Commit-style prefixes, notably `feat:`, `fix:`, and `chore:`. Write imperative, scoped summaries, for example `fix: validate B2B webhook signatures`. Keep commits focused. PRs should describe the user-visible or API impact, list validation commands run, link the issue when available, and include screenshots for frontend changes. Never commit `.env` files, credentials, raw identity data, or production exports; use local environment configuration and sanitized fixtures.
