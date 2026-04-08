# AGENTS.md

## Commands

- Use `pnpm`, not npm or yarn. The lockfile is `pnpm-lock.yaml`.
- Dev server: `pnpm dev` (runs `next dev --turbopack`).
- Build check: `pnpm build`.
- Lint: `pnpm lint`.
- Format whole repo: `pnpm format`.

## Verification

- There is no test suite and no `typecheck` script in `package.json`.
- The only configured pre-commit check is formatting staged files via `lint-staged`.
- `.husky/pre-commit` runs `npx lint-staged`, and `.lintstagedrc.json` runs `prettier --write`.
- Local PostgreSQL is expected to come from the shared stack in `~/dev/postgres`.

## Architecture

- This is a single Next.js App Router app, not a monorepo.
- App entrypoints live under `app/`; shared layout wiring is in `app/layout.tsx` and `components/layout/main-layout.tsx`.
- Most product state is client-side Zustand state under `store/`.
- Domain data is still largely seeded from `mock-data/`, but projects now read from PostgreSQL via Drizzle.
- `store/issues-store.ts` is the main issue data store and initializes from `mock-data/issues`.
- `store/view-store.ts` is one of the few persisted stores; it uses `localStorage`.

## Current Product Reality

- Treat this repo as a personal issue tracker fork with an in-progress PostgreSQL migration.
- Root routing now points to the personal projects/issues flow instead of the old team-based entrypoints.
- Canonical app routes are now `/projects`, `/issues`, `/inbox`, and `/settings`; legacy `app/[orgId]/*` routes only redirect for compatibility.
- There is no real multi-workspace model anymore; keep the sidebar header as a single personal workspace label, not a functional workspace switcher.
- `teams` is intentionally out of scope for the current product direction.
- Before adding features, check whether the behavior belongs in real app state/data or is still demo-only mock behavior.

## Editing Guidance

- Prefer updating the existing App Router + Zustand structure instead of introducing a second state model.
- If you are making the app more real, remove or replace `mock-data` dependencies deliberately; do not leave half-mock / half-real flows.
- Avoid spending time on inbox/settings/multi-team polish unless the task explicitly requires it; much of that surface is placeholder UI.
- Do not reintroduce org, workspace, or team abstractions unless explicitly requested.
- Do not alter the current visual style or invent a new UI direction. This repo already has an established design system; preserve existing layout, spacing, components, and styling patterns unless the user explicitly asks for a design change.
- If a refactor weakens the UI, use `/home/vrivera/git-packages/circle` as the visual reference for the original project layout.
- Prefer removing leftover template/demo surfaces over adapting them if they do not support the personal tracker flow.

## Docs And Ownership

- Keep `LICENSE.md` intact to preserve MIT attribution requirements.
- Do not reintroduce external promotional links or creator branding from the original template unless explicitly requested.
- If editing repo/community metadata, ensure ownership and contact details match this fork rather than the original project.

## Data Reality

- Projects and issues already have PostgreSQL-backed flows; extend those with real persistence instead of adding new mock-only behavior.
- Avoid building new product behavior on top of `mock-data` when the same surface is already being migrated to Postgres.

## Style

- Prettier is the source of truth for formatting.
- Repo-specific Prettier settings include `singleQuote: true`, `tabWidth: 3`, and `printWidth: 100`.
- Shadcn UI is configured in `components.json` with aliases rooted at `@/`.
