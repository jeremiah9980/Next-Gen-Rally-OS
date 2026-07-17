/**
 * Server-side parsers for the public NCS Fastpitch portal (playncs.com).
 *
 * NCS does not publish a developer API, but its team search and team-detail
 * pages are plain server-rendered HTML. These functions take the raw HTML of
 * those pages and extract structured data so the Roster Dashboard can search
 * for a team and pull its roster without manual copy/paste. They are
 * intentionally pure (HTML in, data out) so they can be unit-tested without
 * any network access.
 */
import type { ParsedRosterRow } from './types'

export const NCS_BASE = 'https://www.playncs.com'

export interface NcsTeamResult {
  /** NCS numeric team id, e.g. "73839" */
  id: string
  name: string
  /** Age/class division, e.g. "12U C" */
  division: string
  /** City, State as shown on NCS, e.g. "Leander, TX" */
  location: string
  /** Win-Loss-Tie record, e.g. "36-26-1" */
  record: string
  /** Absolute URL to the team's NCS detail page */
  url: string
}

export interface NcsSeason {
  id: string
  label: string
}

export interface NcsRosterResult {
  teamName: string
  location: string
  division: string
  players: ParsedRosterRow[]
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
}

/** Strips tags + collapses whitespace + decodes entities from an HTML fragment. */
function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function matchAll(html: string, re: RegExp): RegExpMatchArray[] {
  return Array.from(html.matchAll(re))
}

/**
 * Parses the team-search results table from `/fastpitch/Teams?...`.
 * Each result row links to a team detail page; we pull the id, name, division,
 * location and record from the surrounding cells.
 */
export function parseTeamSearchResults(html: string): NcsTeamResult[] {
  const results: NcsTeamResult[] = []
  const seen = new Set<string>()

  for (const rowMatch of matchAll(html, /<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const row = rowMatch[1]!
    const link = row.match(/href="(\/fastpitch\/Teams\/Details\/(\d+)\/[^"]*)"/i)
    if (!link) continue

    const id = link[2]!
    if (seen.has(id)) continue

    const cells = matchAll(row, /<td[^>]*>([\s\S]*?)<\/td>/g).map((c) => stripTags(c[1]!))
    if (cells.length === 0) continue

    const nameMatch = row.match(/href="\/fastpitch\/Teams\/Details\/\d+\/[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
    const name = nameMatch ? stripTags(nameMatch[1]!) : cells[0]
    if (!name) continue

    seen.add(id)
    results.push({
      id,
      name,
      division: cells[1] || '',
      location: cells[2] || '',
      record: cells[3] || '',
      url: NCS_BASE + link[1],
    })
  }

  return results
}

/** Parses the season dropdown so the UI can offer season filtering. */
export function parseSeasons(html: string): NcsSeason[] {
  const select = html.match(/<select[^>]*id="SeasonId"[\s\S]*?<\/select>/i)
  if (!select) return []
  const seasons: NcsSeason[] = []
  for (const opt of matchAll(select[0], /<option[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)) {
    const id = opt[1]!.trim()
    const label = stripTags(opt[2]!)
    if (id && label) seasons.push({ id, label })
  }
  return seasons
}

/**
 * Parses a team detail page (`/fastpitch/Teams/Details/{id}`) into the team's
 * roster. The roster table is identified by its "Number" / "Player" headers.
 * Player names come from the anchor text in the player cell, which excludes the
 * trailing "Guest Player: ..." annotation NCS renders after the link.
 */
export function parseRoster(html: string): NcsRosterResult {
  const headings = matchAll(html, /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/g)
    .map((h) => stripTags(h[1]!))
    .filter(Boolean)

  const teamName = headings[0] || ''
  const location = headings.find((h) => /^[^,]+,\s*[A-Z]{2}$/.test(h)) || ''
  const division = headings.find((h) => /division|under/i.test(h)) || ''

  const tables = matchAll(html, /<table[\s\S]*?<\/table>/g).map((t) => t[0])
  const rosterTable = tables.find(
    (t) => /<th[^>]*>\s*Number\s*<\/th>/i.test(t) && /<th[^>]*>\s*Player\s*<\/th>/i.test(t),
  )

  const players: ParsedRosterRow[] = []
  if (rosterTable) {
    for (const rowMatch of matchAll(rosterTable, /<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = matchAll(rowMatch[1]!, /<td[^>]*>([\s\S]*?)<\/td>/g)
      if (cells.length < 2) continue

      const jerseyNumber = stripTags(cells[0]![1]!).replace(/[^0-9]/g, '')
      const anchor = cells[1]![1]!.match(/<a[^>]*>([\s\S]*?)<\/a>/i)
      let fullName = stripTags(anchor ? anchor[1]! : cells[1]![1]!)
      fullName = fullName.replace(/\s*Guest Player:.*$/i, '').trim()
      if (!fullName) continue

      players.push({
        fullName,
        jerseyNumber: jerseyNumber || undefined,
        raw: { Number: jerseyNumber, Player: fullName },
      })
    }
  }

  return { teamName, location, division, players }
}
