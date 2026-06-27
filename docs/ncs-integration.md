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

## Paste-and-Parse Pattern

Because NCS does not provide a public API, the integration uses a **paste-and-parse** workflow:

1. Navigate to the NCS website and copy roster / tournament table rows.
2. Paste the text into the dashboard input area.
3. The parser auto-detects tab-delimited or multi-space columns.
4. If a recognisable header row is present the columns are mapped by name; otherwise positional
   fallback order is used (`jersey | name | position | grad year` for rosters;
   `name | date | location | age groups` for tournaments).

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
