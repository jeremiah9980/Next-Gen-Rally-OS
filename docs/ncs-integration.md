# NCS Integration — Operational Guide

## Overview

The NCS integration provides:

1. **NCS Roster Dashboard** (`/ncs-roster-dashboard`) — search, preview, and selectively import
   NCS players into the active TeamSeason with full source linkage.
2. **NCS Tournament Tracker** (`/ncs-tournament-tracker`) — browse, attach, and monitor NCS
   tournament registrations.
3. **ncs-worker** — a scheduled service that polls tracked NCS team URLs, diffs live data against
   stored snapshots, and queues detected changes for coach review.

---

## Two Ways to Get a Roster In

### 1. Live search (NCS Fastpitch portal)

The Roster Dashboard's **Search NCS Teams** tab calls the live `playncs.com` team search and
team-detail pages directly — no copy/paste required:

1. Search by team name, city, and/or state (optionally a season id).
2. Pick your team from the results table.
3. The team's live roster is fetched and dropped straight into the same preview/select step as
   the paste flow.

This is read-only scraping of public, server-rendered HTML (NCS has no developer API) — see
`packages/ncs/src/scrape.ts` (pure HTML → data parsers, unit-tested without network access) and
`packages/ncs/src/client.ts` (the `fetch` calls). It never writes anything on its own; the coach
still has to run the **Import** step, so governance (no auto-apply) is unaffected.

### 2. Paste-and-parse

For NCS pages the live search doesn't cover (or any other source), the **Paste Text** tab uses a
**paste-and-parse** workflow:

1. Navigate to the NCS website and copy roster / tournament table rows.
2. Paste the text into the dashboard input area.
3. The parser auto-detects tab-delimited or multi-space columns.
4. If a recognisable header row is present the columns are mapped by name (including `bats` /
   `throws`); otherwise a positional fallback scans each row for a jersey number, a known position
   code, and a grad year (in any column order) and treats the remainder as the player's name.

---

## NCS Roster Dashboard

### Import flow

1. Optionally enter the NCS team page URL (for source tracking and future polling).
2. Paste the roster table text.
3. Click **Preview Roster** — the parser shows detected columns, parse mode, and any warnings.
4. Review the table; check/uncheck individual players.
5. Click **Import N Players** — for each selected row the server action creates:
   - `Player` (or matches an existing one by `ncsExternalId → normalised name → jersey`).
   - `RosterEntry` linked to the active `TeamSeason`.
   - `NcsPlayerSource` storing the original row snapshot and the source URL.

### Re-diffing

Paste an updated roster into the **Re-Diff** panel at any time to detect changes against the
last imported snapshot.  The action creates `NcsChangeReview` items; it **never** overwrites
canonical `Player` or `RosterEntry` records.

### Change review

Every detected difference appears in the **Change Review Queue** with status `change_detected`.

| Status | Meaning |
|---|---|
| `change_detected` | Worker (or re-diff) found a difference. Needs coach attention. |
| `pending_review` | Coach has flagged it for review. |
| `accepted` | Coach has reviewed and accepted the change. |
| `ignored` | Coach has dismissed the change. |

Valid transitions: `change_detected → pending_review → accepted/ignored` and
`change_detected → ignored`.  Accepted and ignored items are terminal.

---

## NCS Tournament Tracker

1. Paste NCS tournament listing text.
2. Preview the parsed table; select tournaments to attach.
3. Click **Attach N Tournaments** — creates `NcsTournament` and `NcsTournamentEntry` records
   linked to the active `TeamSeason`.
4. The **Tournament Change Reviews** panel shows any registration-related changes detected by
   the worker.

---

## ncs-worker

### Configuration

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NCS_POLL_CRON` | No | node-cron schedule expression. Omit for a one-shot run. |

Copy `.env.example` to `.env` and fill in the values.

### Running

```bash
# One-shot poll (no cron configured)
cd apps/ncs-worker
pnpm dev          # development (tsx watch)
# or
pnpm build && pnpm start

# Scheduled (set NCS_POLL_CRON in .env)
NCS_POLL_CRON="0 * * * *" pnpm dev
```

### How it works

1. Reads all `NcsPlayerSource` records that have a stored `ncsTeamUrl`.
2. Groups them by `(teamSeasonId, ncsTeamUrl)`.
3. For each group, attempts an HTTP GET on the URL and extracts table rows.
4. Parses the HTML table text using the same paste-and-parse pipeline.
5. Diffs the fresh rows against stored `sourceSnapshot` values.
6. Creates `NcsChangeReview` items for each detected add / remove / update.
7. Updates `lastPolledAt` on the source records.

**The worker never modifies `Player`, `RosterEntry`, or `NcsTournament` records.**
All changes must be reviewed and accepted by the coach via the dashboard.

### Cron examples

```
# Every hour
NCS_POLL_CRON=0 * * * *

# Every day at 6 AM UTC
NCS_POLL_CRON=0 6 * * *

# Every 30 minutes
NCS_POLL_CRON=*/30 * * * *
```

---

## Architecture notes

- **Parser** lives in `packages/ncs/src/parser.ts` (pure TypeScript, no framework deps).
  Shared by both the `rally-os` app and the `ncs-worker`.
- **Diff logic** lives in `packages/ncs/src/diff.ts`.
  Matching priority: `ncsExternalId` → normalised name → jersey.
- **Source snapshots** are stored as `Json` in `NcsPlayerSource.sourceSnapshot` and
  `NcsTournament.sourceSnapshot`.  These are the stable baseline for future diffs.
- **NcsChangeReview.payload** contains the full `RosterChange` or `TournamentChange` object,
  including `before` and `after` snapshot rows, so coaches have full context.
