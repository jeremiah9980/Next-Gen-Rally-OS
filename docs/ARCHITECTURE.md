# Next-Gen-Rally-OS — Architecture & Production Handoff

Audience: an engineering team taking this codebase to production (self-hosted
SaaS, white-label, or per-customer deployments). Everything a new team needs
to build, extend, package, and operate the product is either in this document
or linked from it.

---

## 1. Product overview

One system that takes a youth-sports team from **concept → public team-site →
full coaching operations**. It consolidates five legacy products (rallyiq,
ncs-monitor, NCS-DASH, venom, rally-org-builder) into a single Turborepo
monorepo with one database and one design system.

Three user-facing surfaces share one Postgres database:

| Surface | Audience | Auth |
| --- | --- | --- |
| `apps/rally-os` — coach portal | Coaches / team staff | next-auth (credentials + email), org-scoped |
| `apps/org-builder` — provisioning wizard | Operators / onboarding | none today (deploy behind SSO / internal network) |
| `apps/public-site` — generated team site | Public (parents, recruiters) | none (read-only projection) |

One background service: `services/ncs-worker` — scheduled NCS polling and diff
detection.

## 2. System topology

```
                    ┌────────────────────────────┐
   playncs.com ───► │ services/ncs-worker (cron) │──┐  writes NcsChangeReview only
                    └────────────────────────────┘  │
                                                    ▼
┌──────────────────┐   Server Actions   ┌──────────────────────┐
│ apps/rally-os    │◄──────────────────►│ PostgreSQL (Prisma)  │
│ coach portal     │                    │ packages/core-data   │
└──────────────────┘                    └──────────────────────┘
        ▲                                     ▲            ▲
        │ Claude API (packages/ai)            │            │ read-only projection
┌──────────────────┐                  ┌───────────────┐ ┌──────────────────┐
│ Anthropic        │                  │ apps/         │ │ apps/public-site │
└──────────────────┘                  │ org-builder   │ │ (per team)       │
                                      └───────────────┘ └──────────────────┘
```

Data flows one direction: **NCS (intelligence) → Rally-OS (record) →
Org-Builder (publish) → public site**, with GameChanger as read-only stats
enrichment into Rally-OS.

## 3. Workspace map

```
apps/
  rally-os/       Coach operations portal. Next.js App Router, next-auth,
                  Server Actions only (no app/api routes except next-auth).
  org-builder/    SiteConfig (YAML) wizard: validate → preview → provision
                  TeamSeason → Org Kit (branding starter). Also a CLI
                  (cli/rally-os.ts) for headless provisioning.
  public-site/    Renders the published projection through
                  packages/site-template. One deployment per team, selected
                  by PUBLIC_SITE_ORG_SLUG.

packages/
  core-data/      Prisma schema, client singleton, migrations, seed. The only
                  package that talks to the database.
  config/         SiteConfig zod schema + YAML parse/serialize + defaults.
  ncs/            Domain-level NCS: paste parser, roster/tournament diff,
                  live playncs.com search + roster scrape (scrape.ts/client.ts),
                  public payload projection. Used by rally-os + ncs-worker.
  ncs-parser/     Lower-level parsing/matching primitives (ID→name→jersey).
  gamechanger/    GC team/player mapping, stat import, approval-gated
                  schedule push.
  ai/             Claude-powered practice-plan builder + player-trend
                  suggestions. Zod-validated structured outputs.
  projection/     buildPublishedProjection(orgId, config) — the ONLY path from
                  coach data to public output. Strips coach-private fields.
  site-template/  13 toggleable public-site modules + SiteRenderer.
  org-kit/        Pure branding-kit generator (palette, SVG logo, social
                  templates, deploy checklist) from a SiteConfig.
  ui/             Shared design system (Card, Badge, Button, Nav, StatTile,
                  Avatar) + Tailwind preset (dark theme, accent-lime).

services/
  ncs-worker/     node-cron poller: fetch NCS pages → parse → diff vs
                  sourceSnapshot → create NcsChangeReview rows. Never writes
                  canonical records.
  integrations-worker/  Cloudflare Worker (deployed standalone, no Prisma):
                  scrapes playncs.com server-side and returns CORS-enabled
                  JSON; matches players against the gc_stats D1 database.
                  Backs the CMS Integration Center's live mode.

cms/              Zero-infrastructure JSON-file CMS for static org/team
                  sites: admin dashboard (cms/admin/), Integration Center
                  (cms/admin/integrations.html), JSON Schema, starter
                  content. See docs/cms.md.
org-site-builder/ Rally-ORG builder kit: 9-phase governance intake →
                  intake-to-build bridge → config-driven no-build static
                  site engine, plus the in-browser Builder Portal
                  (portal/index.html). See docs/org-site-builder.md.

infra/            .env.example (env contract), Vercel manifests, cron
                  definitions, smoke-test script, db workflows (see
                  infra/db/README.md).
scripts/setup.mjs Interactive installer — `pnpm run setup` (see §9).
```

