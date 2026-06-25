/**
 * NCS Worker — core polling and diff logic.
 *
 * For each tracked NcsPlayerSource record:
 *   1. Optionally attempt to fetch the stored ncsTeamUrl (HTTP GET).
 *   2. Parse the response as tabular roster text (falls back to stored snapshot
 *      if the fetch fails or yields no parseable rows).
 *   3. Diff the fresh parse against the stored sourceSnapshot.
 *   4. Create NcsChangeReview items for any differences found.
 *
 * Hard rule: this worker NEVER modifies Player or RosterEntry records.
 * All detected changes surface as NcsChangeReview with status "change_detected".
 */
import { prisma } from '@rally/core-data'
import { parseNcsRosterText, diffRoster } from '@rally/ncs'
import type { ParsedRosterRow } from '@rally/ncs'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PollResult {
  teamSeasonId: string
  ncsTeamUrl: string | null
  reviewsCreated: number
  error?: string
}

// ─── URL fetch (best-effort, paste-and-parse fallback) ────────────────────────

const FETCH_TIMEOUT_MS = 10_000

async function tryFetchRosterText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NCS-Rally-Worker/1.0' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) return null
    const text = await response.text()
    // Lightweight extraction: look for <table> rows and pull text content
    // This is deliberately simple — the paste-and-parse pipeline handles the parsing.
    const tableText = extractTableText(text)
    return tableText || null
  } catch {
    return null
  }
}

/**
 * Very lightweight HTML table → tab-delimited text extractor.
 * Works well enough for NCS public pages whose tables follow standard structure.
 */
function extractTableText(html: string): string {
  const rows: string[] = []
  // Match <tr>...</tr> blocks
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let trMatch: RegExpExecArray | null
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1]
    // Match <th> and <td> cells
    const cells: string[] = []
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
    let cellMatch: RegExpExecArray | null
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      // Strip inner tags; replace non-breaking spaces; leave all other entities as-is.
      // We intentionally avoid decoding &amp; / &lt; / &gt; to prevent the
      // incomplete-sanitisation class of issues — the parser only needs plain text.
      const text = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      cells.push(text)
    }
    if (cells.length > 0) rows.push(cells.join('\t'))
  }
  return rows.join('\n')
}

// ─── Per-team poll ─────────────────────────────────────────────────────────────

/**
 * Poll all NcsPlayerSource records for a given (teamSeasonId, ncsTeamUrl) group,
 * diff against stored snapshots, and create NcsChangeReview items.
 */
async function pollTeam(
  teamSeasonId: string,
  ncsTeamUrl: string | null,
  storedSources: Array<{ id: string; sourceSnapshot: unknown }>,
): Promise<PollResult> {
  const storedRows: ParsedRosterRow[] = storedSources.map(
    (s) => s.sourceSnapshot as ParsedRosterRow,
  )

  let liveRows: ParsedRosterRow[] = []
  let fetchError: string | undefined

  if (ncsTeamUrl) {
    const fetchedText = await tryFetchRosterText(ncsTeamUrl)
    if (fetchedText) {
      const parsed = parseNcsRosterText(fetchedText)
      liveRows = parsed.rows
    } else {
      fetchError = `Could not fetch ${ncsTeamUrl} — skipping live poll for this team.`
    }
  }

  // If we couldn't fetch live data, nothing to diff
  if (liveRows.length === 0) {
    return { teamSeasonId, ncsTeamUrl, reviewsCreated: 0, error: fetchError }
  }

  const diff = diffRoster(storedRows, liveRows)

  if (diff.changes.length === 0) {
    // Update lastPolledAt even when no changes found
    await prisma.ncsPlayerSource.updateMany({
      where: { teamSeasonId, ncsTeamUrl: ncsTeamUrl ?? undefined },
      data: { lastPolledAt: new Date() },
    })
    return { teamSeasonId, ncsTeamUrl, reviewsCreated: 0 }
  }

  // Create NcsChangeReview items — NEVER touch Player or RosterEntry
  await prisma.ncsChangeReview.createMany({
    data: diff.changes.map((change) => ({
      teamSeasonId,
      changeType: change.changeType,
      status: 'change_detected' as const,
      payload: change as object,
    })),
  })

  await prisma.ncsPlayerSource.updateMany({
    where: { teamSeasonId, ncsTeamUrl: ncsTeamUrl ?? undefined },
    data: { lastPolledAt: new Date() },
  })

  return { teamSeasonId, ncsTeamUrl, reviewsCreated: diff.changes.length }
}

// ─── Main poll runner ─────────────────────────────────────────────────────────

export async function runNcsPoll(): Promise<void> {
  console.log(`[ncs-worker] Starting NCS poll at ${new Date().toISOString()}`)

  // Group sources by (teamSeasonId, ncsTeamUrl)
  const allSources = await prisma.ncsPlayerSource.findMany({
    where: { ncsTeamUrl: { not: null } },
    select: { id: true, teamSeasonId: true, ncsTeamUrl: true, sourceSnapshot: true },
  })

  type GroupKey = string
  const groups = new Map<GroupKey, typeof allSources>()
  for (const src of allSources) {
    const key = `${src.teamSeasonId}::${src.ncsTeamUrl ?? ''}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(src)
  }

  if (groups.size === 0) {
    console.log('[ncs-worker] No tracked NCS sources with URLs. Nothing to poll.')
    return
  }

  const results: PollResult[] = []
  for (const [, sources] of groups) {
    const first = sources[0]
    const result = await pollTeam(first.teamSeasonId, first.ncsTeamUrl, sources)
    results.push(result)
  }

  for (const r of results) {
    if (r.error) {
      console.warn(`[ncs-worker] ${r.ncsTeamUrl ?? r.teamSeasonId}: ${r.error}`)
    } else {
      console.log(
        `[ncs-worker] ${r.ncsTeamUrl ?? r.teamSeasonId}: ${r.reviewsCreated} new change review(s)`,
      )
    }
  }

  console.log(`[ncs-worker] Poll complete at ${new Date().toISOString()}`)
}
