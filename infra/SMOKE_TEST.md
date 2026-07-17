# Smoke-test checklist

Maps the demo acceptance criteria to concrete checks. Run after
`make install generate migrate seed` against a real `DATABASE_URL`.

## Setup
- [ ] `pnpm install` succeeds.
- [ ] `pnpm db:generate && pnpm db:push` (or `make migrate`) sync the schema.
- [ ] `pnpm db:seed` prints demo coach credentials.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass.

## Auth + Team Portal
- [ ] Visiting `/` while signed out redirects to `/login`.
- [ ] Sign in with the seeded coach (`coach@example.com` / `password123`).
- [ ] Home shows the active TeamSeason, athlete count, and a roster grid with
      live AVG / AB / RBI / HR.
- [ ] Team Info + Standards forms save and reload their values.
- [ ] A coach only sees their own organization's TeamSeasons (tenancy).

## NCS
- [ ] NCS Roster Dashboard: paste a roster, **preview** before import, import
      selected players.
- [ ] NCS-detected changes appear as `NcsChangeReview` items (never auto-applied);
      accept / edit / ignore works.
- [ ] NCS Tournament Tracker: browse + attach a tournament to the TeamSeason.
- [ ] `services/ncs-worker` runs on `NCS_POLL_CRON` and emits change reviews.

## GameChanger
- [ ] Connect GameChanger to the TeamSeason (stores `gcTeamId`).
- [ ] Map a Rally-OS player to a `gcPlayerId`.
- [ ] Import box-score stats as read-only snapshots (real result/score, never
      hardcoded); matching is `gcPlayerId → normalized name → jersey`.

## Tournament schedule (approval-gated push)
- [ ] NCS-detected games become drafts (`ncs_detected → draft_created →
      pending_coach_approval`).
- [ ] Coach edits opponent/date/time/field/location/game_type, approves or rejects.
- [ ] Only approved games push to GameChanger; the returned `gcGameId` is stored.

## Practice planning (AI)
- [ ] Generate a practice plan; both COACH and PLAYER versions render.
- [ ] The PLAYER version contains no private coach notes.
- [ ] Drills and the template are saved to the reusable library.
- [ ] Player Development generates advisory `DevelopmentFocus` (advisory only).

## Publish (org-builder → public-site)
- [ ] `rally-os build <config.yaml>` validates, provisions the TeamSeason, and
      reports enabled modules + projection sections.
- [ ] The org-builder wizard mirrors the same steps.
- [ ] `apps/public-site` renders only the published projection — approved games,
      PLAYER practice version, no coach-private data, no `integrations_status`.
