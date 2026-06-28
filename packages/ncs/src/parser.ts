/**
 * NCS paste-and-parse utilities.
 *
 * Handles tab-delimited or whitespace-delimited tabular text pasted from
 * NCS web pages. Supports both header-row detection and positional fallback.
 */
import type {
  ParsedRosterRow,
  ParsedTournamentRow,
  RosterParseResult,
  TournamentParseResult,
} from './types'

// ─── URL validation ───────────────────────────────────────────────────────────

const NCS_URL_PATTERNS = [
  /^https?:\/\/(www\.)?ncssports\.org\//i,
  /^https?:\/\/(www\.)?norcalscout\.com\//i,
  /^https?:\/\/(www\.)?ncs\.org\//i,
  /^https?:\/\/(www\.)?playncs\.com\//i,
]

/**
 * Validates that a string looks like a plausible NCS team URL.
 * Returns true if it matches any known NCS domain pattern.
 */
export function validateNcsTeamUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    return NCS_URL_PATTERNS.some((re) => re.test(trimmed))
  } catch {
    return false
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Split a raw line into columns, handling both tab and multi-space delimiters. */
function splitLine(line: string): string[] {
  if (line.includes('\t')) {
    return line.split('\t').map((c) => c.trim())
  }
  // Two-or-more spaces as delimiter
  return line
    .split(/  +/)
    .map((c) => c.trim())
    .filter((c, i, arr) => i === 0 || c !== '' || arr.slice(i).some((x) => x !== ''))
}

/** Normalise text to lowercase with no extra whitespace for comparison. */
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Parse raw text into non-empty, non-comment lines with their column splits. */
function parseLines(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map(splitLine)
}

// ─── Roster header detection ──────────────────────────────────────────────────

const ROSTER_HEADER_KEYWORDS = [
  'name',
  'first',
  'last',
  'jersey',
  '#',
  'number',
  'position',
  'pos',
  'year',
  'grad',
  'id',
  'player',
  'bat',
  'throw',
]

/** Known NCS/baseball position codes, used by the positional fallback heuristic. */
const KNOWN_POSITIONS = new Set([
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'OF', 'UT', 'IF', 'DP',
])

function looksLikeRosterHeader(cols: string[]): boolean {
  const normed = cols.map(norm)
  const matches = normed.filter((c) => ROSTER_HEADER_KEYWORDS.some((k) => c.includes(k)))
  return matches.length >= 2
}

/** Map a header column label to a canonical field key. */
function mapRosterHeaderCol(col: string): string {
  const c = norm(col)
  if (c === 'id' || c === 'player id' || c === 'ncs id' || c === 'external id') return 'ncsExternalId'
  if (c.includes('first')) return 'firstName'
  if (c.includes('last')) return 'lastName'
  if (c === 'name' || c === 'player' || c === 'player name' || c === 'full name') return 'fullName'
  if (c.includes('jersey') || c === '#' || c === 'number' || c === 'no' || c === 'no.') return 'jerseyNumber'
  if (c.includes('pos')) return 'position'
  if (c.includes('bat')) return 'bats'
  if (c.includes('throw')) return 'throws'
  if (c.includes('grad') || c.includes('year') || c.includes('class')) return 'gradYear'
  return col
}

// ─── Roster parser ────────────────────────────────────────────────────────────

/**
 * Parse pasted NCS roster tabular text into structured rows.
 *
 * Strategy:
 * 1. Scan lines for a header row (≥2 recognisable column labels).
 * 2. If found: use column mapping for each data row.
 * 3. If not found: fall back to positional mapping
 *    (jersey, firstName, lastName, position, gradYear).
 */
export function parseNcsRosterText(text: string): RosterParseResult {
  const warnings: string[] = []
  const allLines = parseLines(text)

  if (allLines.length === 0) {
    return { rows: [], columns: [], parseMode: 'positional', warnings: ['Input was empty.'] }
  }

  // --- Header detection pass ---
  let headerIdx = -1
  for (let i = 0; i < Math.min(allLines.length, 5); i++) {
    if (looksLikeRosterHeader(allLines[i]!)) {
      headerIdx = i
      break
    }
  }

  if (headerIdx >= 0) {
    const rawHeaders = allLines[headerIdx]!
    const mappedHeaders = rawHeaders.map(mapRosterHeaderCol)
    const dataLines = allLines.slice(headerIdx + 1)
    const rows: ParsedRosterRow[] = []

    for (const cols of dataLines) {
      if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) continue
      const raw: Record<string, string> = {}
      rawHeaders.forEach((h, i) => {
        raw[h] = cols[i] ?? ''
      })
      const row: ParsedRosterRow = { raw }
      mappedHeaders.forEach((mapped, i) => {
        const val = (cols[i] ?? '').trim()
        if (!val) return
        switch (mapped) {
          case 'ncsExternalId':
            row.ncsExternalId = val
            break
          case 'firstName':
            row.firstName = val
            break
          case 'lastName':
            row.lastName = val
            break
          case 'fullName':
            row.fullName = val
            break
          case 'jerseyNumber':
            row.jerseyNumber = val.replace(/^#/, '')
            break
          case 'position':
            row.position = val
            break
          case 'bats':
            row.bats = val
            break
          case 'throws':
            row.throws = val
            break
          case 'gradYear':
            row.gradYear = val
            break
        }
      })
      // Derive fullName from first+last if not present
      if (!row.fullName && (row.firstName || row.lastName)) {
        row.fullName = [row.firstName, row.lastName].filter(Boolean).join(' ')
      }
      rows.push(row)
    }

    return { rows, columns: rawHeaders, parseMode: 'header', warnings }
  }

  // --- Positional fallback ---
  // No fixed column order assumed. Each cell is matched against a pattern
  // (jersey number, known position code, grad year) and removed from the
  // pool; whatever remains is joined back together as the player's name.
  warnings.push(
    'No header row detected; using positional heuristics (jersey #, position code, grad year, remainder = name).',
  )
  const POSITIONAL_COLS = ['jerseyNumber', 'fullName', 'position', 'gradYear']
  const rows: ParsedRosterRow[] = []

  for (const cols of allLines) {
    const cells = cols.map((c) => c.trim()).filter((c) => c.length > 0)
    if (cells.length === 0) continue
    const raw: Record<string, string> = {}
    POSITIONAL_COLS.forEach((label, i) => {
      raw[label] = cols[i] ?? ''
    })

    const remaining = [...cells]
    const row: ParsedRosterRow = { raw }

    const jerseyIdx = remaining.findIndex((c) => /^#?\d{1,3}$/.test(c))
    if (jerseyIdx !== -1) {
      row.jerseyNumber = remaining[jerseyIdx]!.replace(/^#/, '')
      remaining.splice(jerseyIdx, 1)
    }

    const posIdx = remaining.findIndex((c) => KNOWN_POSITIONS.has(c.toUpperCase()))
    if (posIdx !== -1) {
      row.position = remaining[posIdx]!.toUpperCase()
      remaining.splice(posIdx, 1)
    }

    const gradIdx = remaining.findIndex((c) => /^20\d{2}$/.test(c))
    if (gradIdx !== -1) {
      row.gradYear = remaining[gradIdx]
      remaining.splice(gradIdx, 1)
    }

    const name = remaining.join(' ').trim()
    if (name) row.fullName = name

    if (row.fullName || row.jerseyNumber) rows.push(row)
  }

  return { rows, columns: POSITIONAL_COLS, parseMode: 'positional', warnings }
}

// ─── Tournament header detection ──────────────────────────────────────────────

const TOURNAMENT_HEADER_KEYWORDS = [
  'tournament',
  'name',
  'event',
  'date',
  'location',
  'site',
  'age',
  'division',
  'id',
]

function looksLikeTournamentHeader(cols: string[]): boolean {
  const normed = cols.map(norm)
  const matches = normed.filter((c) =>
    TOURNAMENT_HEADER_KEYWORDS.some((k) => c.includes(k)),
  )
  return matches.length >= 2
}

function mapTournamentHeaderCol(col: string): string {
  const c = norm(col)
  if (c === 'id' || c === 'tournament id' || c === 'ncs id') return 'ncsExternalId'
  if (c === 'name' || c === 'tournament' || c === 'event' || c === 'tournament name' || c === 'event name') return 'name'
  if (c.includes('start') || c === 'date') return 'startDate'
  if (c.includes('end')) return 'endDate'
  if (c.includes('location') || c.includes('site') || c.includes('venue')) return 'location'
  if (c.includes('age') || c.includes('division') || c.includes('group')) return 'ageGroups'
  return col
}

// ─── Tournament parser ────────────────────────────────────────────────────────

/**
 * Parse pasted NCS tournament tabular text into structured rows.
 */
export function parseNcsTournamentText(text: string): TournamentParseResult {
  const warnings: string[] = []
  const allLines = parseLines(text)

  if (allLines.length === 0) {
    return { rows: [], columns: [], parseMode: 'positional', warnings: ['Input was empty.'] }
  }

  // --- Header detection ---
  let headerIdx = -1
  for (let i = 0; i < Math.min(allLines.length, 5); i++) {
    if (looksLikeTournamentHeader(allLines[i]!)) {
      headerIdx = i
      break
    }
  }

  if (headerIdx >= 0) {
    const rawHeaders = allLines[headerIdx]!
    const mappedHeaders = rawHeaders.map(mapTournamentHeaderCol)
    const dataLines = allLines.slice(headerIdx + 1)
    const rows: ParsedTournamentRow[] = []

    for (const cols of dataLines) {
      if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) continue
      const raw: Record<string, string> = {}
      rawHeaders.forEach((h, i) => {
        raw[h] = cols[i] ?? ''
      })
      const row: ParsedTournamentRow = { name: '', raw }
      mappedHeaders.forEach((mapped, i) => {
        const val = (cols[i] ?? '').trim()
        if (!val) return
        switch (mapped) {
          case 'ncsExternalId':
            row.ncsExternalId = val
            break
          case 'name':
            row.name = val
            break
          case 'startDate':
            row.startDate = val
            break
          case 'endDate':
            row.endDate = val
            break
          case 'location':
            row.location = val
            break
          case 'ageGroups':
            row.ageGroups = val
            break
        }
      })
      if (!row.name) {
        warnings.push(`Row with empty name skipped: ${cols.join(' | ')}`)
        continue
      }
      rows.push(row)
    }

    return { rows, columns: rawHeaders, parseMode: 'header', warnings }
  }

  // --- Positional fallback ---
  warnings.push(
    'No header row detected; using positional column order: name, date, location, age groups.',
  )
  const POSITIONAL_COLS = ['name', 'startDate', 'location', 'ageGroups']
  const rows: ParsedTournamentRow[] = []

  for (const cols of allLines) {
    if (cols.length === 0) continue
    const name = (cols[0] ?? '').trim()
    if (!name) continue
    const raw: Record<string, string> = {}
    POSITIONAL_COLS.forEach((label, i) => {
      raw[label] = cols[i] ?? ''
    })
    rows.push({
      name,
      startDate: (cols[1] ?? '').trim() || undefined,
      location: (cols[2] ?? '').trim() || undefined,
      ageGroups: (cols[3] ?? '').trim() || undefined,
      raw,
    })
  }

  return { rows, columns: POSITIONAL_COLS, parseMode: 'positional', warnings }
}
