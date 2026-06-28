# Next-Gen-Rally-OS

A single system that takes a youth-sports team from **concept → public team-site →
full coaching operations**. It consolidates five legacy products (rallyiq,
ncs-monitor, NCS-DASH, venom, rally-org-builder) into one Turborepo monorepo.

## Architecture

**Rally-OS is the system of record.** Data flows in one direction:

```
NCS (intelligence)  →  Rally-OS (record)  →  Rally-Org-Builder (publish)  →  public site
                              ↑
                   GameChanger (READ-ONLY stats enrichment)
```

### Governance rules (non-negotiable)

1. **NCS roster changes are never auto-applied.** A detected change creates an
   `NcsChangeReview` the coach accepts / edits / ignores.
2. **GameChanger schedule games are never auto-pushed.** NCS-detected games
   become drafts the coach approves before push; the returned `gcGameId` is
   stored.
3. **Matching priority is always** external ID → normalized name → jersey.
   Never name-only when an ID column is present.
4. **Coach-private data** (`coach_notes`, the coach practice version) must never
   reach the public-site renderer.

## Workspaces

```
apps/
  rally-os/      Coach operations app (system of record). Next.js App Router.
  public-site/   Renders a published team site from packages/site-template.
  org-builder/   Config-driven site generation + deploy (the deployment tool).
packages/
  core-data/     Prisma schema + domain models. Single source of truth.
  ncs/           NCS search, roster monitor, tournament tracker.
  ncs-parser/    Paste-and-parse helpers + ID→name→jersey matching primitives.
  gamechanger/   GC team/player mapping, stat import, approval-gated schedule push.
  ai/            Practice-plan builder + player-trend suggestions (Claude API).
  ui/            Shared design system. Dark neon theme (the Venom look).
  site-template/ The structured Venom template as config-toggleable modules.
  config/        Site config schema (YAML) + zod validation.
services/
  ncs-worker/    Scheduled NCS polling worker. Emits NcsChangeReview items.
infra/           Env contracts (.env.example), DB, cron, per-team deploy notes.
docs/            Product + dev docs.
```

> Some feature workspaces above are introduced by their dedicated module steps.
> The scaffold guarantees the shared foundation — `core-data`, `ncs`,
> `ncs-parser`, `ui`, `config`, `rally-os`, and `ncs-worker` — compiles.

## Stack

TypeScript · Next.js (App Router) · Turborepo + pnpm workspaces · Prisma +
PostgreSQL · Tailwind · zod · Claude API (`@anthropic-ai/sdk`).
Deploy target: Vercel for apps, a cron worker for NCS polling, Neon/Railway
Postgres.

## Getting started

```bash
pnpm install
cp infra/.env.example .env      # fill in DATABASE_URL etc.
pnpm db:generate                # generate the Prisma client
pnpm db:push                    # sync schema to your database
pnpm dev                        # run the apps via turbo
```

### Root scripts

| Script             | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | Run all apps in dev (turbo).                     |
| `pnpm build`       | Build every workspace (turbo).                   |
| `pnpm lint`        | Lint every workspace (turbo).                    |
| `pnpm typecheck`   | Typecheck every workspace (turbo).               |
| `pnpm db:generate` | Generate the Prisma client (`@rally/core-data`). |
| `pnpm db:push`     | Push the Prisma schema to the database.          |

## CI

`.github/workflows/ci.yml` runs `pnpm install`, `db:generate`, `typecheck`,
`lint`, and `build` on every push and pull request. The build step sets
`NEXTAUTH_URL=http://localhost:3000` so next-auth does not crash on an empty URL.

## Integration docs

- [NCS Integration](docs/ncs-integration.md)
- [GameChanger Integration](docs/gamechanger-integration.md)
