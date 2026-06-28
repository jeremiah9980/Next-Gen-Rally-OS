# Database

Postgres (Neon / Railway / local). Schema + client live in `packages/core-data`.

## Workflows

| Task | Command | When |
| --- | --- | --- |
| Generate client | `make generate` / `pnpm db:generate` | After any schema change. |
| Quick sync (no history) | `pnpm db:push` | Local dev / prototyping. |
| Create a migration | `pnpm --filter @rally/core-data db:migrate:dev --name <name>` | When you change the schema and want versioned history. |
| Apply migrations | `make migrate` / `pnpm db:migrate` | CI / production deploys (`prisma migrate deploy`). |
| Seed demo data | `make seed` / `pnpm db:seed` | After the schema is in place. |

## Migrations are committed

`packages/core-data/prisma/migrations/` is tracked in git (migration-based
workflow). Generate a migration locally against a dev database with
`db:migrate:dev`, commit the generated SQL, and CI/production applies it with
`db:migrate`. The seed (`prisma/seed.ts`) is idempotent and safe to re-run.

## Required env

`DATABASE_URL` — see `infra/.env.example`. Optional `SEED_COACH_EMAIL` /
`SEED_COACH_PASSWORD` / `SEED_COACH_NAME` override the demo coach.
