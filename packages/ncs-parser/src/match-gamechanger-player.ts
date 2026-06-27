import { normalizePlayerName } from './normalize'

export interface GameChangerPlayerRow {
  gcPlayerId?: string | null
  name?: string | null
  jersey?: string | null
  hasIdColumn?: boolean
}

export interface LocalGameChangerPlayer {
  id: string
  gcPlayerId?: string | null
  fullName?: string | null
  jerseyNumber?: string | null
}

export type GameChangerMatchResult =
  | { matched: true; player: LocalGameChangerPlayer; method: 'gcPlayerId' | 'normalizedName' | 'jersey' }
  | { matched: false }

/**
 * Match precedence: external ID -> normalized name -> jersey.
 * If an ID column is present on the external row, never do name-only fallback.
 */
export function matchGameChangerPlayer(
  row: GameChangerPlayerRow,
  localPlayers: LocalGameChangerPlayer[],
): GameChangerMatchResult {
  const gcId = row.gcPlayerId?.trim()
  if (gcId) {
    const byId = localPlayers.find((player) => player.gcPlayerId?.trim() === gcId)
    if (byId) return { matched: true, player: byId, method: 'gcPlayerId' }
    return { matched: false }
  }

  if (row.hasIdColumn) {
    return { matched: false }
  }

  const normalizedName = row.name ? normalizePlayerName(row.name) : ''
  if (normalizedName) {
    const byName = localPlayers.find((player) => {
      if (!player.fullName) return false
      return normalizePlayerName(player.fullName) === normalizedName
    })
    if (byName) return { matched: true, player: byName, method: 'normalizedName' }
  }

  const jersey = row.jersey?.trim()
  if (jersey) {
    const byJersey = localPlayers.find((player) => player.jerseyNumber?.trim() === jersey)
    if (byJersey) return { matched: true, player: byJersey, method: 'jersey' }
  }

  return { matched: false }
}
