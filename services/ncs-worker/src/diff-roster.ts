import { normalizePlayerName } from '@rally/ncs-parser'
import type { NcsRosterRow } from '@rally/ncs-parser'

export interface StoredSource {
  id: string
  ncsId: string | null
  rawName: string | null
  rawJersey: string | null
  rawPosition: string | null
  playerId: string
  teamSeasonId: string
}

export interface ChangeItem {
  teamSeasonId: string
  playerId: string | null
  ncsId: string | null
  field: string
  oldValue: string | null
  newValue: string | null
}

/**
 * Diff incoming NCS rows against stored sources to produce change items.
 * Matching priority: ncsId → normalizedName → jersey (governance constraint).
 * NEVER auto-applies changes — only produces ChangeItem records.
 */
export function diffRoster(
  incoming: NcsRosterRow[],
  stored: StoredSource[],
  teamSeasonId: string,
): ChangeItem[] {
  const changes: ChangeItem[] = []

  for (const row of incoming) {
    // Compute once per row — reused in both the matching and change-detection phases.
    const normIncomingName = normalizePlayerName(row.rawName)
    let source: StoredSource | undefined

    if (row.ncsId) {
      source = stored.find((item) => item.ncsId === row.ncsId)
      if (!source) {
        changes.push({
          teamSeasonId,
          playerId: null,
          ncsId: row.ncsId,
          field: 'new_player',
          oldValue: null,
          newValue: row.rawName,
        })
        continue
      }
    } else {
      source = stored.find((item) => normalizePlayerName(item.rawName ?? '') === normIncomingName)

      if (!source && row.jersey) {
        source = stored.find((item) => item.rawJersey === row.jersey)
      }

      if (!source) {
        changes.push({
          teamSeasonId,
          playerId: null,
          ncsId: null,
          field: 'new_player',
          oldValue: null,
          newValue: row.rawName,
        })
        continue
      }
    }

    if (row.jersey && row.jersey !== source.rawJersey) {
      changes.push({
        teamSeasonId,
        playerId: source.playerId,
        ncsId: row.ncsId ?? null,
        field: 'jerseyNumber',
        oldValue: source.rawJersey,
        newValue: row.jersey,
      })
    }

    if (normIncomingName !== normalizePlayerName(source.rawName ?? '')) {
      changes.push({
        teamSeasonId,
        playerId: source.playerId,
        ncsId: row.ncsId ?? null,
        field: 'name',
        oldValue: source.rawName,
        newValue: row.rawName,
      })
    }
  }

  for (const source of stored) {
    const found = source.ncsId
      ? incoming.some((row) => row.ncsId === source.ncsId)
      : incoming.some((row) => normalizePlayerName(row.rawName) === normalizePlayerName(source.rawName ?? ''))

    if (!found) {
      changes.push({
        teamSeasonId,
        playerId: source.playerId,
        ncsId: source.ncsId,
        field: 'removed',
        oldValue: source.rawName,
        newValue: null,
      })
    }
  }

  return changes
}
