export interface NcsTournamentRow {
  name: string
  location?: string
  startDate?: string
  endDate?: string
  registrationUrl?: string
  rawLine: string
}

function splitRow(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim())
  if (line.includes(',')) return line.split(',').map((c) => c.trim())
  return line.split(/\s{2,}/).map((c) => c.trim())
}

const KNOWN_HEADERS = ['name', 'tournament', 'location', 'date', 'start', 'end', 'url', 'register']

function looksLikeHeader(cells: string[]): boolean {
  const lower = cells.map((c) => c.toLowerCase().trim())
  return KNOWN_HEADERS.some((h) => lower.some((c) => c.includes(h)))
}

function detectColumns(header: string[]): {
  nameCol: number
  locationCol: number
  startCol: number
  endCol: number
  urlCol: number
} {
  const h = header.map((c) => c.toLowerCase().trim())
  const find = (keywords: string[]) => h.findIndex((c) => keywords.some((k) => c.includes(k)))

  return {
    nameCol: find(['name', 'tournament', 'event']),
    locationCol: find(['location', 'venue', 'city']),
    startCol: find(['start', 'date', 'from']),
    endCol: find(['end', 'through', 'to']),
    urlCol: find(['url', 'link', 'register']),
  }
}

export function parseNcsTournamentText(text: string): NcsTournamentRow[] {
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
      .map((line): NcsTournamentRow | null => {
        const cells = splitRow(line)
        if (!cells[0]) return null

        const name = cols.nameCol >= 0 && cells[cols.nameCol] ? cells[cols.nameCol] : cells[0]
        if (!name) return null

        return {
          name,
          location: cols.locationCol >= 0 ? cells[cols.locationCol] || undefined : undefined,
          startDate: cols.startCol >= 0 ? cells[cols.startCol] || undefined : undefined,
          endDate: cols.endCol >= 0 ? cells[cols.endCol] || undefined : undefined,
          registrationUrl: cols.urlCol >= 0 ? cells[cols.urlCol] || undefined : undefined,
          rawLine: line,
        }
      })
      .filter((row): row is NcsTournamentRow => row !== null)
  }

  return dataLines
    .map((line): NcsTournamentRow | null => {
      const cells = splitRow(line)
      const name = cells[0]
      if (!name) return null

      return {
        name,
        location: cells[1] || undefined,
        startDate: cells[2] || undefined,
        endDate: cells[3] || undefined,
        rawLine: line,
      }
    })
    .filter((row): row is NcsTournamentRow => row !== null)
}
