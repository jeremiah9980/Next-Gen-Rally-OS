import { describe, it, expect } from 'vitest'
import {
  rosterMatchKey,
  diffRoster,
  tournamentMatchKey,
  diffTournaments,
  isValidStatusTransition,
  VALID_STATUS_TRANSITIONS,
} from '../diff.js'
import type { ParsedRosterRow, ParsedTournamentRow } from '../types.js'

// ─── rosterMatchKey ────────────────────────────────────────────────────────────

describe('rosterMatchKey', () => {
  it('prefers ncsExternalId', () => {
    const row: ParsedRosterRow = { ncsExternalId: 'NCS-101', fullName: 'Alice', jerseyNumber: '5', raw: {} }
    expect(rosterMatchKey(row)).toBe('id:NCS-101')
  })

  it('falls back to normalised full name', () => {
    const row: ParsedRosterRow = { fullName: '  Alice Smith  ', jerseyNumber: '5', raw: {} }
    expect(rosterMatchKey(row)).toBe('name:alice smith')
  })

  it('falls back to jersey when no name', () => {
    const row: ParsedRosterRow = { jerseyNumber: '12', raw: {} }
    expect(rosterMatchKey(row)).toBe('jersey:12')
  })
})

// ─── diffRoster ────────────────────────────────────────────────────────────────

function r(overrides: Partial<ParsedRosterRow> = {}): ParsedRosterRow {
  return { raw: {}, ...overrides }
}

describe('diffRoster', () => {
  it('detects added rows', () => {
    const stored: ParsedRosterRow[] = [r({ fullName: 'Alice', jerseyNumber: '5' })]
    const live: ParsedRosterRow[] = [
      r({ fullName: 'Alice', jerseyNumber: '5' }),
      r({ fullName: 'Bob', jerseyNumber: '7' }),
    ]
    const diff = diffRoster(stored, live)
    expect(diff.added).toHaveLength(1)
    expect(diff.added[0].fullName).toBe('Bob')
    expect(diff.removed).toHaveLength(0)
    expect(diff.updated).toHaveLength(0)
  })

  it('detects removed rows', () => {
    const stored: ParsedRosterRow[] = [
      r({ fullName: 'Alice', jerseyNumber: '5' }),
      r({ fullName: 'Bob', jerseyNumber: '7' }),
    ]
    const live: ParsedRosterRow[] = [r({ fullName: 'Alice', jerseyNumber: '5' })]
    const diff = diffRoster(stored, live)
    expect(diff.removed).toHaveLength(1)
    expect(diff.removed[0].fullName).toBe('Bob')
  })

  it('detects updated rows (jersey change)', () => {
    const stored: ParsedRosterRow[] = [r({ fullName: 'Alice', jerseyNumber: '5' })]
    const live: ParsedRosterRow[] = [r({ fullName: 'Alice', jerseyNumber: '10' })]
    const diff = diffRoster(stored, live)
    expect(diff.updated).toHaveLength(1)
    expect(diff.updated[0].changedFields).toContain('jerseyNumber')
  })

  it('does not flag unchanged rows', () => {
    const row = r({ ncsExternalId: '99', fullName: 'Alice', jerseyNumber: '5', position: 'P' })
    const diff = diffRoster([row], [{ ...row }])
    expect(diff.added).toHaveLength(0)
    expect(diff.removed).toHaveLength(0)
    expect(diff.updated).toHaveLength(0)
  })

  it('uses ncsExternalId for matching (name change still detected)', () => {
    const stored: ParsedRosterRow[] = [r({ ncsExternalId: '42', fullName: 'Alice Jones' })]
    const live: ParsedRosterRow[] = [r({ ncsExternalId: '42', fullName: 'Alice Smith' })]
    const diff = diffRoster(stored, live)
    expect(diff.updated).toHaveLength(1)
    expect(diff.updated[0].changedFields).toContain('fullName')
  })

  it('returns roster_add / roster_remove / roster_update change types', () => {
    const stored: ParsedRosterRow[] = [r({ fullName: 'Alice', jerseyNumber: '5' })]
    const live: ParsedRosterRow[] = [
      r({ fullName: 'Bob', jerseyNumber: '7' }),
    ]
    const diff = diffRoster(stored, live)
    const types = diff.changes.map((c) => c.changeType)
    expect(types).toContain('roster_add')
    expect(types).toContain('roster_remove')
  })

  it('handles empty stored snapshot (all added)', () => {
    const live: ParsedRosterRow[] = [r({ fullName: 'Alice' }), r({ fullName: 'Bob' })]
    const diff = diffRoster([], live)
    expect(diff.added).toHaveLength(2)
    expect(diff.removed).toHaveLength(0)
  })

  it('handles empty live (all removed)', () => {
    const stored: ParsedRosterRow[] = [r({ fullName: 'Alice' }), r({ fullName: 'Bob' })]
    const diff = diffRoster(stored, [])
    expect(diff.removed).toHaveLength(2)
    expect(diff.added).toHaveLength(0)
  })

  it('is case-insensitive for name matching', () => {
    const stored: ParsedRosterRow[] = [r({ fullName: 'alice smith' })]
    const live: ParsedRosterRow[] = [r({ fullName: 'Alice Smith' })]
    const diff = diffRoster(stored, live)
    expect(diff.added).toHaveLength(0)
    expect(diff.removed).toHaveLength(0)
    // fullName case difference is normalised for key matching but counted as change for display
    // Since the canonical field values differ (case), it should detect an update
    // Let's verify: norm('alice smith') === norm('Alice Smith') → 'alice smith' === 'alice smith' → NO change
    expect(diff.updated).toHaveLength(0)
  })
})

