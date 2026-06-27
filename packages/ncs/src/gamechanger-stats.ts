export type GameChangerSnapshotInput = {
  teamSeasonId: string
  playerId: string | null
  gcPlayerId: string | null
  gcGameId: string | null
  avg: number | null
  ab: number | null
  rbi: number | null
  hr: number | null
  result: string
  score: string
  sourcePayload: object
}

export function buildGameChangerSnapshot(input: GameChangerSnapshotInput) {
  if (!input.result.trim()) {
    throw new Error('Result is required for GameChanger stat import.')
  }

  if (!input.score.trim()) {
    throw new Error('Score is required for GameChanger stat import.')
  }

  return {
    teamSeasonId: input.teamSeasonId,
    playerId: input.playerId,
    gcPlayerId: input.gcPlayerId,
    gcGameId: input.gcGameId,
    avg: input.avg,
    ab: input.ab,
    rbi: input.rbi,
    hr: input.hr,
    result: input.result,
    score: input.score,
    sourcePayload: input.sourcePayload,
    isReadOnly: true,
  }
}
