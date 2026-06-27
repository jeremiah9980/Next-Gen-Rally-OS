import { normalizePlayerName } from './normalize'

export interface NcsRosterRow {
  ncsId?: string
  rawName: string
  firstName?: string
  lastName?: string
  normalizedName: string
  jersey?: string
  position?: string
}

const KNOWN_HEADERS = ['id', 'name', 'first', 'last', 'jersey', '#', 'pos', 'position', 'player']

function looksLikeHeader(cells: string[]): boolean {
  const lower = cells.map((c) => c.toLowerCase().trim())
  return KNOWN_HEADERS.some((h) => lower.some((c) => c.includes(h)))
}

function detectColumns(header: string[]): {
  idCol: number
  nameCol: number
  firstCol: number
  lastCol: number
  jerseyCol: number
  posCol: number
} {
  const h = header.map((c) => c.toLowerCase().trim())
  const find = (keywords: string[]) => h.findIndex((c) => keywords.some((k) => c.includes(k)))

  return {
    idCol: find(['id']),
    nameCol: find(['name', 'player']),
    firstCol: find(['first']),
    lastCol: find(['last']),
    jerseyCol: find(['jersey', '#', 'num']),
    posCol: find(['pos', 'position']),
  }
}

function splitRow(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim())
  if (line.includes(',')) return line.split(',').map((c) => c.trim())
  return line.split(/\s{2,}/).map((c) => c.trim())
}

function parseNameParts(raw: string): { firstName?: string; lastName?: string } {
  const parts = raw.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return {}
  if (parts.length === 1) return { firstName: parts[0] }

  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export function parseNcsRosterText(text: string): NcsRosterRow[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) return []

  const firstLine = lines[0]
  if (!firstLine) return []

  const firstCells = splitRow(firstLine)
  const hasHeader = looksLikeHeader(firstCells)
  const dataLines = hasHeader ? lines.slice(1) : lines

  if (hasHeader) {
    const cols = detectColumns(firstCells)

    return dataLines
      .map((line): NcsRosterRow | null => {
        const cells = splitRow(line)
        if (cells.length === 0 || cells.every((cell) => !cell)) return null

        const ncsId = cols.idCol >= 0 && cells[cols.idCol] ? cells[cols.idCol] : undefined

        let rawName = ''
        let firstName: string | undefined
        let lastName: string | undefined

        if (cols.nameCol >= 0 && cells[cols.nameCol]) {
          rawName = cells[cols.nameCol] ?? ''
          const parts = parseNameParts(rawName)
          firstName = parts.firstName
          lastName = parts.lastName
        } else if (cols.firstCol >= 0 || cols.lastCol >= 0) {
          firstName = cols.firstCol >= 0 ? cells[cols.firstCol] : undefined
          lastName = cols.lastCol >= 0 ? cells[cols.lastCol] : undefined
          rawName = [firstName, lastName].filter(Boolean).join(' ')
        } else {
          rawName = cells[0] ?? ''
          const parts = parseNameParts(rawName)
          firstName = parts.firstName
          lastName = parts.lastName
        }

        if (!rawName) return null

        const jersey = cols.jerseyCol >= 0 ? cells[cols.jerseyCol] || undefined : undefined
        const position = cols.posCol >= 0 ? cells[cols.posCol] || undefined : undefined

        return {
          ncsId,
          rawName,
          firstName,
          lastName,
          normalizedName: normalizePlayerName(rawName),
          jersey,
          position,
        }
      })
      .filter((row): row is NcsRosterRow => row !== null)
  }

  return dataLines
    .map((line): NcsRosterRow | null => {
      const cells = splitRow(line)
      if (cells.length === 0) return null

      const firstCell = cells[0]
      if (!firstCell) return null

      let rawName: string
      let jersey: string | undefined

      if (/^\d{1,2}$/.test(firstCell) && cells.length > 1) {
        jersey = firstCell
        rawName = cells.slice(1).join(' ')
      } else {
        rawName = cells.join(' ')
      }

      if (!rawName) return null

      const parts = parseNameParts(rawName)

      return {
        rawName,
        firstName: parts.firstName,
        lastName: parts.lastName,
        normalizedName: normalizePlayerName(rawName),
        jersey,
      }
    })
    .filter((row): row is NcsRosterRow => row !== null)
}