// ─── diffTournaments ──────────────────────────────────────────────────────────

function t(overrides: Partial<ParsedTournamentRow> = {}): ParsedTournamentRow {
  return { name: 'Default Tournament', raw: {}, ...overrides }
}

describe('diffTournaments', () => {
  it('detects newly registered tournaments', () => {
    const stored: ParsedTournamentRow[] = []
    const live: ParsedTournamentRow[] = [t({ name: 'Spring Cup' })]
    const diff = diffTournaments(stored, live)
    expect(diff.added).toHaveLength(1)
    expect(diff.changes[0].changeType).toBe('tournament_register')
  })

  it('detects removed tournaments', () => {
    const stored: ParsedTournamentRow[] = [t({ name: 'Spring Cup' })]
    const live: ParsedTournamentRow[] = []
    const diff = diffTournaments(stored, live)
    expect(diff.removed).toHaveLength(1)
    expect(diff.changes[0].changeType).toBe('tournament_unregister')
  })

  it('does not flag unchanged tournaments', () => {
    const row = t({ ncsExternalId: 'T1', name: 'Spring Cup' })
    const diff = diffTournaments([row], [{ ...row }])
    expect(diff.added).toHaveLength(0)
    expect(diff.removed).toHaveLength(0)
  })

  it('uses ncsExternalId for matching', () => {
    const stored: ParsedTournamentRow[] = [t({ ncsExternalId: 'T1', name: 'Old Name' })]
    const live: ParsedTournamentRow[] = [t({ ncsExternalId: 'T1', name: 'New Name' })]
    // Since only name changed but the externalId matches, row is the same → no add/remove
    const diff = diffTournaments(stored, live)
    expect(diff.added).toHaveLength(0)
    expect(diff.removed).toHaveLength(0)
  })
})

// ─── tournamentMatchKey ───────────────────────────────────────────────────────

describe('tournamentMatchKey', () => {
  it('prefers ncsExternalId', () => {
    const row = t({ ncsExternalId: 'T-1', name: 'Spring Cup' })
    expect(tournamentMatchKey(row)).toBe('id:T-1')
  })

  it('falls back to normalised name', () => {
    const row = t({ name: '  Spring Cup  ' })
    expect(tournamentMatchKey(row)).toBe('name:spring cup')
  })
})

// ─── Review state transitions ─────────────────────────────────────────────────

describe('isValidStatusTransition', () => {
  it('allows change_detected → pending_review', () => {
    expect(isValidStatusTransition('change_detected', 'pending_review')).toBe(true)
  })

  it('allows change_detected → ignored', () => {
    expect(isValidStatusTransition('change_detected', 'ignored')).toBe(true)
  })

  it('allows pending_review → accepted', () => {
    expect(isValidStatusTransition('pending_review', 'accepted')).toBe(true)
  })

  it('allows pending_review → ignored', () => {
    expect(isValidStatusTransition('pending_review', 'ignored')).toBe(true)
  })

  it('rejects accepted → pending_review (terminal state)', () => {
    expect(isValidStatusTransition('accepted', 'pending_review')).toBe(false)
  })

  it('rejects ignored → accepted (terminal state)', () => {
    expect(isValidStatusTransition('ignored', 'accepted')).toBe(false)
  })

  it('rejects change_detected → accepted (skips step)', () => {
    expect(isValidStatusTransition('change_detected', 'accepted')).toBe(false)
  })

  it('covers all statuses in VALID_STATUS_TRANSITIONS', () => {
    const statuses: Array<keyof typeof VALID_STATUS_TRANSITIONS> = [
      'change_detected',
      'pending_review',
      'accepted',
      'ignored',
    ]
    for (const s of statuses) {
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty(s)
    }
  })
})