Layering rule: `apps → packages → core-data`. Packages never import from
apps. Only `core-data` owns Prisma; other packages receive data or the
client through explicit entry points.

## 4. Data model (Prisma, 23 models)

Full schema: `packages/core-data/prisma/schema.prisma`. Migrations are
committed (`prisma/migrations/`) — production applies with
`prisma migrate deploy`.

Core graph:

```
Organization ─┬─ User (role: COACH | ADMIN)          [next-auth models:
              └─ Team ── TeamSeason (isActive)        Account, Session,
                              │                       VerificationToken]
     ┌────────────┬───────────┼──────────────┬─────────────────┐
RosterEntry   ScheduleGame  PracticePlan  NcsTournamentEntry  CoachNote
     │             │             │              │
  Player   SchedulePushRequest  PracticePlanVersion   NcsTournament
     │                          (coach | player)
     ├─ NcsPlayerSource   (source snapshot + ncsExternalId + ncsTeamUrl)
     ├─ GameChangerStatSnapshot
     ├─ NcsChangeReview   (status machine, payload = structured diff)
     └─ DevelopmentFocus / CoachNote

DrillLibrary ── Drill          PracticeTemplate
```

Key invariants:

- **Tenancy**: every portal query goes through
  `apps/rally-os/src/lib/portal-data.ts`, which scopes by
  `team.organizationId` from the session. Never query `TeamSeason` in the
  portal without the org filter.
- **`NcsPlayerSource.sourceSnapshot` (Json)** is the diff baseline — the full
  parsed row (including fields with no first-class column: position, bats,
  throws, grad year).
- **`NcsChangeStatus`** machine: `change_detected → pending_review →
  accepted | ignored` (and `change_detected → ignored`). Terminal states are
  never reopened.
- **PracticePlanVersion** is split `coach` / `player` — the player version
  must never contain private coach notes (enforced by separate zod schemas in
  `packages/ai/src/types.ts`).

## 5. Governance rules (non-negotiable product invariants)

1. **NCS changes are never auto-applied.** The worker and re-diff actions only
   create `NcsChangeReview` rows; a coach explicitly accepts or ignores each.
2. **GameChanger games are never auto-pushed.** NCS-detected games become
   drafts (`SchedulePushRequest`) the coach approves; returned `gcGameId` is
   stored.
3. **Matching priority is always `ncsExternalId → normalized name → jersey`.**
   Never name-only when an ID is present. Implemented in `packages/ncs`
   diff + import and `packages/ncs-parser`.
4. **Coach-private data never reaches the public site.** The only path to
   public output is `packages/projection`, which strips `coach_notes` and the
   coach practice version. Do not add a second path.

Any feature PR that weakens one of these should be rejected in review.

## 6. Request/data flows

### Roster import (both entry points converge)
1. **Live search**: `searchNcsTeams` / `fetchNcsTeamRoster` server actions →
   `packages/ncs/client.ts` fetches playncs.com → `scrape.ts` parses HTML →
   `ParsedRosterRow[]`.
2. **Paste**: textarea → `parseNcsRosterText` (header detection or
   order-independent positional heuristics).
3. Both land in the same preview → coach selects rows → `importNcsPlayers`
   creates/matches `Player` + `RosterEntry` + `NcsPlayerSource` in one
   transaction.

### Change detection
`ncs-worker` (cron) or manual re-diff → parse current state → diff against
`sourceSnapshot` per matching priority → `NcsChangeReview(change_detected)` →
coach resolves in the portal → on accept, canonical records update and the
snapshot baseline advances.

### Publish
Org-builder wizard (or CLI) → `parseSiteConfigYaml` → `provisionFromConfig`
(idempotent upserts, slug-derived IDs) → `buildPublishedProjection` →
`apps/public-site` renders `SiteRenderer` with enabled modules. Re-publish =
re-deploy the public-site project.

### AI practice plan
Portal form → `packages/ai` builds prompt from team focus, roster, recent
stats/notes → Claude → zod-parse into `PracticePlanResult` (coach + player
versions + reusable drills + template) → stored as `PracticePlan` +
`PracticePlanVersion` rows.

## 7. Environment contract

Single source of truth: `infra/.env.example`. Summary:

| Variable | Consumer | Required in prod |
| --- | --- | --- |
| `DATABASE_URL` | everything via core-data | yes |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | rally-os | yes |
| `EMAIL_SERVER`, `EMAIL_FROM` | rally-os (magic-link) | for email login |
| `ANTHROPIC_API_KEY` | packages/ai | for AI features |
| `NCS_POLL_CRON` | ncs-worker | optional (one-shot if unset) |
| `PUBLIC_SITE_ORG_SLUG` | public-site | yes, per team deployment |
| `VERCEL_TOKEN` | org-builder deploy | for automated publish |
| `SEED_COACH_EMAIL/PASSWORD/NAME` | seed script | optional |

