# GameChanger Integration — Governance and Workflow

## System boundaries

Rally-OS is the system of record.

Data flow remains one-way:

NCS -> Rally-OS -> Rally-Org-Builder -> Public Site

GameChanger enriches Rally-OS with read-only stat snapshots, except explicitly approved schedule push.

## Governance guarantees enforced

1. NCS roster changes are never auto-applied.
2. NCS-detected schedule games are never auto-pushed.
3. Player matching precedence for external stat rows is always:
   - `gcPlayerId`
   - normalized name
   - jersey
4. If an external ID column exists, unmatched IDs never fall back to name-only matching.
5. Coach-private fields (`coach_notes`, `coach_practice_version`) are excluded from public payload serializer helpers.
6. GameChanger write-back only occurs in approved schedule push action.
7. Stat import requires explicit `result` and `score` entry.

## Setup and operations

1. Open `/gamechanger` in Rally-OS portal.
2. Link the active TeamSeason using `gcTeamId`.
3. Map each roster player to a `gcPlayerId` (manual and auto-updated when importing rows containing IDs).
4. Import box score snapshots (JSON rows) with required result/score.
5. Generate schedule drafts from NCS-detected tournaments.
6. Review and edit drafts (`opponent`, `date`, `time`, `field`, `location`, `game_type`).
7. Approve selected/all drafts, reject when needed.
8. Push approved drafts only; push results persist returned `gcGameId` on `SchedulePushRequest`.

## Schedule state machine

`ncs_detected -> draft_created -> pending_coach_approval -> approved -> pushed_to_gamechanger | rejected`

Invalid transitions are rejected by shared workflow helpers and tests.
