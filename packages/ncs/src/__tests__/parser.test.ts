import { describe, it, expect } from 'vitest'
import { validateNcsTeamUrl, parseNcsRosterText, parseNcsTournamentText } from '../parser.js'

// ─── validateNcsTeamUrl ────────────────────────────────────────────────────────

describe('validateNcsTeamUrl', () => {
  it('accepts known NCS domains', () => {
    expect(validateNcsTeamUrl('https://www.ncssports.org/teams/123')).toBe(true)
    expect(validateNcsTeamUrl('https://ncssports.org/teams/abc')).toBe(true)
    expect(validateNcsTeamUrl('https://www.norcalscout.com/team/456')).toBe(true)
    expect(validateNcsTeamUrl('https://ncs.org/roster/789')).toBe(true)
  })

  it('rejects unrelated URLs', () => {
    expect(validateNcsTeamUrl('https://example.com/team/1')).toBe(false)
    expect(validateNcsTeamUrl('https://gamechanger.io/teams/1')).toBe(false)
  })

  it('rejects non-http schemes', () => {
    expect(validateNcsTeamUrl('ftp://ncssports.org/teams/1')).toBe(false)
  })

  it('rejects empty or malformed input', () => {
    expect(validateNcsTeamUrl('')).toBe(false)
    expect(validateNcsTeamUrl('not a url')).toBe(false)
  })
})

// ─── parseNcsRosterText — header mode ─────────────────────────────────────────

describe('parseNcsRosterText — header mode', () => {
  const tabSample = [
    'ID\tFirst Name\tLast Name\tJersey\tPosition\tGrad Year',
    '101\tAlice\tSmith\t12\tP\t2026',
    '102\tBob\tJones\t7\tC\t2025',
  ].join('\n')

  it('detects header row and parses columns', () => {
    const result = parseNcsRosterText(tabSample)
    expect(result.parseMode).toBe('header')
    expect(result.rows).toHaveLength(2)
  })

  it('maps ID column to ncsExternalId', () => {
    const result = parseNcsRosterText(tabSample)
    expect(result.rows[0].ncsExternalId).toBe('101')
    expect(result.rows[1].ncsExternalId).toBe('102')
  })

  it('maps name columns correctly', () => {
    const result = parseNcsRosterText(tabSample)
    expect(result.rows[0].firstName).toBe('Alice')
    expect(result.rows[0].lastName).toBe('Smith')
    expect(result.rows[0].fullName).toBe('Alice Smith')
  })

  it('maps jersey without leading hash', () => {
    const result = parseNcsRosterText(tabSample)
    expect(result.rows[0].jerseyNumber).toBe('12')
  })

  it('maps position and grad year', () => {
    const result = parseNcsRosterText(tabSample)
    expect(result.rows[0].position).toBe('P')
    expect(result.rows[0].gradYear).toBe('2026')
  })

  it('handles full-name column', () => {
    const sample = 'Name\t#\tPosition\nCarlos Rivera\t9\tSS\n'
    const result = parseNcsRosterText(sample)
    expect(result.parseMode).toBe('header')
    expect(result.rows[0].fullName).toBe('Carlos Rivera')
    expect(result.rows[0].jerseyNumber).toBe('9')
  })

  it('strips # prefix from jersey values', () => {
    const sample = 'Jersey\tName\n#5\tJane Doe\n'
    const result = parseNcsRosterText(sample)
    expect(result.rows[0].jerseyNumber).toBe('5')
  })

  it('emits no positional warning in header mode', () => {
    const result = parseNcsRosterText(tabSample)
    expect(result.warnings).toHaveLength(0)
  })
})

// ─── parseNcsRosterText — positional fallback ─────────────────────────────────

