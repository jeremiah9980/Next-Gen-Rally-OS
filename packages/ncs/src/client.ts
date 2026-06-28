/**
 * Live client for the public NCS Fastpitch portal. Lets the Roster Dashboard
 * search for a team and pull its roster directly, instead of requiring the
 * coach to copy/paste table text. NCS has no developer API, so this fetches
 * and scrapes server-rendered HTML pages (see ./scrape).
 *
 * This is read-only and never writes anything — imported rows still flow
 * through the same preview → select → import action as the paste flow, so
 * governance (no auto-apply, ID → name → jersey matching) is unaffected.
 */
import {
  NCS_BASE,
  parseRoster,
  parseSeasons,
  parseTeamSearchResults,
  type NcsRosterResult,
  type NcsSeason,
  type NcsTeamResult,
} from './scrape'

const USER_AGENT = 'Mozilla/5.0 (compatible; RallyOS/1.0; +https://github.com/jeremiah9980/Next-Gen-Rally-OS)'

export interface SearchTeamsParams {
  teamName?: string
  city?: string
  /** Two-letter US state abbreviation, e.g. "TX" */
  state?: string
  /** NCS season id (see parseSeasons); defaults to NCS's current season */
  seasonId?: string
}

export interface SearchTeamsResponse {
  teams: NcsTeamResult[]
  seasons: NcsSeason[]
}

async function fetchHtml(url: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      cache: 'no-store',
    })
  } catch {
    throw new Error('Could not reach the NCS portal. Check your connection and try again.')
  }
  if (!res.ok) {
    throw new Error(`The NCS portal returned an error (HTTP ${res.status}).`)
  }
  return res.text()
}

/** Searches the public NCS Fastpitch portal for teams matching the criteria. */
export async function searchTeams(params: SearchTeamsParams): Promise<SearchTeamsResponse> {
  const qs = new URLSearchParams()
  if (params.teamName?.trim()) qs.set('teamName', params.teamName.trim())
  if (params.city?.trim()) qs.set('city', params.city.trim())
  if (params.state?.trim()) qs.set('usState', params.state.trim())
  if (params.seasonId?.trim()) qs.set('seasonId', params.seasonId.trim())

  const html = await fetchHtml(`${NCS_BASE}/fastpitch/Teams?${qs.toString()}`)
  return { teams: parseTeamSearchResults(html), seasons: parseSeasons(html) }
}

/** Fetches and parses a single NCS team's roster by its numeric NCS team id. */
export async function fetchRoster(teamId: string): Promise<NcsRosterResult> {
  if (!/^\d+$/.test(teamId)) {
    throw new Error('Invalid NCS team id.')
  }
  const html = await fetchHtml(`${NCS_BASE}/fastpitch/Teams/Details/${teamId}`)
  return parseRoster(html)
}
