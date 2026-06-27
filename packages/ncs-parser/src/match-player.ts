import type { NcsRosterRow } from './parse-roster'

export interface LocalPlayer {
  id: string
  ncsId?: string | null
  normalizedName?: string
  jerseyNumber?: string | null
}

export type MatchResult =
  | { matched: true; player: LocalPlayer; method: 'ncsId' | 'normalizedName' | 'jersey' }
  | { matched: false }

/**
 * Match an NCS roster row to a local player.
 * Priority: external ID → normalized name → jersey.
 * NEVER use name-only matching when an ID column is present on the row.
 */
export function matchPlayer(row: NcsRosterRow, localPlayers: LocalPlayer[]): MatchResult {
  if (row.ncsId) {
    const byId = localPlayers.find((player) => player.ncsId && player.ncsId === row.ncsId)
    if (byId) return { matched: true, player: byId, method: 'ncsId' }

    return { matched: false }
  }

  if (row.normalizedName) {
    const byName = localPlayers.find(
      (player) => player.normalizedName && player.normalizedName === row.normalizedName,
    )
    if (byName) return { matched: true, player: byName, method: 'normalizedName' }
  }

  if (row.jersey) {
    const byJersey = localPlayers.find(
      (player) => player.jerseyNumber && player.jerseyNumber === row.jersey,
    )
    if (byJersey) return { matched: true, player: byJersey, method: 'jersey' }
  }

  return { matched: false }
}
