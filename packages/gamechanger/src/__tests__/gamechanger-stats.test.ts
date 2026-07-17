import { describe, expect, it } from 'vitest'
import { buildGameChangerSnapshot } from '../gamechanger-stats'

describe('buildGameChangerSnapshot', () => {
  it('enforces explicit result and score and marks snapshots read-only', () => {
    const snapshot = buildGameChangerSnapshot({
      teamSeasonId: 'ts1',
      playerId: 'p1',
      gcPlayerId: 'gc1',
      gcGameId: 'g1',
      avg: 0.333,
      ab: 3,
      rbi: 2,
      hr: 1,
      result: 'W',
      score: '6-4',
      sourcePayload: { row: 1 },
    })

    expect(snapshot.isReadOnly).toBe(true)
    expect(snapshot.result).toBe('W')
    expect(snapshot.score).toBe('6-4')
  })

  it('rejects missing result/score values', () => {
    expect(() =>
      buildGameChangerSnapshot({
        teamSeasonId: 'ts1',
        playerId: 'p1',
        gcPlayerId: null,
        gcGameId: null,
        avg: null,
        ab: null,
        rbi: null,
        hr: null,
        result: ' ',
        score: '5-4',
        sourcePayload: {},
      }),
    ).toThrow('Result is required for GameChanger stat import.')

    expect(() =>
      buildGameChangerSnapshot({
        teamSeasonId: 'ts1',
        playerId: 'p1',
        gcPlayerId: null,
        gcGameId: null,
        avg: null,
        ab: null,
        rbi: null,
        hr: null,
        result: 'L',
        score: ' ',
        sourcePayload: {},
      }),
    ).toThrow('Score is required for GameChanger stat import.')
  })
})