describe('parseNcsRosterText — positional fallback', () => {
  const positionalSample = ['5  Alice Smith  P  2026', '12  Bob Jones  C  2025'].join('\n')

  it('falls back to positional when no recognisable header', () => {
    const result = parseNcsRosterText(positionalSample)
    expect(result.parseMode).toBe('positional')
  })

  it('emits a warning about positional mode', () => {
    const result = parseNcsRosterText(positionalSample)
    expect(result.warnings.some((w) => w.includes('positional'))).toBe(true)
  })

  it('assigns first column to jerseyNumber', () => {
    const result = parseNcsRosterText(positionalSample)
    expect(result.rows[0].jerseyNumber).toBe('5')
  })

  it('assigns second column to fullName', () => {
    const result = parseNcsRosterText(positionalSample)
    expect(result.rows[0].fullName).toBe('Alice Smith')
  })

  it('assigns third column to position', () => {
    const result = parseNcsRosterText(positionalSample)
    expect(result.rows[0].position).toBe('P')
  })

  it('assigns fourth column to gradYear', () => {
    const result = parseNcsRosterText(positionalSample)
    expect(result.rows[0].gradYear).toBe('2026')
  })
})

// ─── parseNcsRosterText — edge cases ─────────────────────────────────────────

describe('parseNcsRosterText — edge cases', () => {
  it('returns empty rows for empty input', () => {
    const result = parseNcsRosterText('')
    expect(result.rows).toHaveLength(0)
    expect(result.warnings.some((w) => w.includes('empty'))).toBe(true)
  })

  it('skips blank lines', () => {
    const sample = 'Name\tJersey\nAlice\t5\n\n\nBob\t7\n'
    const result = parseNcsRosterText(sample)
    expect(result.rows).toHaveLength(2)
  })

  it('preserves raw column values', () => {
    const sample = 'Name\tJersey\nAlice Smith\t#12\n'
    const result = parseNcsRosterText(sample)
    expect(result.rows[0].raw['Name']).toBe('Alice Smith')
    expect(result.rows[0].raw['Jersey']).toBe('#12')
  })
})

// ─── parseNcsTournamentText — header mode ────────────────────────────────────

describe('parseNcsTournamentText — header mode', () => {
  const tabSample = [
    'Tournament Name\tDate\tLocation\tAge Groups',
    'Spring Invitational\t2026-03-15\tSan Jose, CA\t10U, 12U',
    'Summer Classic\t2026-06-20\tSacramento, CA\t14U',
  ].join('\n')

  it('detects header and returns correct rows', () => {
    const result = parseNcsTournamentText(tabSample)
    expect(result.parseMode).toBe('header')
    expect(result.rows).toHaveLength(2)
  })

  it('maps tournament name', () => {
    const result = parseNcsTournamentText(tabSample)
    expect(result.rows[0].name).toBe('Spring Invitational')
  })

  it('maps startDate', () => {
    const result = parseNcsTournamentText(tabSample)
    expect(result.rows[0].startDate).toBe('2026-03-15')
  })

  it('maps location and ageGroups', () => {
    const result = parseNcsTournamentText(tabSample)
    expect(result.rows[0].location).toBe('San Jose, CA')
    expect(result.rows[0].ageGroups).toBe('10U, 12U')
  })
})

// ─── parseNcsTournamentText — positional fallback ─────────────────────────────

describe('parseNcsTournamentText — positional fallback', () => {
  const positionalSample = [
    'Spring Invitational  2026-03-15  San Jose CA  12U',
    'Summer Classic  2026-06-20  Sacramento CA  14U',
  ].join('\n')

  it('falls back to positional without header', () => {
    const result = parseNcsTournamentText(positionalSample)
    expect(result.parseMode).toBe('positional')
    expect(result.rows).toHaveLength(2)
  })

  it('assigns first column to name', () => {
    const result = parseNcsTournamentText(positionalSample)
    expect(result.rows[0].name).toBe('Spring Invitational')
  })

  it('skips rows with empty name', () => {
    // An all-blank line becomes empty after split, so name is '' and is skipped
    const sample = 'Valid Tournament  2026-04-01\n\n  \nAnother Tournament  2026-05-01\n'
    const result = parseNcsTournamentText(sample)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].name).toBe('Valid Tournament')
  })
})
