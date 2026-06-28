/**
 * Shared NCS domain types used by both the rally-os app and the ncs-worker.
 */

// ─── Roster types ─────────────────────────────────────────────────────────────

export interface ParsedRosterRow {
  /** External NCS player ID (e.g. from an "ID" column). May be absent. */
  ncsExternalId?: string
  firstName?: string
  lastName?: string
  fullName?: string
  jerseyNumber?: string
  position?: string
  bats?: string
  throws?: string
  gradYear?: string
  /** The raw column values as parsed, preserved for snapshot storage. */
  raw: Record<string, string>
}

export interface RosterParseResult {
  rows: ParsedRosterRow[]
  /** Columns detected (header-based) or positional labels used. */
  columns: string[]
  parseMode: 'header' | 'positional'
  warnings: string[]
}

// ─── Tournament types ─────────────────────────────────────────────────────────

export interface ParsedTournamentRow {
  ncsExternalId?: string
  name: string
  startDate?: string
  endDate?: string
  location?: string
  ageGroups?: string
  raw: Record<string, string>
}

export interface TournamentParseResult {
  rows: ParsedTournamentRow[]
  columns: string[]
  parseMode: 'header' | 'positional'
  warnings: string[]
}

// ─── Diff types ───────────────────────────────────────────────────────────────

export type ChangeType =
  | 'roster_add'
  | 'roster_remove'
  | 'roster_update'
  | 'tournament_register'
  | 'tournament_unregister'

export interface RosterChange {
  changeType: 'roster_add' | 'roster_remove' | 'roster_update'
  /** Identifies the record being changed — matched by externalId, then name, then jersey. */
  matchKey: string
  before?: ParsedRosterRow
  after?: ParsedRosterRow
}

export interface TournamentChange {
  changeType: 'tournament_register' | 'tournament_unregister'
  matchKey: string
  before?: ParsedTournamentRow
  after?: ParsedTournamentRow
}

export type NcsChange = RosterChange | TournamentChange

export interface RosterDiff {
  added: ParsedRosterRow[]
  removed: ParsedRosterRow[]
  updated: Array<{ before: ParsedRosterRow; after: ParsedRosterRow; changedFields: string[] }>
  changes: RosterChange[]
}

export interface TournamentDiff {
  added: ParsedTournamentRow[]
  removed: ParsedTournamentRow[]
  changes: TournamentChange[]
}