Turbo passes these through via `globalPassThroughEnv` in `turbo.json` — add
new env vars there or builds won't see them.

## 8. Deployment topology

Reference: `infra/vercel/README.md` (project settings tables) and
`infra/SMOKE_TEST.md`.

- **rally-os**: one Vercel project (root `apps/rally-os`). Build:
  `pnpm db:generate && pnpm --filter @rally/rally-os build`.
- **public-site**: one Vercel project **per team**
  (`public-site-<team-slug>`), differing only in `PUBLIC_SITE_ORG_SLUG` and
  custom domain. The org-kit deploy checklist pre-fills these values.
- **org-builder**: internal deployment (or run locally by operators).
- **ncs-worker**: any Node host with cron (`infra/cron/ncs-worker.crontab`)
  or a scheduled container. Needs only `DATABASE_URL` (+ `NCS_POLL_CRON`).
- **Database**: Postgres (Neon/Railway/RDS). `prisma migrate deploy` on
  release; never `db push` in production.

A Cloudflare Workers Git integration also builds from this repo
(`next-gen-rally-os` project). It is not the reference deployment; Vercel
manifests in `infra/` are.

## 9. Local development & onboarding

```bash
pnpm install
pnpm run setup        # interactive installer: env, DB, Anthropic key, seed
pnpm --filter @rally/rally-os dev
```

`pnpm run setup -- --yes` is the non-interactive/CI path. Demo login after
seeding: `coach@example.com` / `password123`.

Day-to-day: `pnpm dev` (all apps via turbo), `pnpm test`, `pnpm typecheck`,
`pnpm lint`, `pnpm build`. DB workflows: `infra/db/README.md`.

## 10. Testing & CI

- **Vitest** suites live next to source (`src/__tests__/`): NCS parser (32),
  diff (26), scrape (10), AI parse, projection/public-site. All parsers are
  pure functions — no network or DB needed in tests.
- **CI** (`.github/workflows/ci.yml`): install → prisma generate → typecheck
  → lint → build on every PR. Build uses placeholder auth/db env vars.
- Turbo caches typecheck/build/test by input hash; `db:*` tasks are uncached.

When adding scraping features, follow the established pattern: pure
HTML-in/data-out functions in a package (unit-testable), `fetch` isolated in
a thin client module.

## 11. Productization checklist (gap analysis for sale-ready)

Honest current-state list a buyer's team should know:

- [ ] **org-builder has no auth** — gate it (SSO/basic auth) before exposing.
- [ ] **Billing/subscription** — not present; integrate Stripe or similar at
      the Organization level.
- [ ] **Multi-team orgs**: schema supports many teams per org; the portal UX
      assumes one active TeamSeason (see `getActiveTeamSeason`). Add a
      season/team switcher for multi-team customers.
- [ ] **Publish automation**: public-site deploys are manual/Vercel-Git today;
      the `VERCEL_TOKEN` + `infra/vercel/*.json` scaffolding exists for a
      programmatic pipeline.
- [ ] **Planned modules** (marked in-app): Player Profiles, Integrations Hub,
      Fundraising, Coach bios, Social Media Hub.
- [ ] **Observability**: add error tracking (Sentry) + uptime checks;
      `infra/SMOKE_TEST.md` covers manual verification.
- [ ] **NCS scraping resilience**: parsers are regex-based against current
      playncs.com markup; add monitoring for parse-failure rates (worker
      already warns on empty results).
- [ ] **Rate-limiting / abuse** on public-site and login.

## 12. Extension points

- **New public-site module**: add toggle to `siteConfigSchema` → component in
  `packages/site-template/src/modules.tsx` → register in `MODULES` (site.tsx)
  → extend projection if it needs new data.
- **New roster source** (e.g. another association): new package mirroring
  `packages/ncs` (client + scrape + parser), reuse the same import actions and
  governance queue.
- **New AI feature**: add input/output zod schemas in `packages/ai/src/types.ts`,
  a builder module beside `practice-plan.ts`, and a server action.

## 13. Related docs

- `README.md` — quickstart + workspace summary
- `docs/ncs-integration.md` — NCS operational guide (import, re-diff, worker)
- `docs/gamechanger-integration.md` — GC mapping and push approval
- `docs/cms.md` — JSON-file CMS + Integration Center + integrations Worker
- `docs/org-site-builder.md` — Rally-ORG builder kit + Builder Portal
- `infra/db/README.md` — migration & seed workflows
- `infra/vercel/README.md` — per-project deploy settings
- `infra/SMOKE_TEST.md` — manual release verification
