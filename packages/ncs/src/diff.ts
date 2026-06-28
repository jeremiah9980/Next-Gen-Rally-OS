/**
 * NCS diff utilities.
 *
 * Compares a stored source snapshot against freshly parsed data and produces
 * a structured diff.  The results are used to create NcsChangeReview items —
 * they NEVER trigger automatic roster mutations.
 *
 * Matching priority (per stored memory):
 *   1. ncsExternalId   (authoritative NCS-assigned ID)
 *   2. Normalised fullName
 *   3. jerseyNumber
 */
import type {
  ParsedRosterRow,
  ParsedTournamentRow,
  RosterChange,
  RosterDiff,
  TournamentChange,
  TournamentDiff,
} from './types'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function normName(s?: string): string {
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// ─── Roster diff ──────────────────────────────────────────────────────────────

/**
 * Returns a stable match key for a roster row using the priority chain:
 * ncsExternalId → normalised name → jersey.
 */
export function rosterMatchKey(row: ParsedRosterRow): string {
  if (row.ncsExternalId) return `id:${row.ncsExternalId}`
  const name = normName(row.fullName)
  if (name) return `name:${name}`
  if (row.jerseyNumber) return `jersey:${row.jerseyNumber}`
  return `raw:${JSON.stringify(row.raw)}`
}

/** Fields compared when detecting an update. */
const ROSTER_COMPARED_FIELDS: Array<keyof ParsedRosterRow> = [
  'firstName',
  'lastName',
  'fullName',
  'jerseyNumber',
  'position',
  'gradYear',
]

/**
 * Diff a stored roster snapshot against a live (freshly parsed) roster.
 *
 * @param stored  The rows from NcsPlayerSource.sourceSnapshot[]
 * @param live    The freshly parsed rows
 */
export function diffRoster(stored: ParsedRosterRow[], live: ParsedRosterRow[]): RosterDiff {
  const storedMap = new Map<string, ParsedRosterRow>()
  for (const row of stored) storedMap.set(rosterMatchKey(row), row)

  const liveMap = new Map<string, ParsedRosterRow>()
  for (const row of live) liveMap.set(rosterMatchKey(row), row)

  const added: ParsedRosterRow[] = []
  const removed: ParsedRosterRow[] = []
  const updated: RosterDiff['updated'] = []
  const changes: RosterChange[] = []

  // Detect added and updated rows
  for (const [key, liveRow] of liveMap) {
    if (!storedMap.has(key)) {
      added.push(liveRow)
      changes.push({ changeType: 'roster_add', matchKey: key, after: liveRow })
    } else {
      const storedRow = storedMap.get(key)!
      const changedFields = ROSTER_COMPARED_FIELDS.filter(
        (f) => normName(String(storedRow[f] ?? '')) !== normName(String(liveRow[f] ?? '')),
      )
      if (changedFields.length > 0) {
        updated.push({ before: storedRow, after: liveRow, changedFields: changedFields as string[] })
        changes.push({
          changeType: 'roster_update',
          matchKey: key,
          before: storedRow,
          after: liveRow,
        })
      }
    }
  }

  // Detect removed rows
  for (const [key, storedRow] of storedMap) {
    if (!liveMap.has(key)) {
      removed.push(storedRow)
      changes.push({ changeType: 'roster_remove', matchKey: key, before: storedRow })
    }
  }

  return { added, removed, updated, changes }
}

// ─── Tournament diff ──────────────────────────────────────────────────────────

export function tournamentMatchKey(row: ParsedTournamentRow): string {
  if (row.ncsExternalId) return `id:${row.ncsExternalId}`
  return `name:${normName(row.name)}`
}

/**
 * Diff stored tournament records against a freshly parsed tournament list.
 */
export function diffTournaments(
  stored: ParsedTournamentRow[],
  live: ParsedTournamentRow[],
): TournamentDiff {
  const storedMap = new Map<string, ParsedTournamentRow>()
  for (const row of stored) storedMap.set(tournamentMatchKey(row), row)

  const liveMap = new Map<string, ParsedTournamentRow>()
  for (const row of live) liveMap.set(tournamentMatchKey(row), row)

  const added: ParsedTournamentRow[] = []
  const removed: ParsedTournamentRow[] = []
  const changes: TournamentChange[] = []

  for (const [key, liveRow] of liveMap) {
    if (!storedMap.has(key)) {
      added.push(liveRow)
      changes.push({ changeType: 'tournament_register', matchKey: key, after: liveRow })
    }
  }

  for (const [key, storedRow] of storedMap) {
    if (!liveMap.has(key)) {
      removed.push(storedRow)
      changes.push({ changeType: 'tournament_unregister', matchKey: key, before: storedRow })
    }
  }

  return { added, removed, changes }
}

// ─── Review state transitions ─────────────────────────────────────────────────

export type NcsChangeStatus = 'change_detected' | 'pending_review' | 'accepted' | 'ignored'

export const VALID_STATUS_TRANSITIONS: Record<NcsChangeStatus, NcsChangeStatus[]> = {
  change_detected: ['pending_review', 'ignored'],
  pending_review: ['accepted', 'ignored'],
  accepted: [],
  ignored: [],
}

export function isValidStatusTransition(from: NcsChangeStatus, to: NcsChangeStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from].includes(to)
}
