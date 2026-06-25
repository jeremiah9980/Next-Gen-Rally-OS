import { describe, expect, it } from 'vitest'
import { matchPlayer } from '../match-player'
import type { LocalPlayer } from '../match-player'
import type { NcsRosterRow } from '../parse-roster'

const makeRow = (overrides: Partial<NcsRosterRow>): NcsRosterRow => ({
  rawName: 'Test Player',
  normalizedName: 'test player',
  ...overrides,
})

const makePlayers = (): LocalPlayer[] => [
  { id: 'p1', ncsId: 'ncs-001', normalizedName: 'john smith', jerseyNumber: '7' },
  { id: 'p2', ncsId: null, normalizedName: 'jane doe', jerseyNumber: '12' },
  { id: 'p3', ncsId: null, normalizedName: 'bob jones', jerseyNumber: '5' },
]

describe('matchPlayer', () => {
  it('matches by NCS ID first (highest priority)', () => {
    const row = makeRow({ ncsId: 'ncs-001', normalizedName: 'different name', jersey: '12' })
    const result = matchPlayer(row, makePlayers())

    expect(result.matched).toBe(true)
    if (result.matched) {
      expect(result.player.id).toBe('p1')
      expect(result.method).toBe('ncsId')
    }
  })

  it('does NOT fall back to name when ID is present but unmatched', () => {
    const row = makeRow({ ncsId: 'ncs-999', normalizedName: 'john smith', jersey: '7' })
    const result = matchPlayer(row, makePlayers())

    expect(result.matched).toBe(false)
  })

  it('matches by normalized name when no ID column is present', () => {
    const row = makeRow({ ncsId: undefined, normalizedName: 'jane doe', jersey: '99' })
    const result = matchPlayer(row, makePlayers())

    expect(result.matched).toBe(true)
    if (result.matched) {
      expect(result.player.id).toBe('p2')
      expect(result.method).toBe('normalizedName')
    }
  })

  it('matches by jersey as last resort when no ID and name mismatch', () => {
    const row = makeRow({ ncsId: undefined, normalizedName: 'unknown player', jersey: '5' })
    const result = matchPlayer(row, makePlayers())

    expect(result.matched).toBe(true)
    if (result.matched) {
      expect(result.player.id).toBe('p3')
      expect(result.method).toBe('jersey')
    }
  })

  it('returns unmatched when nothing matches', () => {
    const row = makeRow({ ncsId: undefined, normalizedName: 'nobody here', jersey: '99' })
    const result = matchPlayer(row, makePlayers())

    expect(result.matched).toBe(false)
  })

  it('enforces ID > name > jersey precedence order', () => {
    const row = makeRow({ ncsId: 'ncs-001', normalizedName: 'jane doe', jersey: '12' })
    const result = matchPlayer(row, makePlayers())

    expect(result.matched).toBe(true)
    if (result.matched) {
      expect(result.player.id).toBe('p1')
      expect(result.method).toBe('ncsId')
    }
  })
})
