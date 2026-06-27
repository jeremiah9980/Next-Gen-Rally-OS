import { describe, expect, it } from 'vitest'
import { matchGameChangerPlayer } from '../match-gamechanger-player'
import type { LocalGameChangerPlayer, GameChangerPlayerRow } from '../match-gamechanger-player'

const makeRow = (overrides: Partial<GameChangerPlayerRow>): GameChangerPlayerRow => ({
  name: 'Test Player',
  ...overrides,
})

const localPlayers: LocalGameChangerPlayer[] = [
  { id: 'p1', gcPlayerId: 'gc-001', fullName: 'Jane Smith', jerseyNumber: '7' },
  { id: 'p2', gcPlayerId: null, fullName: 'Mia Lopez', jerseyNumber: '12' },
  { id: 'p3', gcPlayerId: null, fullName: 'Ari Gomez', jerseyNumber: '3' },
]

describe('matchGameChangerPlayer', () => {
  it('matches by gcPlayerId first', () => {
    const result = matchGameChangerPlayer(
      makeRow({ gcPlayerId: 'gc-001', name: 'No Match', jersey: '12', hasIdColumn: true }),
      localPlayers,
    )

    expect(result.matched).toBe(true)
    if (result.matched) {
      expect(result.player.id).toBe('p1')
      expect(result.method).toBe('gcPlayerId')
    }
  })

  it('does not fall back to name when ID column exists but row id is unmatched', () => {
    const result = matchGameChangerPlayer(
      makeRow({ gcPlayerId: 'gc-999', name: 'Jane Smith', jersey: '7', hasIdColumn: true }),
      localPlayers,
    )

    expect(result).toEqual({ matched: false })
  })

  it('matches by normalized name when id column is absent', () => {
    const result = matchGameChangerPlayer(
      makeRow({ name: 'mia lopez', jersey: '99', hasIdColumn: false }),
      localPlayers,
    )

    expect(result.matched).toBe(true)
    if (result.matched) {
      expect(result.player.id).toBe('p2')
      expect(result.method).toBe('normalizedName')
    }
  })

  it('falls back to jersey after name when id column is absent', () => {
    const result = matchGameChangerPlayer(
      makeRow({ name: 'Unknown Name', jersey: '3', hasIdColumn: false }),
      localPlayers,
    )

    expect(result.matched).toBe(true)
    if (result.matched) {
      expect(result.player.id).toBe('p3')
      expect(result.method).toBe('jersey')
    }
  })
})
